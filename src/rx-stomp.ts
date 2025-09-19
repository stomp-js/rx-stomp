import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  Observable,
  Observer,
  share,
  Subject,
  Subscription,
  take,
} from 'rxjs';

import {
  Client,
  debugFnType,
  IFrame,
  IMessage,
  publishParams,
  StompConfig,
  StompHeaders,
  StompSubscription,
} from '@stomp/stompjs';

import { RxStompConfig } from './rx-stomp-config.js';
import { IRxStompPublishParams } from './i-rx-stomp-publish-params.js';
import { RxStompState } from './rx-stomp-state.js';
import { IWatchParams } from './i-watch-params.js';

/**
 * Main RxJS-friendly STOMP client for browsers and Node.js.
 *
 * RxStomp wraps {@link Client} from @stomp/stompjs and exposes key interactions
 * (connection lifecycle, subscriptions, frames, and errors) as RxJS streams.
 *
 * What RxStomp adds:
 * - Simple, observable-based API for consuming messages.
 * - Connection lifecycle as BehaviorSubjects/Observables for easy UI binding.
 * - Transparent reconnection support (configurable through {@link RxStompConfig}).
 * - Convenience helpers for receipts and server headers.
 *
 * Typical lifecycle:
 * - Instantiate: `const rxStomp = new RxStomp();`
 * - Configure: `rxStomp.configure({...});`
 * - Activate: `rxStomp.activate();`
 * - Consume: `rxStomp.watch({ destination: '/topic/foo' }).subscribe(...)`
 * - Publish: `rxStomp.publish({ destination: '/topic/foo', body: '...' })`
 * - Deactivate when done: `await rxStomp.deactivate();`
 *
 * Notes:
 * - Except for `beforeConnect`, all callbacks from @stomp/stompjs are exposed
 *   as RxJS Subjects/Observables here.
 * - RxStomp tries to transparently handle connection failures.
 *
 * Part of `@stomp/rx-stomp`.
 */
export class RxStomp {
  /**
   * Connection state as a BehaviorSubject.
   *
   * - Emits immediately with the current state (initially `CLOSED`).
   * - Use this for binding UI widgets or guards based on connection status.
   * - State values are from {@link RxStompState}.
   */
  public readonly connectionState$: BehaviorSubject<RxStompState>;

  /**
   * Emits whenever a connection is established (including re-connections).
   *
   * - If already connected, it emits immediately on subscription.
   * - The emitted value is always `RxStompState.OPEN`.
   * - Useful as a trigger to (re)establish subscriptions or flush local queues.
   */
  public readonly connected$: Observable<RxStompState>;

  /**
   * These will be triggered before connectionState$ and connected$.
   * During reconnecting, it will allow subscriptions to be reinstated before sending
   * queued messages.
   */
  private _connectionStatePre$: BehaviorSubject<RxStompState>;
  private _connectedPre$: Observable<RxStompState>;

  /**
   * Provides headers from the most recent CONNECTED frame from the broker.
   *
   * - Emits on every successful (re)connection.
   * - If already connected, emits immediately on subscription.
   * - Typical headers include `server`, `session`, and negotiated `version`.
   */
  public readonly serverHeaders$: Observable<StompHeaders>;

  protected _serverHeadersBehaviourSubject$: BehaviorSubject<null | StompHeaders>;

  /**
   * Streams any unhandled MESSAGE frames.
   *
   * Use this to receive:
   * - (RabbitMQ specific) Messages delivered to temporary or auto-named queues.
   * - Stray messages arriving during unsubscribe processing.
   *
   * Emits raw {@link IMessage} instances.
   *
   * Maps to: [Client#onUnhandledMessage]{@link Client#onUnhandledMessage}.
   */
  public readonly unhandledMessage$: Subject<IMessage>;

  /**
   * Streams any unhandled non-MESSAGE, non-ERROR frames.
   *
   * Normally unused unless interacting with non-compliant brokers or testing.
   *
   * Emits raw {@link IFrame} instances.
   *
   * Maps to: [Client#onUnhandledFrame]{@link Client#onUnhandledFrame}.
   */
  public readonly unhandledFrame$: Subject<IFrame>;

