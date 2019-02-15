import { GroupWorld } from "./group";
import { StatusWorld } from "./status";
import { PubSubWorld } from "./pubsub";
import { SyncWorld } from "./sync";

export class World {
  public readonly groups = new GroupWorld();
  public readonly status = new StatusWorld();
  public readonly pubsub = new PubSubWorld();
  public readonly sync = new SyncWorld();
}
