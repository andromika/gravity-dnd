export type GravityContainerKind = 'slot' | 'pool' | 'custom';

export type GravityMode = 'target' | 'floating';

export interface GravitySource {
  containerId: string;
  kind: GravityContainerKind;
  index: number;
}

export interface GravityBoundary {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface GravityCanDragContext<TItem> {
  item: TItem;
  source: GravitySource;
}

export interface GravityHoverTarget {
  id: string;
  kind: 'slot' | 'pool';
  containerId: string;
  index: number;
  accepts: boolean;
}

export interface GravityDropTarget {
  kind: 'slot' | 'pool' | 'floating';
  containerId: string | null;
  index: number;
}

export interface GravityDropEvent<TItem> {
  draggableId: string;
  item: TItem;
  source: GravitySource;
  target: GravityDropTarget;
}

export interface GravityDraggableDropEvent<TItem> extends GravityDropEvent<TItem> {
  accepted: boolean;
}

export type GravitySlotCollisionRule = 'replace' | 'swap' | 'reject';

export interface GravitySlotDropEvent<TItem> extends GravityDropEvent<TItem> {
  slotId: string;
  swap: boolean;
  collision: GravitySlotCollisionRule;
  replacedItem?: TItem;
}

export interface GravityPoolReorderEvent<TItem> extends GravityDropEvent<TItem> {
  poolId: string;
  fromIndex: number;
  toIndex: number;
}

export interface GravityPoolReceiveEvent<TItem> extends GravityDropEvent<TItem> {
  poolId: string;
  insertIndex: number;
}

/*
 * Backwards-compatible aliases while the old DragDrop naming is phased out.
 */
export type DragDropContainerKind = GravityContainerKind;
export type DragDropMode = GravityMode;
export type DragDropSource = GravitySource;
export type DragDropBoundary = GravityBoundary;
export type DraggableCanDragContext<TItem> = GravityCanDragContext<TItem>;
export type DragDropHoverTarget = GravityHoverTarget;
export type DragDropDropTarget = GravityDropTarget;
export type DragDropDropEvent<TItem> = GravityDropEvent<TItem>;
export type DraggableDropEvent<TItem> = GravityDraggableDropEvent<TItem>;
export type SlotDropEvent<TItem> = GravitySlotDropEvent<TItem>;
export type PoolReorderEvent<TItem> = GravityPoolReorderEvent<TItem>;
export type PoolReceiveEvent<TItem> = GravityPoolReceiveEvent<TItem>;
