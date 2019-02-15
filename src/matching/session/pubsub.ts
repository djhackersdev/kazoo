import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { PubSubWorld, Subscriber, Topic, TopicKey } from "../world/pubsub";
import { Context } from "./context";

export class PubSubSession implements Subscriber {
  private readonly _world: PubSubWorld;
  private readonly _output: Output;

  constructor(ctx: Context) {
    this._world = ctx.world.pubsub;
    this._output = ctx.output;
  }

  destroy() {
    this._world.leaveTopics(this);
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.PUBLISH:
        return this._publish(cmd.publish!);

      case pegasus.TypeNum.SUBSCRIBE:
        return this._subscribe(cmd.subscribe!);

      case pegasus.TypeNum.UNSUBSCRIBE:
        return this._unsubscribe(cmd.unsubscribe!);

      default:
        throw new Error("Unimplemented pub-sub command");
    }
  }

  private _publish(cmd: pegasus.IPublish) {
    const key = cmd.channel! as TopicKey;
    const datum = Buffer.from(cmd.msg!);

    const topic = this._world.existingTopic(key);

    if (topic === undefined) {
      throw new Error("Not subscribed to this topic!");
    }

    topic.publish(this, datum);
  }

  private _subscribe(cmd: pegasus.ISubscribe_Client) {
    const key = cmd.channel! as TopicKey;
    const topic = this._world.topic(key);

    topic.subscribe(this);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.SUBSCRIBE,
        result: pegasus.ResultEnums.OK,
        subscribe: new pegasus.Subscribe_Server({
          channel: key,
          history: topic.data(),
        }),
      })
    );
  }

  private _unsubscribe(cmd: pegasus.IUnsubscribe_Client) {
    const key = cmd.channel! as TopicKey;
    const topic = this._world.topic(key);

    if (topic !== undefined) {
      topic.unsubscribe(this);
    }

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.UNSUBSCRIBE,
        unsubscribe: new pegasus.Unsubscribe_Server({
          channel: key,
        }),
      })
    );
  }

  topicMessage(topic: Topic, datum: Buffer) {
    this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.MSG_NOTIFY,
        msgNotify: new pegasus.MsgNotify({
          channel: topic.key,
          msg: datum,
        }),
      })
    );
  }
}
