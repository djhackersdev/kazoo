import { Context } from "./context";
import * as Model from "../model";
import { Output } from "../proto/pipeline";
import * as Decoder from "../proto/decoder";

type BasicCommand =
  | Decoder.HelloCommand
  | Decoder.PingCommand
  | Decoder.ClientLogCommand;

export class BasicSession {
  private readonly _output: Output;
  private readonly _sessionId: Model.SessionId;

  constructor(ctx: Context) {
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  dispatch(cmd: BasicCommand) {
    switch (cmd.type) {
      case "HELLO":
        return this._output.write({
          type: "HELLO",
          status: "OK",
          json: {
            time: new Date().toISOString(),
            majorVer: 57,
            minorVer: 7,
            localVer: 35707,
            sessionId: this._sessionId,
          },
        });

      case "PING":
        return this._output.write({ type: "PONG" });

      case "CLIENTLOG":
        return this._output.write({ type: "CLIENTLOG", status: "OK" });

      default:
        throw new Error("Unimplemented basic command");
    }
  }
}
