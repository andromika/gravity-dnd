<template lang="pug">
Teleport(to="body")
  .st-gravity-preview(v-if="visible && cloneReady" :style="previewStyle")
    .st-gravity-preview__inner
      slot(:item="item")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import './DragPreviewOverlay.scss';

const props = defineProps<{
  visible: boolean;
  item: unknown | null;
  x: number;
  y: number;
  shiftX: number;
  shiftY: number;
  width: number;
  height: number;
}>();

const cloneReady = computed(() => props.width > 0 && props.height > 0);

const previewStyle = computed(() => {
  const w = props.width;
  const h = props.height;
  return {
    left: `${props.x - props.shiftX}px`,
    top: `${props.y - props.shiftY}px`,
    width: `${w}px`,
    height: `${h}px`,
    minWidth: `${w}px`,
    maxWidth: `${w}px`,
    minHeight: `${h}px`,
    maxHeight: `${h}px`,
    boxSizing: 'border-box' as const,
  };
});
</script>
