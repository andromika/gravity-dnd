import type {
  DragDropDropEvent,
  DragDropDropTarget,
  DragDropHoverTarget,
  DragDropMode,
  DragDropSource,
} from './contracts';

export interface InternalDropTargetRegistration {
  id: string;
  kind: 'slot' | 'pool';
  containerId: string;
  resolveHover: (
    clientX: number,
    clientY: number,
    context: {
      item: unknown;
      source: DragDropSource;
    }
  ) => Omit<DragDropHoverTarget, 'id' | 'kind' | 'containerId'> | null;
  onDrop?: (payload: DragDropDropEvent<unknown>) => void;
}

interface ResolveDropTargetInput {
  mode: DragDropMode;
  hoverTarget: DragDropHoverTarget | null;
  source: DragDropSource | null;
}

const FLOATING_TARGET: DragDropDropTarget = {
  kind: 'floating',
  containerId: null,
  index: -1,
};

export function createInternalDropLayer() {
  const targets = new Map<string, InternalDropTargetRegistration>();

  function registerTarget(target: InternalDropTargetRegistration) {
    targets.set(target.id, target);
    return () => {
      targets.delete(target.id);
    };
  }

  function detectHoverTarget(
    clientX: number,
    clientY: number,
    context: {
      item: unknown;
      source: DragDropSource;
    }
  ): DragDropHoverTarget | null {
    for (const target of targets.values()) {
      const resolved = target.resolveHover(clientX, clientY, context);
      if (!resolved) continue;
      return {
        id: target.id,
        kind: target.kind,
        containerId: target.containerId,
        index: resolved.index,
        accepts: resolved.accepts,
      };
    }
    return null;
  }

  function resolveDropTarget(input: ResolveDropTargetInput): { target: DragDropDropTarget; accepted: boolean } {
    if (
      input.hoverTarget &&
      input.source &&
      input.hoverTarget.containerId === input.source.containerId &&
      input.hoverTarget.kind === input.source.kind &&
      input.hoverTarget.index === input.source.index
    ) {
      return {
        target: {
          kind: input.hoverTarget.kind,
          containerId: input.hoverTarget.containerId,
          index: input.hoverTarget.index,
        },
        accepted: true,
      };
    }

    if (input.hoverTarget && input.hoverTarget.accepts) {
      return {
        target: {
          kind: input.hoverTarget.kind,
          containerId: input.hoverTarget.containerId,
          index: input.hoverTarget.index,
        },
        accepted: true,
      };
    }

    if (input.mode === 'floating') {
      return {
        target: FLOATING_TARGET,
        accepted: true,
      };
    }

    return {
      target: FLOATING_TARGET,
      accepted: false,
    };
  }

  function getTarget(targetId: string | null | undefined) {
    if (!targetId) return null;
    return targets.get(targetId) ?? null;
  }

  function clear() {
    targets.clear();
  }

  return {
    registerTarget,
    detectHoverTarget,
    resolveDropTarget,
    getTarget,
    clear,
  };
}
