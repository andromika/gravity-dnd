# Gravity - Stardust UI's drag-n-drop component.

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/gravity-dnd) ![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fandromika%2Fgravity-dnd%2Frefs%2Fheads%2Fmain%2Fpackage.json&query=%24.version&label=version)
 **[>> Check the Demo](https://gravity-dnd.vercel.app/?path=/docs/gravity-librarydemo--docs)** 

Originally created back in 2019 for [Pollux.gg](https://pollux.gg)'s Medal Picker from the profile
 editor dashboard ([Original source](https://github.com/PolestarLabs/dashboard/blob/96cdfd6a8b49612c807a38230ab909aaf75ca944/src/views/dashboard/pages/profile_edit.pug)). Original was done in pure frontend Vue2
 and Pug using [vuedraggable](https://www.npmjs.com/package/vuedraggable). 

This package ports it over for more general use as a lightweight, composable
drag-and-drop system for Vue 3.
It has been redesigned for use in component libraries and applications where you want
customizable drop targets, drag sources, and flexible collision behavior.

Component structural styles are bundled with the Vue components. Visual color and border treatments are opt-in and come from the package stylesheet.

```ts
import 'gravity-dnd/styles.css';
```

*Renamed to **Gravity** to keep on-theme with all of other Pollux's side-libs and elements. Mainly its parent component lib: **Stardust UI***

---

## Core Concepts

### GravityProvider
Wrap any part of your app that uses drag/drop in a single `GravityProvider`.
It provides context for all draggables, slots, and pools.

```html
<template>
  <GravityProvider>
    <!-- drag/drop components here -->
  </GravityProvider>
</template>

<script setup>
import 'gravity-dnd/styles.css';
import { GravityProvider } from '@/ui/gravity';
</script>
```

### GravityDraggable
Represents a draggable item.

Key props:
- `draggable-id` (string): unique id for the drag instance
- `item` (any): the data payload carried during drag
- `source-id` (string): identifies the container the drag originates from
- `source-kind` (`'pool' | 'slot' | 'custom'`): used for identifying what type of container a drag comes from
- `source-index` (number): index within the container
- `drop-mode` (`'target' | 'floating'`): controls whether drop is evaluated by hover targets or by pointer release

Example:

```html
<GravityDraggable
  draggable-id="draggable-1"
  :item="item"
  source-id="my-pool"
  source-kind="pool"
  :source-index="index"
>
  <template #default="{ dragging }">
    <div :style="{ opacity:  dragging ? .9 : 1 }">{{ item.label }}</div>
  </template>
</GravityDraggable>
```

### GravitySlot
A drop target that accepts one item at a time.
It emits `drop` events when an item is dropped.

Key props:
- `slot-id` (string): unique identifier for the slot
- `item` (any): current item in the slot (optional)
- `onDropCollision` (`'replace' | 'swap' | 'reject'`): how to handle collisions when slot already contains an item
- `accepts` (function): optional predicate to allow/reject drops based on item + source

```html
<GravitySlot
  slot-id="my-slot"
  :item="currentItem"
  onDropCollision="swap"
  :accepts="(item) => item.type === 'allowed'"
  @drop="handleDrop"
>
  <template #default="{ hovering, accepting }">
    <div :class="{ hover: hovering, accept: accepting }">
      {{ currentItem ? currentItem.label : 'Drop here' }}
    </div>
  </template>
</GravitySlot>
```

### GravityPool
A container that supports reordering items within the pool and receiving items from other sources.

Key events:
- `@reorder` when items inside the pool are reordered
- `@receive` when an item is dropped into the pool from another source

```html
<GravityPool pool-id="my-pool" :items="items" @reorder="onReorder" @receive="onReceive">
  <template #item="{ item, index }">
    <GravityDraggable
      :draggable-id="`pool-${item.id}`"
      :item="item"
      source-id="my-pool"
      source-kind="pool"
      :source-index="index"
    >
      <template #default="{ dragging }">
        <div :style="{ opacity:  dragging ? .9 : 1 }">{{ item.label }}</div>
      </template>
    </GravityDraggable>
  </template>
</GravityPool>
```

---

## Collision Modes (`onDropCollision`)

`GravitySlot` supports three collision behaviors when a drop occurs and the slot is already occupied:

| Mode     | Behavior |
|---------|----------|
| `replace` | Overwrites the current slot item with the dropped item. The existing item is discarded. |
| `swap`    | Swaps the dropped item with the existing slot item. The existing item is returned to the drag source. |
| `reject`  | Prevents the drop. The dragged item is returned to its source container. |

If `onDropCollision` is not configured, the component uses the older `swap` behavior when `swap=true`, otherwise `replace`.

---

## Drop event payload (for slots)

Drop handlers receive a `GravitySlotDropEvent<TItem>` with the following shape:

```ts
interface GravitySlotDropEvent<TItem> {
  draggableId: string;
  item: TItem;
  source: {
    containerId: string;
    kind: 'slot' | 'pool' | 'custom';
    index: number;
  };
  target: {
    kind: 'slot' | 'pool' | 'floating';
    containerId: string | null;
    index: number;
  };
  slotId: string;
  swap: boolean;
  collision: 'replace' | 'swap' | 'reject';
  replacedItem?: TItem;
}
```

- `collision`: the configured collision rule in effect.
- `replacedItem`: the item that was in the slot prior to the drop (available for `swap`/`replace`).

---

## Extending / Customizing Behavior

### Custom Accept Logic
Use `accepts` to fine-tune which items can be dropped into a slot.

```html
<GravitySlot
  slot-id="custom-slot"
  :accepts="(item, { sourceContainerId }) => sourceContainerId === 'trusted-pool'"
  @drop="onDrop"
/>
```

### Custom Slot Rendering
Use the slot scope values to render feedback:

- `hovering`: whether the pointer is hovering the slot
- `accepting`: whether the current drag is accepted

```html
<GravitySlot slot-id="styled-slot" @drop="onDrop">
  <template #default="{ hovering, accepting }">
    <div :class="{ 'hovering': hovering, 'accepting': accepting }">
      <!-- custom status UI -->
    </div>
  </template>
</GravitySlot>
```

### Extending drop logic in parent components
Use event handlers to implement complex behavior (e.g., persistence, undo, analytics).

```ts
function handleSlotDrop(event: GravitySlotDropEvent<MyItem>) {
  // apply app-specific rules
  if (event.collision === 'swap') {
    // maybe persist both items
  }
  updateLocalState(event);
}
```

---

## Use Cases

### 1) Drag-to-slot with swap behavior
- Use case: a single slot that accepts an item, but dropping another item should return the original back to its source.
- Configure:
  - `onDropCollision="swap"`

### 2) Drag-to-slot with replace behavior
- Use case: a slot that always accepts the newest item and discards the previous.
- Configure:
  - `onDropCollision="replace"` (or `swap=false`)

### 3) Drop rejection based on slot fullness
- Use case: only allow a drop when the slot is empty.
- Configure:
  - `onDropCollision="reject"`

### 4) Ordered pool with receive/reorder
- Use case: a list of draggable items where items can be reordered and new items can be dropped in.
- Use `GravityPool` + `@reorder` + `@receive`.

---

## Quick Start (smallest sample)

```html
<template>
  <GravityProvider>
    <GravitySlot slot-id="target" onDropCollision="swap" @drop="onDrop">
      <template #default="{ hovering, accepting }">
        <div :style="{ background: hovering ? (accepting ? '#e0f7ff' : '#ffeaea') : '#fff' }">
          Drop an item here
        </div>
      </template>
    </GravitySlot>

    <GravityPool pool-id="pool" :items="items" @receive="onReceive" @reorder="onReorder">
      <template #item="{ item, index }">
        <GravityDraggable
          :draggable-id="`item-${item.id}`"
          :item="item"
          source-id="pool"
          source-kind="pool"
          :source-index="index"
        >
          <template #default="{ dragging }">
            <div :style="{ opacity: dragging ? 0.3 : 1 }">{{ item.label }}</div>
          </template>
        </GravityDraggable>
      </template>
    </GravityPool>
  </GravityProvider>
</template>

<script setup lang="ts">
import 'gravity-dnd/styles.css';
import { ref } from 'vue';
import { GravityProvider, GravityPool, GravitySlot, GravityDraggable } from '@/ui/gravity';

const items = ref([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]);

function onDrop(event) {
  // handle drop
}
function onReceive(event) {
  // handle received item
}
function onReorder(event) {
  // handle reorder
}
</script>
```

---

## Notes
- This drag/drop system is intentionally lightweight and does not have built-in keyboard accessibility.
- For production use, wrap drag-drop logic in safe state updates (avoid mutating arrays directly in complex UIs).
- The `onDropCollision` API is designed for specific use-cases from Pollux.gg's dashboard, its implementation might be a bit stiff.
- Better mobile support is planned for future iterations
- React support is being considered.
