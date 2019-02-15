import { pegasus } from "../../../generated/pegasus";
import { Context } from "./context";
import { Output } from "../proto/pipeline";
import {
  KeyValueSet,
  KeyValueWorld,
  KvsKey,
  KvsMember,
  KvsTopic,
} from "../world/keyval";

export class KvsSession implements KvsMember {
  private readonly _world: KeyValueWorld;
  private readonly _output: Output;

  constructor(ctx: Context) {
    this._world = ctx.world.keyval;
    this._output = ctx.output;
  }

  dispatch(cmd: pegasus.Command_Client) {
    switch (cmd.type) {
      case pegasus.TypeNum.KVS_OPEN:
        return this._kvsOpen(cmd.kvsOpen!);

      case pegasus.TypeNum.KVS_CLOSE:
        return this._kvsClose(cmd.kvsClose!);

      case pegasus.TypeNum.KVS_SET:
        return this._kvsSet(cmd.kvsSet!);

      default:
        throw new Error("Unimplements KVS command");
    }
  }

  destroy() {
    this._world.leaveAll(this);
  }

  _kvsOpen(cmd: pegasus.IKVSOpen_Client) {
    const topic = cmd.channel! as KvsTopic;
    const set = this._world.join(topic, this);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.KVS_OPEN,
        result: pegasus.ResultEnums.OK,
        kvsOpen: new pegasus.KVSOpen_Server({
          channel: set.topic,
          nodes: set.data(),
        }),
      })
    );
  }

  _kvsClose(cmd: pegasus.IKVSClose_Client) {
    const topic = cmd.channel! as KvsTopic;

    this._world.leave(topic, this);

    return this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.KVS_CLOSE,
        result: pegasus.ResultEnums.OK,
        kvsClose: new pegasus.KVSClose_Server({
          channel: topic,
        }),
      })
    );
  }

  _kvsSet(cmd: pegasus.IKVSSet) {
    const topic = cmd.channel! as KvsTopic;
    const key = cmd.key! as KvsKey;
    const val = cmd.msg!;

    this._world.set(topic, key, val);

    // Causes a kvsChanged notification to be broadcast
  }

  kvsChanged(set: KeyValueSet, key: KvsKey) {
    this._output.write(
      new pegasus.Command_Server({
        type: pegasus.TypeNum.KVS_NOTIFY,
        kvsNotify: new pegasus.KVSNotify({
          channel: set.topic,
          key,
          msg: set.datum(key),
        }),
      })
    );
  }
}
