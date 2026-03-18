<template lang="pug">
.st-gravity-pool(
  ref="rootEl"
  :class="rootClasses"
)
  TransitionGroup.st-gravity-pool__list(
    name="gravity-pool-reorder"
    move-class="gravity-pool-reorder-move"
    tag="div"
  )
    template(v-for="position in positions")
      .st-gravity-pool__drop-indicator(
        v-if="showDropIndicator && indicatorIndex === position"
        :key="`drop-indicator-${position}`"
        aria-hidden="true"
      )
      .st-gravity-pool__entry(
        v-if="position < items.length"
        :key="resolveItemKey(items[position], position)"
        :data-pool-index="position"
      )
        slot(name="item" :item="items[position]" :index="position")
  slot(name="append")
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { TransitionGroup } from 'vue';
import { useDragDropContext } from '../Draggable/useDragDropContext';
import type { PoolReceiveEvent, PoolReorderEvent } from '../Draggable/contracts';
import './Pool.scss';

const props = withDefaults(
  defineProps<{
    poolId: string;
    items: unknown[];
    itemKey?: string | ((item: unknown, index: number) => string);
    disabled?: boolean;
    accepts?: (item: unknown, payload: { sourceContainerId: string; sourceIndex: number }) => boolean;
  }>(),
  {
    itemKey: 'id',
    disabled: false,
    accepts: undefined,
  }
);

const emit = defineEmits<{
  reorder: [payload: PoolReorderEvent<unknown>];
  receive: [payload: PoolReceiveEvent<unknown>];
  hoverChange: [payload: { poolId: string; hovering: boolean; accepts: boolean }];
}>();

const rootEl = ref<HTMLElement | null>(null);
const dragDrop = useDragDropContext();
let unregister: (() => void) | null = null;

const hovering = computed(() => {
  if (!dragDrop) return false;
  return dragDrop.isHovering(props.poolId);
});

const accepting = computed(() => {
  if (!dragDrop?.dragState.hoverTarget) return true;
  return dragDrop.dragState.hoverTarget.accepts;
});
const rootClasses = computed(() => ({
  'st-gravity-pool--hovering': hovering.value,
  'st-gravity-pool--accepting': hovering.value && accepting.value,
  'st-gravity-pool--rejecting': hovering.value && !accepting.value,
}));
const positions = computed(() => Array.from({ length: props.items.length + 1 }, (_, idx) => idx));
const activeHoverTarget = computed(() => {
  const hoverTarget = dragDrop?.dragState.hoverTarget;
  if (!hoverTarget || hoverTarget.kind !== 'pool') return null;
  if (hoverTarget.containerId !== props.poolId) return null;
  return hoverTarget;
});
const showDropIndicator = computed(() => !!activeHoverTarget.value?.accepts);
const indicatorIndex = computed(() => {
  const index = activeHoverTarget.value?.index;
  if (typeof index !== 'number') return -1;
  return Math.max(0, Math.min(index, props.items.length));
});

function resolveItemKey(item: unknown, index: number) {
  if (typeof props.itemKey === 'function') return props.itemKey(item, index);
  const key = (item as Record<string, unknown>)?.[props.itemKey];
  if (typeof key === 'string' || typeof key === 'number') return String(key);
  return `${props.poolId}-${index}`;
}

function resolvePoolIndex(clientX: number, clientY: number) {
  const root = rootEl.value;
  if (!root) return props.items.length;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-pool-index]'));
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    const idx = Number(node.dataset.poolIndex ?? -1);
    const safeIndex = Number.isFinite(idx) && idx >= 0 ? idx : props.items.length;

    if (clientY < rect.top) return safeIndex;
    if (clientY > rect.bottom) continue;
    if (clientX <= rect.left + rect.width / 2) return safeIndex;
  }
  return props.items.length;
}

function canAccept(item: unknown, sourceContainerId: string, sourceIndex: number) {
  if (props.disabled) return false;
  if (!props.accepts) return true;
  return props.accepts(item, { sourceContainerId, sourceIndex });
}

function registerTarget() {
  if (!dragDrop) return;
  if (unregister) unregister();
  unregister = dragDrop.registerTarget({
    id: `pool:${props.poolId}`,
    kind: 'pool',
    containerId: props.poolId,
    resolveHover(clientX, clientY) {
      const root = rootEl.value;
      if (!root || !dragDrop.dragState.item || !dragDrop.dragState.source) return null;
      const rect = root.getBoundingClientRect();
      const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      if (!inside) return null;
      return {
        index: resolvePoolIndex(clientX, clientY),
        accepts: canAccept(dragDrop.dragState.item, dragDrop.dragState.source.containerId, dragDrop.dragState.source.index),
      };
    },
    onDrop(payload) {
      if (payload.target.kind !== 'pool') return;
      if (payload.source.containerId === props.poolId) {
        emit('reorder', {
          ...(payload as PoolReorderEvent<unknown>),
          poolId: props.poolId,
          fromIndex: payload.source.index,
          toIndex: payload.target.index,
        });
        return;
      }
      emit('receive', {
        ...(payload as PoolReceiveEvent<unknown>),
        poolId: props.poolId,
        insertIndex: payload.target.index,
      });
    },
  });
}

watch(
  () => [props.poolId, props.disabled, props.items.length],
  () => registerTarget(),
  { immediate: true }
);

watch(
  () => hovering.value,
  (isHovering) => {
    emit('hoverChange', {
      poolId: props.poolId,
      hovering: isHovering,
      accepts: accepting.value,
    });
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (unregister) unregister();
});
</script>
