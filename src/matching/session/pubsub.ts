import * as Decoder from "../proto/decoder";
import { Output } from "../proto/pipeline";
import { Context } from "./context";

type PubSubCommand = Decoder.SubscribeCommand;

export class PubSubSession {
  private _output: Output;

  constructor(ctx: Context) {
    this._output = ctx.output;
  }

  destroy() {
    // No-op for now
  }

  dispatch(cmd: PubSubCommand) {
    switch (cmd.type) {
      case "SUBSCRIBE":
        return this._subscribe(cmd);

      default:
        throw new Error("Unimplemented pub-sub command");
    }
  }

  private _subscribe(cmd: Decoder.SubscribeCommand) {
    const { topicId, unknown } = cmd;

    // ???????
    return this._output.write({
      type: "SUBSCRIBE",
      status: "OK",
      topicId,
      json: [],
    });
  }
}
