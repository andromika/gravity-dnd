import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GravityProvider from '../Draggable/DragDropProvider.vue';
import Draggable from '../Draggable/Draggable.vue';
import Pool from './Pool.vue';
import type { GravityPoolReceiveEvent, GravityPoolReorderEvent } from '../Draggable/contracts';

interface DemoItem {
  id: string;
  label: string;
}

const meta: Meta<typeof Pool> = {
  title: 'Gravity/Pool',
  component: Pool,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Pool>;

export const ReorderAndReceive: Story = {
  render: () => ({
    setup() {
      const pool = ref<DemoItem[]>([
        { id: 'pool-a', label: 'A' },
        { id: 'pool-b', label: 'B' },
        { id: 'pool-c', label: 'C' },
        { id: 'pool-d', label: 'D' },
        { id: 'pool-e', label: 'E' },
        { id: 'pool-f', label: 'F' },
        { id: 'pool-g', label: 'G' },
        { id: 'pool-h', label: 'H' },
        { id: 'pool-i', label: 'I' },
        { id: 'pool-j', label: 'J' },
        { id: 'pool-k', label: 'K' },
        { id: 'pool-l', label: 'L' },
      ]);
      const stash = ref<DemoItem[]>([
        { id: 'stash-m', label: 'M' },
        { id: 'stash-n', label: 'N' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        if (sourceContainerId === 'stash-main') {
          const [moved] = stash.value.splice(sourceIndex, 1);
          return moved || null;
        }
        return null;
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
        pool,
        stash,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { GravityProvider, Draggable, Pool },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; gap: 16px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">External source</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <Draggable
                  v-for="(item, index) in stash"
                  :key="item.id"
                  :draggable-id="'stash-item-' + item.id"
                  :item="item"
                  source-id="stash-main"
                  source-kind="custom"
                  :source-index="index"
                >
                  <template #default="{ dragging }">
                    <div
                      :style="{
                        padding: '6px 10px',
                        borderRadius: '6px',
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
            </div>

            <div>
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Pool (reorderable + receives)</div>
              <Pool
                pool-id="pool-main"
                :items="pool"
                @reorder="onPoolReorder"
                @receive="onPoolReceive"
              >
                <template #item="{ item, index }">
                  <Draggable
                    :draggable-id="'pool-item-' + item.id"
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
                          opacity: dragging ? 0.35 : 1
                        }"
                      >
                        {{ item.label }}
                      </div>
                    </template>
                  </Draggable>
                </template>
              </Pool>
            </div>
          </div>

        </GravityProvider>
      </div>
    `,
  }),
};
