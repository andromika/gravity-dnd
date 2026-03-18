<template lang="pug">
.st-gravity-provider(@dragstart.prevent)
  slot(:dragState="dragState" :cancelDrag="cancelDrag")
</template>

<script setup lang="ts">
import { provideDragDropContext } from './useDragDropContext';
import './DragDropProvider.scss';

const { dragState, cancelDrag } = provideDragDropContext();
</script>