  /**
   * Streams any RECEIPT frames that do not match a watcher set via asyncReceipt helpers.
   *
   * Prefer {@link asyncReceipt} patterns where possible; fall back to this for low-level needs.
   *
   * Emits raw {@link IFrame} instances.
   *
   * Maps to: [Client#onUnhandledReceipt]{@link Client#onUnhandledReceipt}.
   */
  public readonly unhandledReceipts$: Subject<IFrame>;

  /**
   * Streams all ERROR frames from the broker.
   *
   * Most brokers will close the connection after an ERROR frame.
   *
   * Emits raw {@link IFrame} instances.
   *
   * Maps to: [Client#onStompError]{@link Client#onStompError}.
   */
  public readonly stompErrors$: Subject<IFrame>;

  /**
   * Streams errors emitted by the underlying WebSocket.
   *
   * Emits a DOM {@link Event}.
   *
   * Maps to: [Client#onWebSocketError]{@link Client#onWebSocketError}.
   */
  public readonly webSocketErrors$: Subject<Event>;

  /**
   * Internal array to hold locally queued messages when STOMP broker is not connected.
   */
  protected _queuedMessages: publishParams[] = [];

  /**
   * Instance of actual
   * [@stomp/stompjs]{@link https://github.com/stomp-js/stompjs}
   * {@link Client}.
   *
   * **Be careful in calling methods on it directly - you may get unintended consequences.**
   */
  get stompClient(): Client {
    return this._stompClient;
  }
  protected _stompClient: Client;

  /**
   * Before connect
   */
  protected _beforeConnect: (client: RxStomp) => void | Promise<void>;

  /**
   * Correlate errors
   */
  protected _correlateErrors: (error: IFrame) => string;

  /**
   * Will be assigned during configuration, no-op otherwise
   */
  protected _debug: debugFnType;

  /**
   * Constructor
   *
   * @param stompClient Optional existing {@link Client} to wrap. If omitted, a new instance
   * will be created internally.
   *
   * Tip: Injecting a pre-configured Client is useful for advanced customization or testing.
   */
  public constructor(stompClient?: Client) {
    this._stompClient = stompClient ? stompClient : new Client();

    const noOp = () => {};

    // Before connect is no op by default
    this._beforeConnect = noOp;

    // Correlate errors is falsey op by default
    this._correlateErrors = () => undefined;

    // debug is no-op by default
    this._debug = noOp;

    // Initial state is CLOSED
    this._connectionStatePre$ = new BehaviorSubject<RxStompState>(
      RxStompState.CLOSED,
    );

    this._connectedPre$ = this._connectionStatePre$.pipe(
      filter((currentState: RxStompState) => {
        return currentState === RxStompState.OPEN;
      }),
    );

    // Initial state is CLOSED
    this.connectionState$ = new BehaviorSubject<RxStompState>(
      RxStompState.CLOSED,
    );

    this.connected$ = this.connectionState$.pipe(
      filter((currentState: RxStompState) => {
        return currentState === RxStompState.OPEN;
      }),
    );

    // Setup sending queuedMessages
    this.connected$.subscribe(() => {
      this._sendQueuedMessages();
    });

    this._serverHeadersBehaviourSubject$ =
      new BehaviorSubject<null | StompHeaders>(null);

    this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(
      filter((headers: null | StompHeaders) => {
        return headers !== null;
      }),
    );

    this.stompErrors$ = new Subject<IFrame>();
    this.unhandledMessage$ = new Subject<IMessage>();
    this.unhandledReceipts$ = new Subject<IFrame>();
    this.unhandledFrame$ = new Subject<IFrame>();
    this.webSocketErrors$ = new Subject<Event>();
  }

  /**
   * Apply configuration to the underlying STOMP client.
   *
   * - Safe to call multiple times; each call merges with existing configuration.
   * - `beforeConnect` and `correlateErrors` are handled by RxStomp and removed
   *   from the object passed to the underlying {@link Client}.
   * - Unless otherwise documented by @stomp/stompjs, most options take effect
   *   on the next (re)connection.
   *
   * Example:
   * ```typescript
   * const rxStomp = new RxStomp();
   * rxStomp.configure({
   *   brokerURL: 'ws://127.0.0.1:15674/ws',
   *   connectHeaders: {
   *     login: 'guest',
   *     passcode: 'guest'
   *     },
   *   heartbeatIncoming: 0,
   *   heartbeatOutgoing: 20000,
   *   reconnectDelay: 200,
   *   debug: (msg) => console.log(new Date(), msg),
   * });
   * rxStomp.activate();
   * ```
   *
   * Maps to: [Client#configure]{@link Client#configure}.
   */
  public configure(rxStompConfig: RxStompConfig) {
    const stompConfig: RxStompConfig = (Object as any).assign(
      {},
      rxStompConfig,
    );

    if (stompConfig.beforeConnect) {
      this._beforeConnect = stompConfig.beforeConnect;
      delete stompConfig.beforeConnect;
    }

    if (stompConfig.correlateErrors) {
      this._correlateErrors = stompConfig.correlateErrors;
      delete stompConfig.correlateErrors;
    }

    // RxStompConfig has subset of StompConfig fields
    this._stompClient.configure(stompConfig as unknown as StompConfig);
    if (stompConfig.debug) {
      this._debug = stompConfig.debug;
    }
  }

