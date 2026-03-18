import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import docs from '../README.md?raw';
import {
  GravityDraggable,
  GravityPool,
  GravityProvider,
  GravitySlot,
  type GravityPoolReceiveEvent,
  type GravityPoolReorderEvent,
  type GravitySlotDropEvent,
} from '../index';

interface DemoItem {
  id: string;
  label: string;
}

const meta: Meta = {
  title: 'Gravity/LibraryDemo',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: docs,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => ({
    setup() {
      const loose = ref<DemoItem | null>({ id: 'loose', label: 'Loose Token' });
      const slotItem = ref<DemoItem | null>(null);
      const pool = ref<DemoItem[]>([
        { id: 'pool-a', label: 'A' },
        { id: 'pool-b', label: 'B' },
        { id: 'pool-c', label: 'C' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        if (sourceContainerId === 'slot-main') {
          const moved = slotItem.value;
          slotItem.value = null;
          return moved;
        }
        if (sourceContainerId === 'loose-main') {
          const moved = loose.value;
          loose.value = null;
          return moved;
        }
        return null;
      }

      function putIntoSource(sourceContainerId: string, sourceIndex: number, item: DemoItem) {
        if (sourceContainerId === 'pool-main') {
          const insertIndex = Math.max(0, Math.min(sourceIndex, pool.value.length));
          pool.value.splice(insertIndex, 0, item);
          return;
        }
        if (sourceContainerId === 'slot-main') {
          slotItem.value = item;
          return;
        }
        if (sourceContainerId === 'loose-main') {
          loose.value = item;
          return;
        }
      }

      function onSlotDrop(event: GravitySlotDropEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;

        // Handle collision rules (replace / swap / reject)
        if (event.collision === 'reject') {
          // Put the moved item back into the source
          putIntoSource(event.source.containerId, event.source.index, moved);
          return;
        }

        const existing = slotItem.value;
        slotItem.value = moved;

        if (event.collision === 'swap' && event.replacedItem) {
          putIntoSource(event.source.containerId, event.source.index, event.replacedItem as DemoItem);
        }
      }

      function onPoolReorder(event: GravityPoolReorderEvent<unknown>) {
        if (event.fromIndex === event.toIndex) return;
        const [moved] = pool.value.splice(event.fromIndex, 1);
        if (!moved) return;
        let insertIndex = event.toIndex;
        if (event.fromIndex < event.toIndex) insertIndex -= 1;
        pool.value.splice(Math.max(0, Math.min(insertIndex, pool.value.length)), 0, moved as DemoItem);
      }

      function onPoolReceive(event: GravityPoolReceiveEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const insertIndex = Math.max(0, Math.min(event.insertIndex, pool.value.length));
        pool.value.splice(insertIndex, 0, moved);
      }

      return {
        loose,
        slotItem,
        pool,
        onSlotDrop,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { GravityProvider, GravityDraggable, GravitySlot, GravityPool },
    template: `
      <div style="width: 640px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; gap: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Loose Draggable</div>
                <GravityDraggable
                  v-if="loose"
                  draggable-id="gravity-loose-item"
                  :item="loose"
                  source-id="loose-main"
                  source-kind="custom"
                  :source-index="0"
                >
                  <template #default="{ dragging }">
                    <div
                      :style="{
                        display: 'inline-flex',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                        opacity:  dragging ? .9 : 1
                      }"
                    >
                      {{ loose.label }}
                    </div>
                  </template>
                </GravityDraggable>
              </div>

              <div>
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Slot</div>
                <GravitySlot slot-id="slot-main" :item="slotItem" onDropCollision="swap" @drop="onSlotDrop">
                  <template #default="{ hovering, accepting }">
                    <div
                      style="min-height: 54px; border-radius: 8px; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center;"
                      :style="{ background: hovering ? (accepting ? '#ecfeff' : '#fff1f2') : '#fff' }"
                    >
                      {{ slotItem ? slotItem.label : 'Drop here' }}
                    </div>
                  </template>
                </GravitySlot>
              </div>
            </div>

            <div>
              <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Pool (reorder + receive)</div>
              <GravityPool pool-id="pool-main" :items="pool" @reorder="onPoolReorder" @receive="onPoolReceive">
                <template #item="{ item, index }">
                  <GravityDraggable
                    :draggable-id="'gravity-pool-item-' + item.id"
                    :item="item"
                    source-id="pool-main"
                    source-kind="pool"
                    :source-index="index"
                  >
                    <template #default="{ dragging }">
                      <div
                        :style="{
                          padding: '6px 10px',
                          minWidth: '56px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          background: '#f9fafb',
                          opacity:  dragging ? .9 : 1
                        }"
                      >
                        {{ item.label }}
                      </div>
                    </template>
                  </GravityDraggable>
                </template>
              </GravityPool>
            </div>
          </div>
        </GravityProvider>
      </div>
    `,
  }),
};
