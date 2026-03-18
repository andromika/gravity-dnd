import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import DragAndDrop from './DragAndDrop.vue';
import Draggable from '../Draggable/Draggable.vue';
import Slot from '../Slot/Slot.vue';
import Pool from '../Pool/Pool.vue';
import type { PoolReceiveEvent, PoolReorderEvent, SlotDropEvent } from '../Draggable/contracts';

interface DemoItem {
  id: string;
  label: string;
}

const SLOT_COUNT = 4;

const meta: Meta<typeof DragAndDrop> = {
  title: 'Gravity/DragAndDrop',
  component: DragAndDrop,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DragAndDrop>;

export const Combined: Story = {
  render: () => ({
    setup() {
      const slots = ref<(DemoItem | null)[]>([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, null, null]);
      const pool = ref<DemoItem[]>([
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
        { id: 'e', label: 'E' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId.startsWith('slot-')) {
          const slotIndex = Number(sourceContainerId.replace('slot-', ''));
          const moved = slots.value[slotIndex] || null;
          slots.value[slotIndex] = null;
          return moved;
        }
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        return null;
      }

      function onSlotDrop(event: SlotDropEvent<unknown>) {
        const slotIndex = Number(event.slotId.replace('slot-', ''));
        if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= SLOT_COUNT) return;
        if (event.source.containerId === event.slotId) return;
        if (event.swap && event.source.kind === 'slot') {
          const sourceSlotIndex = Number(event.source.containerId.replace('slot-', ''));
          if (!Number.isFinite(sourceSlotIndex) || sourceSlotIndex < 0 || sourceSlotIndex >= SLOT_COUNT) return;
          const moved = slots.value[sourceSlotIndex];
          if (!moved) return;
          const displaced = slots.value[slotIndex];
          slots.value[slotIndex] = moved;
          slots.value[sourceSlotIndex] = displaced ?? null;
          return;
        }

        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const displaced = slots.value[slotIndex];
        slots.value[slotIndex] = moved;
        if (displaced) pool.value.push(displaced);
      }

      function onPoolReorder(event: PoolReorderEvent<unknown>) {
        if (event.fromIndex === event.toIndex) return;
        const [moved] = pool.value.splice(event.fromIndex, 1);
        if (!moved) return;
        let insertIndex = event.toIndex;
        if (event.fromIndex < event.toIndex) insertIndex -= 1;
        pool.value.splice(Math.max(0, Math.min(insertIndex, pool.value.length)), 0, moved as DemoItem);
      }

      function onPoolReceive(event: PoolReceiveEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const insertIndex = Math.max(0, Math.min(event.insertIndex, pool.value.length));
        pool.value.splice(insertIndex, 0, moved);
      }

      return {
        slots,
        pool,
        SLOT_COUNT,
        onSlotDrop,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { DragAndDrop, Draggable, Slot, Pool },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <DragAndDrop>
          <div style="display: grid; gap: 16px;">
            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Slots</div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
                <Slot
                  v-for="idx in SLOT_COUNT"
                  :key="'slot-' + idx"
                  :slot-id="'slot-' + (idx - 1)"
                  @drop="onSlotDrop"
                >
                  <template #default="{ hovering }">
                    <div
                      style="min-height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
                      :style="{ background: hovering ? '#ecfeff' : '#ffffff' }"
                    >
                      <Draggable
                        v-if="slots[idx - 1]"
                        :draggable-id="'slot-item-' + (idx - 1)"
                        :item="slots[idx - 1]"
                        :source-id="'slot-' + (idx - 1)"
                        source-kind="slot"
                        :source-index="0"
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
                            {{ slots[idx - 1]?.label }}
                          </div>
                        </template>
                      </Draggable>
                      <span v-else style="font-size: 12px; color: #64748b;">Drop item</span>
                    </div>
                  </template>
                </Slot>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Pool</div>
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

          <template #preview="{ item }">
            <div
              v-if="item"
              style="padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.12);"
            >
              {{ item.label }}
            </div>
          </template>
        </DragAndDrop>
      </div>
    `,
  }),
};

/*
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import DragAndDrop from './DragAndDrop.vue';
import Draggable from './Draggable.vue';
import Slot from '../Slot/Slot.vue';
import Pool from '../Pool/Pool.vue';
import type { PoolReceiveEvent, PoolReorderEvent, SlotDropEvent } from './contracts';

interface DemoItem {
  id: string;
  label: string;
}

const SLOT_COUNT = 4;

const meta: Meta<typeof DragAndDrop> = {
  title: 'Gravity/DragAndDrop',
  component: DragAndDrop,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DragAndDrop>;

export const Combined: Story = {
  render: () => ({
    setup() {
      const slots = ref<(DemoItem | null)[]>([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, null, null]);
      const pool = ref<DemoItem[]>([
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
        { id: 'e', label: 'E' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId.startsWith('slot-')) {
          const slotIndex = Number(sourceContainerId.replace('slot-', ''));
          const moved = slots.value[slotIndex] || null;
          slots.value[slotIndex] = null;
          return moved;
        }
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        return null;
      }

      function onSlotDrop(event: SlotDropEvent<unknown>) {
        const slotIndex = Number(event.slotId.replace('slot-', ''));
        if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= SLOT_COUNT) return;
        if (event.source.containerId === event.slotId) return;
        if (event.swap && event.source.kind === 'slot') {
          const sourceSlotIndex = Number(event.source.containerId.replace('slot-', ''));
          if (!Number.isFinite(sourceSlotIndex) || sourceSlotIndex < 0 || sourceSlotIndex >= SLOT_COUNT) return;
          const moved = slots.value[sourceSlotIndex];
          if (!moved) return;
          const displaced = slots.value[slotIndex];
          slots.value[slotIndex] = moved;
          slots.value[sourceSlotIndex] = displaced ?? null;
          return;
        }

        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const displaced = slots.value[slotIndex];
        slots.value[slotIndex] = moved;
        if (displaced) pool.value.push(displaced);
      }

      function onPoolReorder(event: PoolReorderEvent<unknown>) {
        if (event.fromIndex === event.toIndex) return;
        const [moved] = pool.value.splice(event.fromIndex, 1);
        if (!moved) return;
        let insertIndex = event.toIndex;
        if (event.fromIndex < event.toIndex) insertIndex -= 1;
        pool.value.splice(Math.max(0, Math.min(insertIndex, pool.value.length)), 0, moved as DemoItem);
      }

      function onPoolReceive(event: PoolReceiveEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const insertIndex = Math.max(0, Math.min(event.insertIndex, pool.value.length));
        pool.value.splice(insertIndex, 0, moved);
      }

      return {
        slots,
        pool,
        SLOT_COUNT,
        onSlotDrop,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { DragAndDrop, Draggable, Slot, Pool },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <DragAndDrop>
          <div style="display: grid; gap: 16px;">
            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Slots</div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
                <Slot
                  v-for="idx in SLOT_COUNT"
                  :key="'slot-' + idx"
                  :slot-id="'slot-' + (idx - 1)"
                  @drop="onSlotDrop"
                >
                  <template #default="{ hovering }">
                    <div
                      style="min-height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
                      :style="{ background: hovering ? '#ecfeff' : '#ffffff' }"
                    >
                      <Draggable
                        v-if="slots[idx - 1]"
                        :draggable-id="'slot-item-' + (idx - 1)"
                        :item="slots[idx - 1]"
                        :source-id="'slot-' + (idx - 1)"
                        source-kind="slot"
                        :source-index="0"
                      >
                        <template #default="{ dragging }">
                          <div
                            :style="{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                              opacity: dragging ? 0.3 : 1
                            }"
                          >
                            {{ slots[idx - 1]?.label }}
                          </div>
                        </template>
                      </Draggable>
                      <div v-else style="font-size: 12px; color: #9ca3af;">empty</div>
                    </div>
                  </template>
                </Slot>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Pool</div>
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
                          opacity: dragging ? 0.3 : 1
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

          <template #preview="{ item }">
            <div
              v-if="item"
              style="padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.12);"
            >
              {{ item.label }}
            </div>
          </template>
        </DragAndDrop>
      </div>
    `,
  }),
};

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import DragAndDrop from './DragAndDrop.vue';
import Draggable from './Draggable.vue';
import Slot from '../Slot/Slot.vue';
import Pool from '../Pool/Pool.vue';
import type { PoolReceiveEvent, PoolReorderEvent, SlotDropEvent } from './contracts';

interface DemoItem {
  id: string;
  label: string;
}

const SLOT_COUNT = 4;

const meta: Meta<typeof DragAndDrop> = {
  title: 'Gravity/DragAndDrop',
  component: DragAndDrop,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DragAndDrop>;

export const Combined: Story = {
  render: () => ({
    setup() {
      const slots = ref<(DemoItem | null)[]>([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, null, null]);
      const pool = ref<DemoItem[]>([
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
        { id: 'e', label: 'E' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId.startsWith('slot-')) {
          const slotIndex = Number(sourceContainerId.replace('slot-', ''));
          const moved = slots.value[slotIndex] || null;
          slots.value[slotIndex] = null;
          return moved;
        }
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        return null;
      }

      function onSlotDrop(event: SlotDropEvent<unknown>) {
        const slotIndex = Number(event.slotId.replace('slot-', ''));
        if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= SLOT_COUNT) return;
        if (event.source.containerId === event.slotId) return;
        if (event.swap && event.source.kind === 'slot') {
          const sourceSlotIndex = Number(event.source.containerId.replace('slot-', ''));
          if (!Number.isFinite(sourceSlotIndex) || sourceSlotIndex < 0 || sourceSlotIndex >= SLOT_COUNT) return;
          const moved = slots.value[sourceSlotIndex];
          if (!moved) return;
          const displaced = slots.value[slotIndex];
          slots.value[slotIndex] = moved;
          slots.value[sourceSlotIndex] = displaced ?? null;
          return;
        }

        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const displaced = slots.value[slotIndex];
        slots.value[slotIndex] = moved;
        if (displaced) pool.value.push(displaced);
      }

      function onPoolReorder(event: PoolReorderEvent<unknown>) {
        if (event.fromIndex === event.toIndex) return;
        const [moved] = pool.value.splice(event.fromIndex, 1);
        if (!moved) return;
        let insertIndex = event.toIndex;
        if (event.fromIndex < event.toIndex) insertIndex -= 1;
        pool.value.splice(Math.max(0, Math.min(insertIndex, pool.value.length)), 0, moved as DemoItem);
      }

      function onPoolReceive(event: PoolReceiveEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const insertIndex = Math.max(0, Math.min(event.insertIndex, pool.value.length));
        pool.value.splice(insertIndex, 0, moved);
      }

      return {
        slots,
        pool,
        SLOT_COUNT,
        onSlotDrop,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { DragAndDrop, Draggable, Slot, Pool },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <DragAndDrop>
          <div style="display: grid; gap: 16px;">
            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Slots</div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
                <Slot
                  v-for="idx in SLOT_COUNT"
                  :key="'slot-' + idx"
                  :slot-id="'slot-' + (idx - 1)"
                  @drop="onSlotDrop"
                >
                  <template #default="{ hovering }">
                    <div
                      style="min-height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
                      :style="{ background: hovering ? '#ecfeff' : '#ffffff' }"
                    >
                      <Draggable
                        v-if="slots[idx - 1]"
                        :draggable-id="'slot-item-' + (idx - 1)"
                        :item="slots[idx - 1]"
                        :source-id="'slot-' + (idx - 1)"
                        source-kind="slot"
                        :source-index="0"
                      >
                        <template #default="{ dragging }">
                          <div
                            :style="{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                              opacity: dragging ? 0.3 : 1
                            }"
                          >
                            {{ slots[idx - 1]?.label }}
                          </div>
                        </template>
                      </Draggable>
                      <div v-else style="font-size: 12px; color: #9ca3af;">empty</div>
                    </div>
                  </template>
                </Slot>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Pool</div>
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
                          opacity: dragging ? 0.3 : 1
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

          <template #preview="{ item }">
            <div
              v-if="item"
              style="padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.12);"
            >
              {{ item.label }}
            </div>
          </template>
        </DragAndDrop>
      </div>
    `,
  }),
};

import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import DragAndDrop from './DragAndDrop.vue';
import Draggable from './Draggable.vue';
import Slot from '../Slot/Slot.vue';
import Pool from '../Pool/Pool.vue';
import type { PoolReceiveEvent, PoolReorderEvent, SlotDropEvent } from './contracts';

interface DemoItem {
  id: string;
  label: string;
}

const SLOT_COUNT = 4;

const meta: Meta<typeof DragAndDrop> = {
  title: 'Gravity/DragAndDrop',
  component: DragAndDrop,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DragAndDrop>;

export const Combined: Story = {
  render: () => ({
    setup() {
      const slots = ref<(DemoItem | null)[]>([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, null, null]);
      const pool = ref<DemoItem[]>([
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
        { id: 'e', label: 'E' },
      ]);

      function takeFromSource(sourceContainerId: string, sourceIndex: number): DemoItem | null {
        if (sourceContainerId.startsWith('slot-')) {
          const slotIndex = Number(sourceContainerId.replace('slot-', ''));
          const moved = slots.value[slotIndex] || null;
          slots.value[slotIndex] = null;
          return moved;
        }
        if (sourceContainerId === 'pool-main') {
          const [moved] = pool.value.splice(sourceIndex, 1);
          return moved || null;
        }
        return null;
      }

      function onSlotDrop(event: SlotDropEvent<unknown>) {
        const slotIndex = Number(event.slotId.replace('slot-', ''));
        if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= SLOT_COUNT) return;
        if (event.source.containerId === event.slotId) return;
        if (event.swap && event.source.kind === 'slot') {
          const sourceSlotIndex = Number(event.source.containerId.replace('slot-', ''));
          if (!Number.isFinite(sourceSlotIndex) || sourceSlotIndex < 0 || sourceSlotIndex >= SLOT_COUNT) return;
          const moved = slots.value[sourceSlotIndex];
          if (!moved) return;
          const displaced = slots.value[slotIndex];
          slots.value[slotIndex] = moved;
          slots.value[sourceSlotIndex] = displaced ?? null;
          return;
        }

        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const displaced = slots.value[slotIndex];
        slots.value[slotIndex] = moved;
        if (displaced) pool.value.push(displaced);
      }

      function onPoolReorder(event: PoolReorderEvent<unknown>) {
        if (event.fromIndex === event.toIndex) return;
        const [moved] = pool.value.splice(event.fromIndex, 1);
        if (!moved) return;
        let insertIndex = event.toIndex;
        if (event.fromIndex < event.toIndex) insertIndex -= 1;
        pool.value.splice(Math.max(0, Math.min(insertIndex, pool.value.length)), 0, moved as DemoItem);
      }

      function onPoolReceive(event: PoolReceiveEvent<unknown>) {
        const moved = takeFromSource(event.source.containerId, event.source.index);
        if (!moved) return;
        const insertIndex = Math.max(0, Math.min(event.insertIndex, pool.value.length));
        pool.value.splice(insertIndex, 0, moved);
      }

      return {
        slots,
        pool,
        SLOT_COUNT,
        onSlotDrop,
        onPoolReorder,
        onPoolReceive,
      };
    },
    components: { DragAndDrop, Draggable, Slot, Pool },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <DragAndDrop>
          <div style="display: grid; gap: 16px;">
            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Slots</div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
                <Slot
                  v-for="idx in SLOT_COUNT"
                  :key="'slot-' + idx"
                  :slot-id="'slot-' + (idx - 1)"
                  @drop="onSlotDrop"
                >
                  <template #default="{ hovering }">
                    <div
                      style="min-height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
                      :style="{ background: hovering ? '#ecfeff' : '#ffffff' }"
                    >
                      <Draggable
                        v-if="slots[idx - 1]"
                        :draggable-id="'slot-item-' + (idx - 1)"
                        :item="slots[idx - 1]"
                        :source-id="'slot-' + (idx - 1)"
                        source-kind="slot"
                        :source-index="0"
                      >
                        <template #default="{ dragging }">
                          <div
                            :style="{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                              opacity: dragging ? 0.3 : 1
                            }"
                          >
                            {{ slots[idx - 1].label }}
                          </div>
                        </template>
                      </Draggable>
                      <div v-else style="font-size: 12px; color: #9ca3af;">empty</div>
                    </div>
                  </template>
                </Slot>
              </div>
            </div>

            <div>
              <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">Pool</div>
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
                    <div
                      v-if="showPoolGhostAt(i, dragState.active, dragState.hoverTargetName, dragState.hoverTargetIndex, dragState.source, dragState.index, pool.length)"
                      style="height: 34px; min-width: 56px; border-radius: 6px; border: 1px dashed #22c55e; background: #f0fdf4;"
                    />

                    <div
                      v-else
                      :style="{
                        padding: '6px 10px',
                        minWidth: '56px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                        cursor: 'grab',
                        opacity: isDraggingSource('pool', i) ? 0.3 : 1
                      }"
                      @pointerdown.prevent="onPointerDown('pool', i, $event)"
                    >
                      {{ item.label }}
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </template>

          <template #preview="{ item }">
            <div
              v-if="item"
              style="padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.12);"
            >
              {{ item.label }}
            </div>
          </template>
        </DragAndDrop>
      </div>
    `,
  }),
};
*/