  /**
   * Activate the client and initiate connection attempts.
   *
   * - Emits `CONNECTING` followed by `OPEN` on successful connect.
   * - Automatically reconnects, according to configuration.
   *
   * To stop auto-reconnect and close the connection, call {@link deactivate}.
   *
   * Maps to: [Client#activate]{@link Client#activate}.
   */
  public activate(): void {
    this._stompClient.configure({
      beforeConnect: async () => {
        this._changeState(RxStompState.CONNECTING);

        // Call handler
        await this._beforeConnect(this);
      },
      onConnect: (frame: IFrame) => {
        this._serverHeadersBehaviourSubject$.next(frame.headers);

        // Indicate our connected state to observers
        this._changeState(RxStompState.OPEN);
      },
      onStompError: (frame: IFrame) => {
        // Trigger the frame subject
        this.stompErrors$.next(frame);
      },
      onWebSocketClose: () => {
        this._changeState(RxStompState.CLOSED);
      },
      onUnhandledMessage: (message: IMessage) => {
        this.unhandledMessage$.next(message);
      },
      onUnhandledReceipt: (frame: IFrame) => {
        this.unhandledReceipts$.next(frame);
      },
      onUnhandledFrame: (frame: IFrame) => {
        this.unhandledFrame$.next(frame);
      },
      onWebSocketError: (evt: Event) => {
        this.webSocketErrors$.next(evt);
      },
    });

    // Attempt connection
    this._stompClient.activate();
  }

  /**
   * Gracefully disconnect (if connected) and stop auto-reconnect.
   *
   * Behavior:
   * - Emits `CLOSING` then `CLOSED`.
   * - If no active WebSocket exists, resolves immediately.
   * - If a WebSocket is active, resolves after it is properly closed.
   *
   * Experimental:
   * - `options.force === true` immediately discards the underlying connection.
   *   See [Client#deactivate]{@link Client#deactivate}.
   *
   * You can call {@link activate} again after awa.
   *
   * Maps to: [Client#deactivate]{@link Client#deactivate}.
   */
  public async deactivate(options: { force?: boolean } = {}): Promise<void> {
    this._changeState(RxStompState.CLOSING);

    // The promise will be resolved immediately if there is no active connection
    // otherwise, after it has successfully disconnected.
    await this._stompClient.deactivate(options);

    this._changeState(RxStompState.CLOSED);
  }

  /**
   * Whether the broker connection is currently OPEN.
   *
   * Equivalent to checking `connectionState$.value === RxStompState.OPEN`.
   */
  public connected(): boolean {
    return this.connectionState$.getValue() === RxStompState.OPEN;
  }

  /**
   * True if the client is ACTIVE — i.e., connected or attempting reconnection.
   *
   * Maps to: [Client#active]{@link Client#active}.
   */
  get active(): boolean {
    return this.stompClient.active;
  }

