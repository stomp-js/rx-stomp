import {BehaviorSubject, Observable, Observer, Subject, Subscription} from 'rxjs';

import {filter, share} from 'rxjs/operators';

import {Client, debugFnType, Frame, Message, publishParams, StompHeaders, StompSubscription} from '@stomp/stompjs';

import {RxStompConfig} from './rx-stomp-config';
import {StompState} from './stomp-state';

/**
 * You will only need the public properties and
 * methods listed unless you are an advanced user. This class handles subscribing to a
 * message queue using the stomp.js library, and returns
 * values via the ES6 Observable specification for
 * asynchronous value streaming by wiring the STOMP
 * messages into an observable.
 */
export class RxStomp {
  /**
   * Connection State
   *
   * It is a BehaviorSubject and will emit current status immediately. This will typically get
   * used to show current status to the end user.
   */
  public connectionState$: BehaviorSubject<StompState>;

  /**
   * Will trigger when connection is established. Use this to carry out initialization.
   * It will trigger every time a (re)connection occurs. If it is already connected
   * it will trigger immediately. You can safely ignore the value, as it will always be
   * StompState.CONNECTED
   */
  public connected$: Observable<StompState>;

  /**
   * Provides headers from most recent connection to the server as return by the CONNECTED
   * frame.
   * If the STOMP connection has already been established it will trigger immediately.
   * It will additionally trigger in event of reconnection, the value will be set of headers from
   * the recent server response.
   */
  public serverHeaders$: Observable<StompHeaders>;

  protected _serverHeadersBehaviourSubject$: BehaviorSubject<null | StompHeaders>;

  /**
   * Will emit all messages to the default queue (any message that are not handled by a subscription)
   */
  public defaultMessages$: Subject<Message>;

  /**
   * Will emit all receipts
   */
  public unhandledReceipts$: Subject<Frame>;

  /**
   * Will trigger when an error occurs. This Subject can be used to handle errors from
   * the stomp broker.
   */
  public stompErrors$: Subject<Frame>;

  /**
   * Internal array to hold locally queued messages when STOMP broker is not connected.
   */
  protected _queuedMessages: publishParams[] = [];

  /**
   * STOMP Client from @stomp/stompjs.
   * Be careful in calling methods directly it may have unintended consequences.
   */
  get stompClient(): Client {
    return this._stompClient;
  }
  protected _stompClient: Client;

  /**
   * Will be assigned during configuration, no-op otherwise
   */
  protected _debug: debugFnType;

  /**
   * Constructor
   *
   * See README and samples for configuration examples
   */
  public constructor() {
    this._stompClient = new Client();

    // Default messages
    this.setupOnReceive();

    // Receipts
    this.setupReceipts();

    // debug is no-op by default
    this._debug = () => {};

    // Initial state is CLOSED
    this.connectionState$ = new BehaviorSubject<StompState>(StompState.CLOSED);

    this.connected$ = this.connectionState$.pipe(
      filter((currentState: StompState) => {
        return currentState === StompState.CONNECTED;
      })
    );

    // Setup sending queuedMessages
    this.connected$.subscribe(() => {
      this.sendQueuedMessages();
    });

    this._serverHeadersBehaviourSubject$ = new BehaviorSubject<null | StompHeaders>(null);

    this.serverHeaders$ = this._serverHeadersBehaviourSubject$.pipe(
      filter((headers: null | StompHeaders) => {
        return headers !== null;
      })
    );

    this.stompErrors$ = new Subject();
  }

  /** Set configuration */
  public configure(rxStompConfig: RxStompConfig) {
    // RxStompConfig has subset of StompConfig fields
    this._stompClient.configure(rxStompConfig);
    if (rxStompConfig.debug) {
      this._debug = rxStompConfig.debug;
    }
  }

  /**
   * It will connect to the STOMP broker.
   */
  public activate(): void {
    this._stompClient.configure({
      beforeConnect: () => {
        // Call handler
        if (this._stompClient.active) {
          this._changeState(StompState.TRYING);
        }
      },
      onConnect: (frame: Frame) => {
        this._serverHeadersBehaviourSubject$.next(frame.headers);

        // Indicate our connected state to observers
        this._changeState(StompState.CONNECTED);
      },
      onStompError: (frame: Frame) => {
        // Trigger the frame subject
        this.stompErrors$.next(frame);
      },
      onWebSocketClose: () => {
        this._changeState(StompState.CLOSED);
      }
    });

    // Attempt connection
    this._stompClient.activate();
  }

