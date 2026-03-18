import { inject, onBeforeUnmount, provide, reactive, ref, shallowRef, type InjectionKey, type Ref } from 'vue';
import type {
  DragDropBoundary,
  DragDropDropEvent,
  DragDropHoverTarget,
  DragDropMode,
  DragDropSource,
} from './contracts';
import { createInternalDropLayer, type InternalDropTargetRegistration } from './internalDropLayer';

export interface ActiveDrag<TItem = unknown> {
  active: boolean;
  draggableId: string | null;
  mode: DragDropMode;
  item: TItem | null;
  source: DragDropSource | null;
  clientX: number;
  clientY: number;
  shiftX: number;
  shiftY: number;
  previewWidth: number;
  previewHeight: number;
  hoverTarget: DragDropHoverTarget | null;
}

interface DragStartPayload<TItem> {
  draggableId: string;
  mode: DragDropMode;
  item: TItem;
  source: DragDropSource;
  shiftX: number;
  shiftY: number;
  clientX: number;
  clientY: number;
  previewWidth: number;
  previewHeight: number;
  boundary: DragDropBoundary | null;
}

interface DragEndResult<TItem> {
  event: DragDropDropEvent<TItem>;
  accepted: boolean;
}

interface InternalDragDropContext {
  dragState: ActiveDrag;
  rawClientX: Ref<number>;
  rawClientY: Ref<number>;
  registerTarget: (target: InternalDropTargetRegistration) => () => void;
  startDrag: <TItem>(payload: DragStartPayload<TItem>) => void;
  endDrag: <TItem>() => DragEndResult<TItem> | null;
  cancelDrag: () => void;
  isDragging: (source: DragDropSource) => boolean;
  isHovering: (containerId: string, index?: number) => boolean;
}

const DRAG_DROP_CONTEXT_KEY: InjectionKey<InternalDragDropContext> = Symbol('gravity.dragDropContext');

