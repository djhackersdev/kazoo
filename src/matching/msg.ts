export type FactionCode = 0 | 1;
export type JoinType = "auto_join" | "create_always" | "create_nothing";

export interface GroupAttrs {
  time?: string;
  visible?: 1 | 0;
  member?: number[][];
}
