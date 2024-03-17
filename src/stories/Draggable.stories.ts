import type { Meta, StoryObj } from '@storybook/vue3';
import Draggable from '../components/Draggable.vue';

const meta: Meta<typeof Draggable> = {
  title: 'Components/Draggable',
  component: Draggable,
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof Draggable>;

export const Default: Story = {
  args: {
    // add component props here once available
  }
};
