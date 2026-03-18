<template lang="pug">
.st-gravity-draggable(
  ref="rootEl"
  :class="rootClasses"
  :style="rootStyle"
  @pointerdown.prevent="onPointerDown"
)
  .st-gravity-draggable__content
    slot(
      :dragging="dragging"
      :hovering="hovering"
      :canDropAtHover="canDropAtHover"
      :dropMode="dropMode"
    )
  DragPreviewOverlay(
    v-if="dragDrop && dragDrop.dragState.draggableId === props.draggableId"
    :visible="dragDrop.dragState.active && Boolean(dragDrop.dragState.item)"
    :item="props.item"
    :x="dragDrop.dragState.clientX"
    :y="dragDrop.dragState.clientY"
    :shiftX="dragDrop.dragState.shiftX"
    :shiftY="dragDrop.dragState.shiftY"
    :width="dragDrop.dragState.previewWidth"
    :height="dragDrop.dragState.previewHeight"
  )
    slot(
      :dragging="true"
      :hovering="hovering"
      :canDropAtHover="canDropAtHover"
      :dropMode="dropMode"
    )
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useDragDropContext } from './useDragDropContext';
import DragPreviewOverlay from './DragPreviewOverlay.vue';
import type {
  DragDropMode,
  DragDropSource,
  DraggableCanDragContext,
  DraggableDropEvent,
} from './contracts';

const props = withDefaults(
  defineProps<{
    draggableId: string;
    item: unknown;
    sourceId: string;
    sourceKind?: DragDropSource['kind'];
    sourceIndex: number;
    dropMode?: DragDropMode;
    disabled?: boolean;
    boundarySelector?: string | null;
    canDrag?: (ctx: DraggableCanDragContext<unknown>) => boolean;
  }>(),
  {
    sourceKind: 'custom',
    dropMode: 'target',
    disabled: false,
    boundarySelector: null,
    canDrag: undefined,
  }
);

const emit = defineEmits<{
  dragStart: [payload: { draggableId: string; source: DragDropSource; item: unknown }];
  dragMove: [payload: { draggableId: string; clientX: number; clientY: number }];
  dragEnd: [payload: DraggableDropEvent<unknown>];
  drop: [payload: DraggableDropEvent<unknown>];
  cancel: [payload: { draggableId: string; source: DragDropSource; reason: 'disabled' | 'rejected' | 'out-of-bounds' }];
}>();

const rootEl = ref<HTMLElement | null>(null);
const dragDrop = useDragDropContext();
const isPressed = ref(false);
const feedback = ref<'none' | 'accepted' | 'rejected' | 'returned'>('none');
const floatingOffsetX = ref(0);
const floatingOffsetY = ref(0);
const dragStartClientX = ref(0);
const dragStartClientY = ref(0);
const dragStartOffsetX = ref(0);
const dragStartOffsetY = ref(0);
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

const source = computed<DragDropSource>(() => ({
  containerId: props.sourceId,
  kind: props.sourceKind,
  index: props.sourceIndex,
}));

const dragging = computed(() => {
  if (!dragDrop) return false;
  return dragDrop.isDragging(source.value);
});

const hovering = computed(() => {
  if (!dragDrop?.dragState.hoverTarget) return false;
  return dragging.value;
});

const canDropAtHover = computed(() => {
  if (!dragDrop?.dragState.hoverTarget) return false;
  return dragging.value && dragDrop.dragState.hoverTarget.accepts;
});

const dropMode = computed(() => props.dropMode);

const isAcceptingHover = computed(() => dragging.value && hovering.value && canDropAtHover.value);
const isRejectingHover = computed(() => dragging.value && hovering.value && !canDropAtHover.value);
const rootClasses = computed(() => ({
  'st-gravity-draggable--pressed': isPressed.value,
  'st-gravity-draggable--dragging': dragging.value,
  'st-gravity-draggable--hover-accept': isAcceptingHover.value,
  'st-gravity-draggable--hover-reject': isRejectingHover.value,
  'st-gravity-draggable--feedback-accepted': feedback.value === 'accepted',
  'st-gravity-draggable--feedback-rejected': feedback.value === 'rejected',
  'st-gravity-draggable--feedback-returned': feedback.value === 'returned',
  'st-gravity-draggable--disabled': props.disabled,
}));
const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.dropMode === 'floating' && (floatingOffsetX.value || floatingOffsetY.value)) {
    style.position = 'relative';
    style.left = `${floatingOffsetX.value}px`;
    style.top = `${floatingOffsetY.value}px`;
  }
  return Object.keys(style).length ? style : undefined;
});

function clearFeedbackTimer() {
  if (!feedbackTimeout) return;
  clearTimeout(feedbackTimeout);
  feedbackTimeout = null;
}

