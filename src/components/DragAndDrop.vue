<template lang="pug">
.st-profile-medalpicker2-dnd(@dragstart.prevent)
  slot(:dragState="dragState" :cancelDrag="cancelDrag")
  DragPreviewOverlay(
    :visible="dragState.active && Boolean(dragState.item)"
    :item="dragState.item"
    :x="dragState.clientX"
    :y="dragState.clientY"
    :shiftX="dragState.shiftX"
    :shiftY="dragState.shiftY"
    :width="dragState.previewWidth"
    :height="dragState.previewHeight"
  )
    slot(name="preview" :item="dragState.item")
</template>

<script setup lang="ts">
import DragPreviewOverlay from '../Draggable/DragPreviewOverlay.vue';
import { provideDragDropContext } from '../Draggable/useDragDropContext';
import './DragAndDrop.scss';

const { dragState, cancelDrag } = provideDragDropContext();
</script>
