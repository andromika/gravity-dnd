<template lang="pug">
.st-gravity-slot(
  ref="rootEl"
  :class="rootClasses"
)
  slot(:hovering="hovering" :accepting="accepting")
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useDragDropContext } from '../Draggable/useDragDropContext';
import type { SlotDropEvent } from '../Draggable/contracts';
import './Slot.scss';

const props = withDefaults(
  defineProps<{
    slotId: string;
    index?: number;
    item?: unknown;
    swap?: boolean;
    onDropCollision?: 'replace' | 'swap' | 'reject';
    disabled?: boolean;
    accepts?: (item: unknown, payload: { sourceContainerId: string; sourceIndex: number }) => boolean;
  }>(),
  {
    index: 0,
    swap: true,
    onDropCollision: undefined,
    disabled: false,
    accepts: undefined,
  }
);

const emit = defineEmits<{
  drop: [payload: SlotDropEvent<unknown>];
  hoverChange: [payload: { slotId: string; hovering: boolean; accepts: boolean }];
}>();

const rootEl = ref<HTMLElement | null>(null);
const dragDrop = useDragDropContext();
let unregister: (() => void) | null = null;

const hovering = computed(() => {
  if (!dragDrop) return false;
  return dragDrop.isHovering(props.slotId, props.index);
});

const accepting = computed(() => {
  if (!dragDrop?.dragState.hoverTarget) return true;
  return dragDrop.dragState.hoverTarget.accepts;
});
const rootClasses = computed(() => ({
  'st-gravity-slot--hovering': hovering.value,
  'st-gravity-slot--accepting': hovering.value && accepting.value,
  'st-gravity-slot--rejecting': hovering.value && !accepting.value,
}));

function canAccept(item: unknown, sourceContainerId: string, sourceIndex: number) {
  if (props.disabled) return false;

  const collisionMode =
    props.onDropCollision ?? (props.swap === false ? 'replace' : 'swap');

  if (collisionMode === 'reject' && props.item != null) return false;

  if (!props.accepts) return true;
  return props.accepts(item, { sourceContainerId, sourceIndex });
}

function registerTarget() {
  if (!dragDrop) return;
  if (unregister) unregister();

  unregister = dragDrop.registerTarget({
    id: `slot:${props.slotId}`,
    kind: 'slot',
    containerId: props.slotId,
    resolveHover(clientX, clientY) {
      const el = rootEl.value;
      if (!el || !dragDrop.dragState.item || !dragDrop.dragState.source) return null;
      const rect = el.getBoundingClientRect();
      const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      if (!inside) return null;
      return {
        index: props.index,
        accepts: canAccept(dragDrop.dragState.item, dragDrop.dragState.source.containerId, dragDrop.dragState.source.index),
      };
    },
    onDrop(payload) {
      const collisionMode =
        props.onDropCollision ?? (props.swap === false ? 'replace' : 'swap');
      const replacedItem = props.item as unknown;

      emit('drop', {
        ...(payload as SlotDropEvent<unknown>),
        slotId: props.slotId,
        swap: collisionMode === 'swap',
        collision: collisionMode,
        replacedItem: replacedItem ?? undefined,
      });
    },
  });
}

watch(
  () => [props.slotId, props.index, props.disabled, props.item, props.onDropCollision, props.accepts],
  () => registerTarget(),
  { immediate: true }
);

watch(
  () => hovering.value,
  (isHovering) => {
    emit('hoverChange', {
      slotId: props.slotId,
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