  /**
   * Publish a message to a destination on the broker.
   *
   * Destination semantics and supported headers are broker-specific; consult your broker’s docs
   * for naming conventions (queues, topics, exchanges) and header support.
   *
   * Payload
   * - Text: provide `body` as a string. Convert non-strings yourself (e.g., JSON.stringify).
   * - Binary: provide `binaryBody` as a Uint8Array and set an appropriate `content-type` header.
   *   Some brokers may require explicit configuration for binary frames.
   *
   * Frame sizing and content-length
   * - For text messages, a `content-length` header is added by default.
   *   Set `skipContentLengthHeader: true` to omit it for text frames.
   * - For binary messages, `content-length` is always included.
   *
   * Caution
   * - If a message body contains NULL octets and the `content-length` header is omitted,
   *   many brokers will report an error and disconnect.
   *
   * Offline/queueing behavior
   * - If not connected, messages are queued locally and sent upon reconnection.
   * - To disable this behavior, set `retryIfDisconnected: false` in the parameters.
   *   In that case, this method throws if it cannot send immediately.
   *
   * Related
   * - Broker acknowledgment (receipt) can be tracked using `receipt` headers together with {@link asyncReceipt}.
   *
   * Maps to: [Client#publish]{@link Client#publish}
   *
   * See: {@link IRxStompPublishParams} and {@link IPublishParams}
   *
   * Examples:
   * ```javascript
   * // Text with custom headers
   * rxStomp.publish({ destination: "/queue/test", headers: { priority: 9 }, body: "Hello, STOMP" });
   *
   * // Minimal (destination is required)
   * rxStomp.publish({ destination: "/queue/test", body: "Hello, STOMP" });
   *
   * // Skip content-length header for text
   * rxStomp.publish({ destination: "/queue/test", body: "Hello, STOMP", skipContentLengthHeader: true });
   *
   * // Binary payload
   * const binaryData = generateBinaryData(); // Uint8Array
   * rxStomp.publish({
   *   destination: "/topic/special",
   *   binaryBody: binaryData,
   *   headers: { "content-type": "application/octet-stream" }
   * });
   * ```
   */
  public publish(parameters: IRxStompPublishParams): void {
    // retry behaviour is defaulted to true
    const shouldRetry =
      parameters.retryIfDisconnected == null
        ? true
        : parameters.retryIfDisconnected;

    if (this.connected()) {
      this._stompClient.publish(parameters);
    } else if (shouldRetry) {
      this._debug(`Not connected, queueing`);
      this._queuedMessages.push(parameters);
    } else {
      throw new Error('Cannot publish while broker is not connected');
    }
  }

  /** It will send queued messages. */
  protected _sendQueuedMessages(): void {
    const queuedMessages = this._queuedMessages;
    this._queuedMessages = [];

    if (queuedMessages.length === 0) {
      return;
    }

    this._debug(`Will try sending  ${queuedMessages.length} queued message(s)`);

    for (const queuedMessage of queuedMessages) {
      this._debug(`Attempting to send ${queuedMessage}`);
      this.publish(queuedMessage);
    }
  }

