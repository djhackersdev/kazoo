import { GroupWorld } from "./group";
import { StatusWorld } from "./status";
import { PubSubWorld } from "./pubsub";
import { BarrierWorlds } from "./barrier";
import { KeyValueWorld } from "./keyval";

export class World {
  public readonly groups = new GroupWorld();
  public readonly status = new StatusWorld();
  public readonly pubsub = new PubSubWorld();
  public readonly barriers = new BarrierWorlds();
  public readonly keyval = new KeyValueWorld();
}
