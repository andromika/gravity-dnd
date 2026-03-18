import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import GravityProvider from '../Draggable/DragDropProvider.vue';
import Draggable from '../Draggable/Draggable.vue';
import Slot from './Slot.vue';
import type { GravitySlotDropEvent } from '../Draggable/contracts';

interface DemoItem {
  id: string;
  label: string;
  tier: 'bronze' | 'gold';
}

const meta: Meta<typeof Slot> = {
  title: 'Gravity/Slot',
  component: Slot,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Slot>;

export const AcceptAll: Story = {
  render: () => ({
    setup() {
      const sourceItem = ref<DemoItem | null>({
        id: 'source-accept-all',
        label: 'Any Item',
        tier: 'bronze',
      });
      const slottedItem = ref<DemoItem | null>(null);

      function onDrop(event: GravitySlotDropEvent<unknown>) {
        slottedItem.value = event.item as DemoItem;
        if (event.source.containerId === 'slot-story-source') {
          sourceItem.value = null;
        }
      }

      return { sourceItem, slottedItem, onDrop };
    },
    components: { GravityProvider, Draggable, Slot },
    template: `
      <div style="width: 460px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="min-height: 64px;">
              <Draggable
                v-if="sourceItem"
                draggable-id="slot-story-accept-all"
                :item="sourceItem"
                source-id="slot-story-source"
                source-kind="custom"
                :source-index="0"
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
                    {{ sourceItem.label }}
                  </div>
                </template>
              </Draggable>
              <div
                v-else
                aria-hidden="true"
                style="padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; visibility: hidden;"
              >
                hidden
              </div>
            </div>

            <Slot slot-id="slot-accept-all" @drop="onDrop">
              <template #default="{ hovering, accepting }">
                <div
                  :style="{
                    minHeight: '64px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hovering ? (accepting ? '#ecfeff' : '#fff1f2') : '#fff'
                  }"
                >
                  {{ slottedItem ? slottedItem.label : 'Accepts all draggables' }}
                </div>
              </template>
            </Slot>
          </div>

        </GravityProvider>
      </div>
    `,
  }),
};

export const ExplicitDeny: Story = {
  render: () => ({
    setup() {
      const sourceItem = ref<DemoItem | null>({
        id: 'source-deny-all',
        label: 'Denied Item',
        tier: 'gold',
      });
      const slottedItem = ref<DemoItem | null>(null);

      function onDrop(event: GravitySlotDropEvent<unknown>) {
        slottedItem.value = event.item as DemoItem;
        if (event.source.containerId === 'slot-story-source-deny') {
          sourceItem.value = null;
        }
      }

      return { sourceItem, slottedItem, onDrop };
    },
    components: { GravityProvider, Draggable, Slot },
    template: `
      <div style="width: 460px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="min-height: 64px;">
              <Draggable
                v-if="sourceItem"
                draggable-id="slot-story-deny-all"
                :item="sourceItem"
                source-id="slot-story-source-deny"
                source-kind="custom"
                :source-index="0"
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
                    {{ sourceItem.label }}
                  </div>
                </template>
              </Draggable>
              <div
                v-else
                aria-hidden="true"
                style="padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; visibility: hidden;"
              >
                hidden
              </div>
            </div>

            <Slot slot-id="slot-deny-all" :accepts="() => false" @drop="onDrop">
              <template #default="{ hovering, accepting }">
                <div
                  :style="{
                    minHeight: '64px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hovering ? (accepting ? '#ecfeff' : '#fff1f2') : '#fff'
                  }"
                >
                  {{ slottedItem ? slottedItem.label : 'Always rejects drops' }}
                </div>
              </template>
            </Slot>
          </div>

        </GravityProvider>
      </div>
    `,
  }),
};

export const FilteredAccept: Story = {
  render: () => ({
    setup() {
      const bronze = ref<DemoItem | null>({ id: 'bronze', label: 'Bronze Item', tier: 'bronze' });
      const gold = ref<DemoItem | null>({ id: 'gold', label: 'Gold Item', tier: 'gold' });
      const slottedItem = ref<DemoItem | null>(null);

      function acceptsGold(item: unknown) {
        return (item as DemoItem)?.tier === 'gold';
      }
      function onDrop(event: GravitySlotDropEvent<unknown>) {
        slottedItem.value = event.item as DemoItem;
        if (event.source.containerId === 'slot-story-filter-source') {
          if (event.source.index === 0) bronze.value = null;
          if (event.source.index === 1) gold.value = null;
        }
      }

      return { bronze, gold, slottedItem, acceptsGold, onDrop };
    },
    components: { GravityProvider, Draggable, Slot },
    template: `
      <div style="width: 560px; max-width: 96vw; font-family: system-ui, sans-serif;">
        <GravityProvider>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div style="min-height: 64px;">
              <Draggable
                v-if="bronze"
                draggable-id="slot-story-bronze"
                :item="bronze"
                source-id="slot-story-filter-source"
                source-kind="custom"
                :source-index="0"
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
                    {{ bronze.label }}
                  </div>
                </template>
              </Draggable>
              <div
                v-else
                aria-hidden="true"
                style="padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; visibility: hidden;"
              >
                hidden
              </div>
            </div>

            <div style="min-height: 64px;">
              <Draggable
                v-if="gold"
                draggable-id="slot-story-gold"
                :item="gold"
                source-id="slot-story-filter-source"
                source-kind="custom"
                :source-index="1"
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
                    {{ gold.label }}
                  </div>
                </template>
              </Draggable>
              <div
                v-else
                aria-hidden="true"
                style="padding: 10px 12px; border-radius: 8px; border: 1px solid transparent; visibility: hidden;"
              >
                hidden
              </div>
            </div>

            <Slot slot-id="slot-filtered" :accepts="acceptsGold" @drop="onDrop">
              <template #default="{ hovering, accepting }">
                <div
                  :style="{
                    minHeight: '64px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    background: hovering ? (accepting ? '#ecfeff' : '#fff1f2') : '#fff'
                  }"
                >
                  {{ slottedItem ? slottedItem.label : 'Only accepts gold tier' }}
                </div>
              </template>
            </Slot>
          </div>

        </GravityProvider>
      </div>
    `,
  }),
};