  /**
   * It will disconnect from the STOMP broker and stop retires to connect.
   */
  public deactivate(): void {
    // Disconnect if connected. Callback will set CLOSED state
    this._stompClient.deactivate();

    const stompState = this.connectionState$.getValue();
    if (stompState === StompState.CONNECTED) {
      // Notify observers that we are disconnecting!
      this._changeState(StompState.DISCONNECTING);
    }
    // This is bit tricky situation, it would be better handled at stompjs level
    if (stompState === StompState.TRYING) {
      // Notify observers that we are disconnecting!
      this._changeState(StompState.CLOSED);
    }
  }

  /**
   * It will return `true` if STOMP broker is connected and `false` otherwise.
   */
  public connected(): boolean {
    return this.connectionState$.getValue() === StompState.CONNECTED;
  }

  /**
   * It will send a message to a named destination. The message must be `string`.
   *
   * The message will get locally queued if the STOMP broker is not connected. It will attempt to
   * publish queued messages as soon as the broker gets connected.
   */
  public publish(parameters: publishParams): void {
    if (this.connected()) {
      this._stompClient.publish(parameters);
    } else {
      this._debug(`Not connected, queueing`);
      this._queuedMessages.push(parameters);
    }
  }

  /** It will send queued messages. */
  protected sendQueuedMessages(): void {
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
   * It will subscribe to server message queues
   *
   * This method can be safely called even if the STOMP broker is not connected.
   * If the underlying STOMP connection drops and reconnects, it will resubscribe automatically.
   *
   * If a header field 'ack' is not explicitly passed, 'ack' will be set to 'auto'. If you
   * do not understand what it means, please leave it as is.
   *
   * Note that when working with temporary queues where the subscription request
   * creates the
   * underlying queue, mssages might be missed during reconnect. This issue is not specific
   * to this library but the way STOMP brokers are designed to work.
   *
   * @param queueName
   * @param headers
   */
  public subscribe(queueName: string, headers: StompHeaders = {}): Observable<Message> {

    /* Well the logic is complicated but works beautifully. RxJS is indeed wonderful.
     *
     * We need to activate the underlying subscription immediately if Stomp is connected. If not it should
     * subscribe when it gets next connected. Further it should re establish the subscription whenever Stomp
     * successfully reconnects.
     *
     * Actual implementation is simple, we filter the BehaviourSubject 'state' so that we can trigger whenever Stomp is
     * connected. Since 'state' is a BehaviourSubject, if Stomp is already connected, it will immediately trigger.
     *
     * The observable that we return to caller remains same across all reconnects, so no special handling needed at
     * the message subscriber.
     */
    this._debug(`Request to subscribe ${queueName}`);

    // By default auto acknowledgement of messages
    if (!headers.ack) {
      headers.ack = 'auto';
    }

    const coldObservable = Observable.create(
      (messages: Observer<Message>) => {
        /*
         * These variables will be used as part of the closure and work their magic during unsubscribe
         */
        let stompSubscription: StompSubscription;

        let stompConnectedSubscription: Subscription;

        stompConnectedSubscription = this.connected$.subscribe(() => {
            this._debug(`Will subscribe to ${queueName}`);
            stompSubscription = this._stompClient.subscribe(queueName, (message: Message) => {
                messages.next(message);
              },
              headers);
          });

        return () => { /* cleanup function, will be called when no subscribers are left */
          this._debug(`Stop watching connection state (for ${queueName})`);
          stompConnectedSubscription.unsubscribe();

          if (this.connected()) {
            this._debug(`Will unsubscribe from ${queueName} at Stomp`);
            stompSubscription.unsubscribe();
          } else {
            this._debug(`Stomp not connected, no need to unsubscribe from ${queueName} at Stomp`);
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
   * It will handle messages received in the default queue. Messages that would not be handled otherwise
   * get delivered to the default queue.
   */
  protected setupOnReceive(): void {
    this.defaultMessages$ = new Subject();

    this._stompClient.onUnhandledMessage = (message: Message) => {
      this.defaultMessages$.next(message);
    };
  }

  /**
   * It will emit all receipts.
   */
  protected setupReceipts(): void {
    this.unhandledReceipts$ = new Subject();

    this._stompClient.onUnhandledReceipt = (frame: Frame) => {
      this.unhandledReceipts$.next(frame);
    };
  }

  /**
   * Wait for receipt, this indicates that server has carried out the related operation
   */
  public waitForReceipt(receiptId: string, callback: (frame: Frame) => void): void {
    this._stompClient.watchForReceipt(receiptId, callback);
  }

  protected _changeState(state: StompState): void {
    this.connectionState$.next(state);
  }

}
