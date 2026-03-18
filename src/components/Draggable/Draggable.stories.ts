import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GravityProvider from './DragDropProvider.vue';
import Slot from '../Slot/Slot.vue';
import Draggable from './Draggable.vue';
import type { GravityDraggableDropEvent, GravitySlotDropEvent } from './contracts';

interface DemoItem {
  id: string;
  label: string;
  tier?: 'bronze' | 'gold';
}

const meta: Meta<typeof Draggable> = {
  title: 'Gravity/Draggable',
  component: Draggable,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Draggable>;


export const Basic: Story = {
  render: () => ({
    setup() {
      const item = { id: 'starter', label: 'Starter Item' } satisfies DemoItem;
      const lastDrop = ref<string>('none');

      function onDragEnd(event: GravityDraggableDropEvent<unknown>) {
        lastDrop.value = `${event.target.kind}${event.target.containerId ? `:${event.target.containerId}` : ''}`;
      }

      return { item, lastDrop, onDragEnd };
    },
    components: { GravityProvider, Draggable },
    template: `
      <div style="width: 420px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <Draggable
            draggable-id="draggable-basic"
            :item="item"
            source-id="demo-basic"
            source-kind="custom"
            :source-index="0"
            @drag-end="onDragEnd"
          >
            <template #default="{ dragging }">
              <div
                :style="{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  opacity: dragging ? 0.35 : 1
                }"
              >
                {{ item.label }}
              </div>
            </template>
          </Draggable>
          <div style="margin-top: 10px; font-size: 12px; color: #4b5563;">
            Last drop target: {{ lastDrop }}
          </div>
        </GravityProvider>
      </div>
    `,
  }),
};

export const Boundary: Story = {
  render: () => ({
    setup() {
      const item = { id: 'bounded', label: 'Boundary Demo Item' } satisfies DemoItem;
      const lastCancel = ref<string>('none');

      return { item, lastCancel };
    },
    components: { GravityProvider, Draggable },
    template: `
      <div style="width: 460px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div
            class="draggable-boundary-demo"
            style="border: 1px dashed #94a3b8; border-radius: 10px; padding: 16px; min-height: 180px;"
          >
            <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
              Drag outside this dashed box to trigger out-of-bounds cancel.
            </div>
            <Draggable
              draggable-id="draggable-boundary"
              :item="item"
              source-id="demo-boundary"
              source-kind="custom"
              :source-index="0"
              drop-mode="floating"
              boundary-selector=".draggable-boundary-demo"
              @cancel="lastCancel = $event.reason"
            >
              <template #default="{ dragging }">
                <div
                  :style="{
                    display: 'inline-flex',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#f9fafb',
                    opacity: dragging ? 0.35 : 1
                  }"
                >
                  {{ item.label }}
                </div>
              </template>
            </Draggable>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #4b5563;">
            Last cancel reason: {{ lastCancel }}
          </div>
        </GravityProvider>
      </div>
    `,
  }),
};

export const DropModes: Story = {
  render: () => ({
    setup() {
      const targetModeItem = { id: 'target-mode', label: 'Target Mode' } satisfies DemoItem;
      const floatingModeItem = { id: 'floating-mode', label: 'Floating Mode' } satisfies DemoItem;
      const slotItem = ref<DemoItem | null>(null);
      const lastTargetModeResult = ref<string>('none');
      const lastFloatingModeResult = ref<string>('none');

      function onTargetModeDrop(event: GravityDraggableDropEvent<unknown>) {
        lastTargetModeResult.value = `${event.target.kind}${event.target.containerId ? `:${event.target.containerId}` : ''}`;
      }
      function onFloatingModeDrop(event: GravityDraggableDropEvent<unknown>) {
        lastFloatingModeResult.value = `${event.target.kind}${event.target.containerId ? `:${event.target.containerId}` : ''}`;
      }
      function onSlotDrop(event: GravitySlotDropEvent<unknown>) {
        slotItem.value = event.item as DemoItem;
      }

      return {
        targetModeItem,
        floatingModeItem,
        slotItem,
        lastTargetModeResult,
        lastFloatingModeResult,
        onTargetModeDrop,
        onFloatingModeDrop,
        onSlotDrop,
      };
    },
    components: { GravityProvider, Draggable, Slot },
    template: `
      <div style="width: 520px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start;">
            <div style="display: grid; gap: 8px;">
              <Draggable
                draggable-id="draggable-target-mode"
                :item="targetModeItem"
                source-id="target-mode-source"
                source-kind="custom"
                :source-index="0"
                drop-mode="target"
                @drag-end="onTargetModeDrop"
              >
                <template #default="{ dragging }">
                  <div
                    :style="{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#f9fafb',
                      opacity: dragging ? 0.35 : 1
                    }"
                  >
                    {{ targetModeItem.label }}
                  </div>
                </template>
              </Draggable>

              <Draggable
                draggable-id="draggable-floating-mode"
                :item="floatingModeItem"
                source-id="floating-mode-source"
                source-kind="custom"
                :source-index="0"
                drop-mode="floating"
                @drag-end="onFloatingModeDrop"
              >
                <template #default="{ dragging }">
                  <div
                    :style="{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#f9fafb',
                      opacity: dragging ? 0.35 : 1
                    }"
                  >
                    {{ floatingModeItem.label }}
                  </div>
                </template>
              </Draggable>
            </div>

            <Slot slot-id="mode-slot" @drop="onSlotDrop">
              <template #default="{ hovering, accepting }">
                <div
                  style="min-height: 132px; border-radius: 8px; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px;"
                  :style="{ background: hovering ? (accepting ? '#ecfeff' : '#fff1f2') : '#ffffff' }"
                >
                  {{ slotItem ? 'Dropped: ' + slotItem.label : 'Drop either card here' }}
                </div>
              </template>
            </Slot>
          </div>

          <div style="margin-top: 10px; font-size: 12px; color: #4b5563;">
            Target mode result: {{ lastTargetModeResult }}
            <br>
            Floating mode result: {{ lastFloatingModeResult }}
          </div>
        </GravityProvider>
      </div>
    `,
  }),
};
