<template>
  <div class="gravity-draggable" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <slot>Drag me</slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GravityDraggable',
  emits: ['dragstart', 'dragend'],
  setup(_, { emit }) {
    const handleDragStart = (event: DragEvent) => {
      emit('dragstart', event);
    };

    const handleDragEnd = (event: DragEvent) => {
      emit('dragend', event);
    };

    return {
      handleDragStart,
      handleDragEnd
    };
  }
});
</script>

<style scoped>
.gravity-draggable {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--bg-border, #5a5a5a);
  border-radius: 0.5rem;
  cursor: grab;
  user-select: none;
}

.gravity-draggable:active {
  cursor: grabbing;
}
</style>