  /**
   * Subscribe to a destination and receive messages as an RxJS Observable.
   *
   * Connection resilience
   * - Safe to call when disconnected; it will subscribe upon the next connection.
   * - On reconnect, it re-subscribes automatically to the same destination unless
   *   `subscribeOnlyOnce: true` is specified.
   * - Messages may be missed during broker-side reconnect windows (typical for STOMP brokers).
   *
   * Options
   * - Provide an {@link IWatchParams} object to set subscription (`subHeaders`) and unsubscription
   *   (`unsubHeaders`) headers, and to control resubscription behavior (`subscribeOnlyOnce`).
   *
   * Returns
   * - A hot Observable that remains stable across reconnects. Multiple subscribers share the
   *   same underlying STOMP subscription.
   *
   * Maps to: [Client#subscribe]{@link Client#subscribe}
   */
  public watch(opts: IWatchParams): Observable<IMessage>;
  /**
   * See the other overload for details.
   *
   * @param destination Destination to subscribe to
   * @param headers Optional subscription headers
   */
  public watch(
    destination: string,
    headers?: StompHeaders,
  ): Observable<IMessage>;
  public watch(
    opts: string | IWatchParams,
    headers: StompHeaders = {},
  ): Observable<IMessage> {
    const defaults: IWatchParams = {
      subHeaders: {},
      unsubHeaders: {},
      subscribeOnlyOnce: false,
    };

    let params: IWatchParams;

    if (typeof opts === 'string') {
      params = Object.assign({}, defaults, {
        destination: opts,
        subHeaders: headers,
      });
    } else {
      params = Object.assign({}, defaults, opts);
    }

    /* Well, the logic is complicated but works beautifully. RxJS is indeed wonderful.
     *
     * We need to activate the underlying subscription immediately if Stomp is connected. If not, it should
     * subscribe when it gets next connected. Further, it should re-establish the subscription whenever Stomp
     * successfully reconnects.
     *
     * Actual implementation is simple, we filter the BehaviourSubject 'state' so that we can trigger whenever Stomp is
     * connected. Since 'state' is a BehaviourSubject, if Stomp is already connected, it will immediately trigger.
     *
     * The observable that we return to the caller remains the same across all reconnects, so no special handling needed at
     * the message subscriber.
     */
    this._debug(`Request to subscribe ${params.destination}`);

    const coldObservable = Observable.create((messages: Observer<IMessage>) => {
      /*
       * These variables will be used as part of the closure and work their magic during unsubscribe
       */
      let stompSubscription: StompSubscription; // Stomp

      let stompConnectedSubscription: Subscription; // RxJS

      let connectedPre$ = this._connectedPre$;

      if (params.subscribeOnlyOnce) {
        connectedPre$ = connectedPre$.pipe(take(1));
      }

      const stompErrorsSubscription = this.stompErrors$.subscribe(
        (error: IFrame) => {
          const correlatedDestination = this._correlateErrors(error);
          if (correlatedDestination === params.destination) {
            messages.error(error);
          }
        },
      );

      stompConnectedSubscription = connectedPre$.subscribe(() => {
        this._debug(`Will subscribe to ${params.destination}`);
        let subHeaders = params.subHeaders;
        if (typeof subHeaders === 'function') {
          subHeaders = subHeaders();
        }
        stompSubscription = this._stompClient.subscribe(
          params.destination,
          (message: IMessage) => {
            messages.next(message);
          },
          subHeaders,
        );
      });

      return () => {
        /* cleanup function, it will be called when no subscribers are left */
        this._debug(
          `Stop watching connection state (for ${params.destination})`,
        );
        stompConnectedSubscription.unsubscribe();
        stompErrorsSubscription.unsubscribe();

        if (this.connected()) {
          this._debug(`Will unsubscribe from ${params.destination} at Stomp`);
          let unsubHeaders = params.unsubHeaders;
          if (typeof unsubHeaders === 'function') {
            unsubHeaders = unsubHeaders();
          }
          stompSubscription.unsubscribe(unsubHeaders);
        } else {
          this._debug(
            `Stomp not connected, no need to unsubscribe from ${params.destination} at Stomp`,
          );
        }
      };
    });

    /**
     * Important - convert it to hot Observable - otherwise, if the user code subscribes
     * to this observable twice, it will subscribe twice to Stomp broker. (This was happening in the current example).
     * A long but good explanatory article at https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339
     */
    return coldObservable.pipe(share());
  }

  /**
   * **Deprecated** Please use {@link asyncReceipt}.
   */
  public watchForReceipt(
    receiptId: string,
    callback: (frame: IFrame) => void,
  ): void {
    this._stompClient.watchForReceipt(receiptId, callback);
  }

  /**
   * Wait for a broker RECEIPT matching the provided receipt-id.
   *
   * How it works
   * - To request an acknowledgment for an operation (e.g., publish, subscribe, unsubscribe),
   *   include a `receipt` header in that operation with a unique value.
   * - A compliant broker will respond with a `RECEIPT` frame whose `receipt-id` header equals
   *   the value you sent in the `receipt` header.
   * - This method returns a Promise that resolves with the matching {@link IFrame} when the
   *   corresponding `RECEIPT` arrives.
   *
   * Receipt identifiers
   * - Must be unique per request; generating a UUID or monotonic sequence is typical.
   *
   * Notes
   * - The Promise resolves once for the first matching receipt and then completes.
   * - No timeout is enforced by default; to add one, wrap with your own timeout logic (e.g., Promise.race).
   *
   * Example:
   * ```javascript
   * // Publish with receipt tracking
   * const receiptId = randomText();
   * rxStomp.publish({
   *   destination: "/topic/special",
   *   headers: { receipt: receiptId },
   *   body: msg
   * });
   * const receiptFrame = await rxStomp.asyncReceipt(receiptId); // resolves with the RECEIPT frame
   * ```
   *
   * Maps to: [Client#watchForReceipt]{@link Client#watchForReceipt}
   */
  public asyncReceipt(receiptId: string): Promise<IFrame> {
    return firstValueFrom(
      this.unhandledReceipts$.pipe(
        filter(frame => frame.headers['receipt-id'] === receiptId),
      ),
    );
  }

  protected _changeState(state: RxStompState): void {
    this._connectionStatePre$.next(state);
    this.connectionState$.next(state);
  }
}
