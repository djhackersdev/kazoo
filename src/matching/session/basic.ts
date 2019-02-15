import { pegasus } from "../../../generated/pegasus";
import { Output } from "../proto/pipeline";
import { SessionId } from "../world/session";
import { Context } from "./context";

export class BasicSession {
  private readonly _output: Output;
  private readonly _sessionId: SessionId;

  constructor(ctx: Context) {
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.HELLO:
        return this._output.write(
          new pegasus.Command_Server({
            type: pegasus.TypeNum.HELLO,
            result: pegasus.ResultEnums.OK,
            hello: new pegasus.Hello_Server({
              time: new Date().toISOString(),
              serverVersion: "1234", // ???
              sessionID: this._sessionId,
            }),
          })
        );

      case undefined:
      case pegasus.TypeNum.PING:
        return this._output.write(
          new pegasus.Command_Server({
            type: pegasus.TypeNum.PONG,
          })
        );

      case pegasus.TypeNum.CLIENT_LOG:
        return this._output.write(
          new pegasus.Command_Server({
            type: pegasus.TypeNum.CLIENT_LOG,
            result: pegasus.ResultEnums.OK,
          })
        );

      default:
        throw new Error("Unimplemented basic command");
    }
  }
}
