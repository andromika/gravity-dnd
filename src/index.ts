import Draggable from './components/Draggable.vue';

export { Draggable };

export default {
  install(app: any) {
    app.component('GravityDraggable', Draggable);
  }
};
