import { Context } from "./context";
import * as Decoder from "../proto/decoder";
import { Output } from "../proto/pipeline";
import { Subscriber, Topic } from "../world/pubsub";
import { World } from "../world/world";

type PubSubCommand = Decoder.PublishCommand | Decoder.SubscribeCommand;

export class PubSubSession implements Subscriber {
  private readonly _world: World;
  private readonly _output: Output;

  constructor(ctx: Context) {
    this._world = ctx.world;
    this._output = ctx.output;
  }

  destroy() {
    this._world.leaveTopics(this);
  }

  dispatch(cmd: PubSubCommand) {
    switch (cmd.type) {
      case "PUBLISH":
        return this._publish(cmd);

      case "SUBSCRIBE":
        return this._subscribe(cmd);

      default:
        throw new Error("Unimplemented pub-sub command");
    }
  }

  private _publish(cmd: Decoder.PublishCommand) {
    const { topicKey, datum } = cmd;
    const topic = this._world.existingTopic(topicKey);

    if (topic === undefined) {
      throw new Error("Not subscribed to this topic!");
    }

    topic.publish(this, datum);
  }

  private _subscribe(cmd: Decoder.SubscribeCommand) {
    const { topicKey } = cmd;
    const topic = this._world.topic(topicKey);

    topic.subscribe(this);

    return this._output.write({
      type: "SUBSCRIBE",
      status: "OK",
      topicKey,
      data: topic.data(),
    });
  }

  topicMessage(topic: Topic, datum: Buffer) {
    this._output.write({
      type: "MSG_NOTIFY",
      topicKey: topic.key,
      datum,
    });
  }
}