function flashFeedback(kind: 'accepted' | 'rejected' | 'returned') {
  clearFeedbackTimer();
  feedback.value = kind;
  feedbackTimeout = setTimeout(() => {
    feedback.value = 'none';
    feedbackTimeout = null;
  }, 220);
}

function getBoundaryRect(): { left: number; top: number; right: number; bottom: number } | null {
  if (!props.boundarySelector) return null;
  const boundaryEl = document.querySelector<HTMLElement>(props.boundarySelector);
  if (!boundaryEl) return null;
  const rect = boundaryEl.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

function isOutsideBoundary(
  boundary: { left: number; top: number; right: number; bottom: number },
  clientX: number,
  clientY: number
) {
  return clientX < boundary.left || clientX > boundary.right || clientY < boundary.top || clientY > boundary.bottom;
}

function onPointerMove(event: PointerEvent) {
  if (!dragDrop?.dragState.active || dragDrop.dragState.draggableId !== props.draggableId) return;
  emit('dragMove', {
    draggableId: props.draggableId,
    clientX: event.clientX,
    clientY: event.clientY,
  });
}

function teardownPointerListeners() {
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  document.removeEventListener('pointercancel', onPointerUp);
}

function onPointerUp(event: PointerEvent) {
  teardownPointerListeners();
  isPressed.value = false;
  if (!dragDrop) return;
  if (props.boundarySelector) {
    const boundary = getBoundaryRect();
    const clientX = Number.isFinite(event.clientX) && event.clientX >= 0 ? event.clientX : dragDrop.dragState.clientX;
    const clientY = Number.isFinite(event.clientY) && event.clientY >= 0 ? event.clientY : dragDrop.dragState.clientY;
    if (boundary && isOutsideBoundary(boundary, clientX, clientY)) {
      dragDrop.cancelDrag();
      flashFeedback('returned');
      emit('cancel', {
        draggableId: props.draggableId,
        source: source.value,
        reason: 'out-of-bounds',
      });
      return;
    }
  }
  const endClientX = Number.isFinite(event.clientX) && event.clientX >= 0 ? event.clientX : dragDrop.dragState.clientX;
  const endClientY = Number.isFinite(event.clientY) && event.clientY >= 0 ? event.clientY : dragDrop.dragState.clientY;
  const result = dragDrop.endDrag<unknown>();
  if (!result) return;

  const payload: DraggableDropEvent<unknown> = {
    ...result.event,
    accepted: result.accepted,
  };
  if (result.accepted && result.event.target.kind === 'floating') {
    floatingOffsetX.value = dragStartOffsetX.value + (endClientX - dragStartClientX.value);
    floatingOffsetY.value = dragStartOffsetY.value + (endClientY - dragStartClientY.value);
  }
  if (result.accepted) {
    const droppedBackToOrigin =
      result.event.target.containerId === payload.source.containerId && result.event.target.index === payload.source.index;
    flashFeedback(droppedBackToOrigin ? 'returned' : 'accepted');
  } else {
    flashFeedback('rejected');
  }
  emit('dragEnd', payload);
  if (result.accepted) {
    emit('drop', payload);
  } else {
    emit('cancel', {
      draggableId: props.draggableId,
      source: source.value,
      reason: 'rejected',
    });
  }
}

function onPointerDown(event: PointerEvent) {
  if (!dragDrop || props.disabled) {
    emit('cancel', {
      draggableId: props.draggableId,
      source: source.value,
      reason: 'disabled',
    });
    return;
  }
  if (props.canDrag && !props.canDrag({ item: props.item, source: source.value })) {
    emit('cancel', {
      draggableId: props.draggableId,
      source: source.value,
      reason: 'rejected',
    });
    return;
  }

  const el = rootEl.value;
  if (!el) return;
  /* At-rest box for the cursor clone only — before press scale changes layout */
  const rectAtRest = el.getBoundingClientRect();
  isPressed.value = true;
  const boundary = getBoundaryRect();
  dragStartClientX.value = event.clientX;
  dragStartClientY.value = event.clientY;
  dragStartOffsetX.value = floatingOffsetX.value;
  dragStartOffsetY.value = floatingOffsetY.value;

  dragDrop.startDrag({
    draggableId: props.draggableId,
    mode: props.dropMode,
    item: props.item,
    source: source.value,
    shiftX: event.clientX - rectAtRest.left,
    shiftY: event.clientY - rectAtRest.top,
    clientX: event.clientX,
    clientY: event.clientY,
    previewWidth: rectAtRest.width,
    previewHeight: rectAtRest.height,
    boundary,
  });

  emit('dragStart', {
    draggableId: props.draggableId,
    source: source.value,
    item: props.item,
  });

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
}

onBeforeUnmount(() => {
  teardownPointerListeners();
  clearFeedbackTimer();
});
</script>
