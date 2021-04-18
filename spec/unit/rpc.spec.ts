// These are likely to fail on any broker other than RabbitMQ
// Works with ActiveMQ, with special init function

import "jasmine";

import { Message } from "@stomp/stompjs";
import { UUID } from "angular2-uuid";

import { RxStomp, RxStompRPC } from "../../src";

import { generateBinaryData } from "../helpers/content-helpers";
import { ensureRxStompConnected } from "../helpers/helpers";
import { rxStompFactory } from "../helpers/rx-stomp-factory";

function startRPCServer(rxStomp: RxStomp, myRPCEndPoint: string, done: () => void) {
  const receiptId = UUID.UUID();

  rxStomp
    .watch(myRPCEndPoint, { receipt: receiptId })
    .subscribe((message: Message) => {
      const replyTo = message.headers["reply-to"];
      const correlationId = message.headers["correlation-id"];
      const incomingMessage = message.binaryBody;

      rxStomp.publish({
        destination: replyTo,
        binaryBody: incomingMessage,
        headers: { "correlation-id": correlationId }
      });
    });

  rxStomp.watchForReceipt(receiptId, () => {
    done();
  });
}

describe("RPC", () => {
  const myRPCEndPoint = "/topic/echo";

  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;

  // Wait till RxStomp is actually connected
  beforeAll(done => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp);
    ensureRxStompConnected(rxStomp, done);
  });

  beforeAll(done => startRPCServer(rxStomp, myRPCEndPoint, done));

  it("Simple RPC", done => {
    // Watch for RPC response

    const msg = "Hello";
    rxStompRPC
      .rpc({ destination: myRPCEndPoint, body: msg })
      .subscribe((message: Message) => {
        expect(message.body).toEqual(msg);
        done();
      });
  });

  it("RPC with custom correlation-id", done => {
    // Watch for RPC response

    const msg = "Hello";
    const customCorrelationId = `custom-${UUID.UUID()}`;
    const headers = { "correlation-id": customCorrelationId };
    rxStompRPC
      .rpc({ destination: myRPCEndPoint, body: msg, headers })
      .subscribe((message: Message) => {
        expect(message.body).toEqual(msg);
        expect(message.headers["correlation-id"]).toEqual(customCorrelationId);
        done();
      });
  });

  it("RPC with binary payload", done => {
    // Watch for RPC response

    const binaryMsg = generateBinaryData(1);
    rxStompRPC
      .rpc({ destination: myRPCEndPoint, binaryBody: binaryMsg })
      .subscribe((message: Message) => {
        expect(message.binaryBody.toString()).toEqual(binaryMsg.toString());
        done();
      });
  });

  it("Should not leak", done => {
    const numSubscribers = () => {
      return rxStomp.unhandledMessage$.observers.length;
    };

    const origNumSubcribers = numSubscribers();

    const msg = "Hello";
    // Watch for RPC response
    rxStompRPC
      .rpc({ destination: myRPCEndPoint, body: msg })
      .subscribe((message: Message) => {
        expect(message.body).toEqual(msg);
        setTimeout(() => {
          expect(numSubscribers()).toBe(origNumSubcribers);
          done();
        }, 0);
      });

    expect(numSubscribers()).toBe(origNumSubcribers + 1);
  });
});

describe("Custom Queue RPC", () => {
  const myRPCEndPoint = "/topic/echo";

  let rxStomp: RxStomp;
  let rxStompRPC: RxStompRPC;

  const stompRPCConfig = {
    // A name unique across all clients
    replyQueueName: `/queue/replies-${UUID.UUID()}`,

    // Simply subscribe, you would need to secure by adding broker specific options
    setupReplyQueue: (replyQueueName: string, rxStomp1: RxStomp) => {
      return rxStomp1.watch(replyQueueName, {
        durable: 'false',
        'auto-delete': 'true',
        'exclusive': 'true'
      });
    },
  };

  // Wait till RxStomp is actually connected
  beforeAll(done => {
    rxStomp = rxStompFactory();
    rxStompRPC = new RxStompRPC(rxStomp, stompRPCConfig);
    ensureRxStompConnected(rxStomp, done);
  });

  beforeAll(done => startRPCServer(rxStomp, myRPCEndPoint, done));

  function rpcCallHelper(message: string): Promise<Message> {
    return rxStompRPC
      .rpc({ destination: myRPCEndPoint, body: message })
      .toPromise();
  }

  it("Multiple RPC requests", async () => {
    // Watch for RPC response

    const msg01 = "Hello";
    const msg02 = "World";
    const msg03 = "Hello World";

    const reply01 = await rpcCallHelper(msg01);
    expect(reply01.body).toEqual(msg01);

    const reply02 = await rpcCallHelper(msg02);
    expect(reply02.body).toEqual(msg02);

    const reply03 = await rpcCallHelper(msg03);
    expect(reply03.body).toEqual(msg03);
  });
});