export function provideDragDropContext() {
  const dragState = reactive<ActiveDrag>({
    active: false,
    draggableId: null,
    mode: 'target',
    item: null,
    source: null,
    clientX: 0,
    clientY: 0,
    shiftX: 0,
    shiftY: 0,
    previewWidth: 0,
    previewHeight: 0,
    hoverTarget: null,
  });
  const activeBoundary = ref<DragDropBoundary | null>(null);
  const dropLayer = createInternalDropLayer();

  // Raw (non-reactive) coordinates updated every pointermove for preview position.
  // Only the preview overlay reads these via shallowRef to avoid triggering the
  // full reactive cascade on every pixel move.
  const rawClientX = shallowRef(0);
  const rawClientY = shallowRef(0);
  let _rafId: number | null = null;
  let _pendingX = 0;
  let _pendingY = 0;
  let _hoverDirty = false;

  function reset() {
    dragState.active = false;
    dragState.draggableId = null;
    dragState.item = null;
    dragState.mode = 'target';
    dragState.source = null;
    dragState.clientX = 0;
    dragState.clientY = 0;
    dragState.shiftX = 0;
    dragState.shiftY = 0;
    dragState.previewWidth = 0;
    dragState.previewHeight = 0;
    dragState.hoverTarget = null;
    activeBoundary.value = null;
  }

  function registerTarget(target: InternalDropTargetRegistration) {
    return dropLayer.registerTarget(target);
  }

  function withinBoundary(clientX: number, clientY: number): boolean {
    if (!activeBoundary.value) return true;
    return (
      clientX >= activeBoundary.value.left &&
      clientX <= activeBoundary.value.right &&
      clientY >= activeBoundary.value.top &&
      clientY <= activeBoundary.value.bottom
    );
  }

  function processFrame() {
    _rafId = null;
    if (!dragState.active) return;

    const cx = _pendingX;
    const cy = _pendingY;

    // Always update preview position (cheap shallowRef trigger)
    rawClientX.value = cx;
    rawClientY.value = cy;

    // Only run expensive hover detection when coordinates actually changed
    if (!_hoverDirty) return;
    _hoverDirty = false;

    // Update reactive coords (used by endDrag for final position)
    dragState.clientX = cx;
    dragState.clientY = cy;

    if (!withinBoundary(cx, cy)) {
      if (dragState.hoverTarget !== null) dragState.hoverTarget = null;
      return;
    }
    if (!dragState.item || !dragState.source) {
      if (dragState.hoverTarget !== null) dragState.hoverTarget = null;
      return;
    }

    const newTarget = dropLayer.detectHoverTarget(cx, cy, {
      item: dragState.item,
      source: dragState.source,
    });

    // Only trigger reactive update if hover target actually changed
    const prev = dragState.hoverTarget;
    if (
      newTarget?.id !== prev?.id ||
      newTarget?.index !== prev?.index ||
      newTarget?.accepts !== prev?.accepts
    ) {
      dragState.hoverTarget = newTarget;
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragState.active) return;

    const cx = event.clientX;
    const cy = event.clientY;

    // Mark dirty if coordinates changed enough to warrant hover re-evaluation
    if (cx !== _pendingX || cy !== _pendingY) {
      _hoverDirty = true;
    }
    _pendingX = cx;
    _pendingY = cy;

    // Coalesce into a single RAF — preview moves at display refresh rate,
    // hover detection runs at most once per frame instead of per pointermove.
    if (_rafId === null) {
      _rafId = requestAnimationFrame(processFrame);
    }
  }

  function teardownListeners() {
    document.removeEventListener('pointermove', onPointerMove);
    if (_rafId !== null) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  }

  function startDrag<TItem>(payload: DragStartPayload<TItem>) {
    dragState.active = true;
    dragState.draggableId = payload.draggableId;
    dragState.mode = payload.mode;
    dragState.item = payload.item;
    dragState.source = payload.source;
    dragState.clientX = payload.clientX;
    dragState.clientY = payload.clientY;
    dragState.shiftX = payload.shiftX;
    dragState.shiftY = payload.shiftY;
    dragState.previewWidth = payload.previewWidth;
    dragState.previewHeight = payload.previewHeight;
    dragState.hoverTarget = null;
    activeBoundary.value = payload.boundary;
    _pendingX = payload.clientX;
    _pendingY = payload.clientY;
    rawClientX.value = payload.clientX;
    rawClientY.value = payload.clientY;
    document.addEventListener('pointermove', onPointerMove);
  }

  function endDrag<TItem>() {
    if (!dragState.active || !dragState.item || !dragState.source || !dragState.draggableId) {
      teardownListeners();
      reset();
      return null;
    }

    const hoveredTarget = dropLayer.getTarget(dragState.hoverTarget?.id);
    const { target, accepted } = dropLayer.resolveDropTarget({
      mode: dragState.mode,
      hoverTarget: dragState.hoverTarget,
      source: dragState.source,
    });
    const payload: DragDropDropEvent<TItem> = {
      draggableId: dragState.draggableId,
      item: dragState.item as TItem,
      source: dragState.source,
      target,
    };

    if (accepted && hoveredTarget?.onDrop) {
      hoveredTarget.onDrop(payload as DragDropDropEvent<unknown>);
    }
    teardownListeners();
    reset();
    return {
      event: payload,
      accepted,
    };
  }

  function cancelDrag() {
    teardownListeners();
    reset();
  }

  function isDragging(source: DragDropSource): boolean {
    return (
      dragState.active &&
      dragState.source?.containerId === source.containerId &&
      dragState.source?.index === source.index &&
      dragState.source?.kind === source.kind
    );
  }

  function isHovering(containerId: string, index?: number): boolean {
    if (!dragState.active || !dragState.hoverTarget) return false;
    if (dragState.hoverTarget.containerId !== containerId) return false;
    if (typeof index !== 'number') return true;
    return dragState.hoverTarget.index === index;
  }

  provide(DRAG_DROP_CONTEXT_KEY, {
    dragState,
    rawClientX,
    rawClientY,
    registerTarget,
    startDrag,
    endDrag,
    cancelDrag,
    isDragging,
    isHovering,
  });

  onBeforeUnmount(() => {
    teardownListeners();
    dropLayer.clear();
  });

  return {
    dragState,
    cancelDrag,
  };
}

export function useDragDropContext() {
  const ctx = inject(DRAG_DROP_CONTEXT_KEY, null);
  return ctx;
}

export function useDropTargetRegistration(target: InternalDropTargetRegistration, enabled: Ref<boolean>) {
  const ctx = useDragDropContext();
  if (!ctx) return;

  let unregister = () => {};
  if (enabled.value) {
    unregister = ctx.registerTarget(target);
  }
  onBeforeUnmount(() => {
    unregister();
  });

  return {
    refresh() {
      unregister();
      if (!enabled.value) return;
      unregister = ctx.registerTarget(target);
    },
  };
}

