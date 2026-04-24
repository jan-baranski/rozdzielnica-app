"use client";

import { create } from "zustand";
import demoProjectJson from "../../public/projects/demo-board.json";
import { createComponentFromCatalog, findCatalogItem } from "@/domain/catalog";
import { endpointKey, resolveEndpoint } from "@/domain/connectivityEngine";
import { projectSchema } from "@/domain/projectSchema";
import { validateProject } from "@/domain/validation";
import type {
  Board,
  BoardComponent,
  CatalogItem,
  ProjectData,
  ValidationIssue,
  WireEndpoint,
  WireConnection
} from "@/domain/types";

export const activeDragState: { catalogId?: string; componentId?: string } = {};

type SelectedItem =
  | { kind: "component"; id: string }
  | { kind: "wire"; id: string }
  | { kind: "terminal"; endpoint: WireEndpoint }
  | null;

interface BoardState extends ProjectData {
  selectedItem: SelectedItem;
  pendingTerminal: WireEndpoint | null;
  editingWireId: string | null;
  boardZoom: number;
  validationResults: ValidationIssue[];
  updateBoardSize: (size: { rowCount: number; modulesPerRow: number }) => void;
  setBoardZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  addComponent: (item: CatalogItem, layout: BoardComponent["layout"]) => void;
  moveComponent: (componentId: string, layout: BoardComponent["layout"]) => void;
  updateComponentName: (componentId: string, name: string) => void;
  updateComponentElectrical: (componentId: string, electrical: Partial<BoardComponent["electrical"]>) => void;
  removeComponent: (componentId: string) => void;
  selectItem: (item: SelectedItem) => void;
  clickTerminal: (endpoint: WireEndpoint) => void;
  removeWire: (wireId: string) => void;
  updateWireCable: (wireId: string, cable: Partial<WireConnection["cable"]>) => void;
  focusIssue: (issue: ValidationIssue) => void;
  exportProject: () => string;
  importProject: (json: string) => { ok: true } | { ok: false; error: string };
  loadEmptyProject: () => void;
  loadDemo: () => void;
}

const demoProject = projectSchema.parse(demoProjectJson);

function createEmptyProject(): ProjectData {
  return {
    board: {
      id: `board-${crypto.randomUUID()}`,
      name: "Nowa rozdzielnica",
      widthModulesPerRow: 24,
      supplyTerminals: [
        { id: "supply-l1", label: "L1", role: "power_source", pole: "L1", direction: "out", position: { x: 16, y: 18 } },
        { id: "supply-l2", label: "L2", role: "power_source", pole: "L2", direction: "out", position: { x: 16, y: 42 } },
        { id: "supply-l3", label: "L3", role: "power_source", pole: "L3", direction: "out", position: { x: 16, y: 66 } },
        { id: "supply-n", label: "N", role: "neutral_source", pole: "N", direction: "out", position: { x: 16, y: 90 } },
        { id: "supply-pe", label: "PE", role: "earth_source", pole: "PE", direction: "out", position: { x: 16, y: 138 } }
      ],
      rows: [
        { id: `row-${crypto.randomUUID()}`, index: 0, maxModules: 24 },
        { id: `row-${crypto.randomUUID()}`, index: 1, maxModules: 24 }
      ]
    },
    components: [],
    wires: []
  };
}

function validateState(project: ProjectData): ValidationIssue[] {
  return validateProject(project);
}

function colorForEndpoint(endpoint: WireEndpoint, board: Board, components: BoardComponent[]): string {
  const terminal = resolveEndpoint(board, components, endpoint)?.terminal;

  if (terminal?.pole === "N") {
    return "blue";
  }

  if (terminal?.pole === "PE") {
    return "green/yellow";
  }

  if (terminal?.pole === "L2") {
    return "black";
  }

  if (terminal?.pole === "L3") {
    return "grey";
  }

  return "brown";
}

function wireExists(wires: WireConnection[], a: WireEndpoint, b: WireEndpoint): boolean {
  const aKey = endpointKey(a);
  const bKey = endpointKey(b);
  return wires.some((wire) => {
    const fromKey = endpointKey(wire.from);
    const toKey = endpointKey(wire.to);
    const sameDirection = fromKey === aKey && toKey === bKey;
    const reverseDirection = fromKey === bKey && toKey === aKey;
    return sameDirection || reverseDirection;
  });
}

function withValidation(state: Pick<ProjectData, "board" | "components" | "wires">) {
  return {
    ...state,
    validationResults: validateState(state)
  };
}

function clampZoom(zoom: number): number {
  return Math.max(0.5, Math.min(2, Math.round(zoom * 100) / 100));
}

function resizeBoard(board: Board, rowCount: number, modulesPerRow: number): Board {
  const safeRowCount = Math.max(1, Math.min(8, Math.round(rowCount)));
  const safeModulesPerRow = Math.max(6, Math.min(48, Math.round(modulesPerRow)));

  return {
    ...board,
    widthModulesPerRow: safeModulesPerRow,
    rows: Array.from({ length: safeRowCount }, (_, index) => ({
      id: board.rows[index]?.id ?? `row-${crypto.randomUUID()}`,
      index,
      maxModules: safeModulesPerRow
    }))
  };
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: demoProject.board as Board,
  components: demoProject.components,
  wires: demoProject.wires,
  selectedItem: null,
  pendingTerminal: null,
  editingWireId: null,
  boardZoom: 1,
  validationResults: validateState(demoProject),

  updateBoardSize: ({ rowCount, modulesPerRow }) => {
    set((state) =>
      withValidation({
        board: resizeBoard(state.board, rowCount, modulesPerRow),
        components: state.components,
        wires: state.wires
      })
    );
  },

  setBoardZoom: (zoom) => set({ boardZoom: clampZoom(zoom) }),
  zoomIn: () => set((state) => ({ boardZoom: clampZoom(state.boardZoom + 0.1) })),
  zoomOut: () => set((state) => ({ boardZoom: clampZoom(state.boardZoom - 0.1) })),
  resetZoom: () => set({ boardZoom: 1 }),

  addComponent: (item, layout) => {
    const component = createComponentFromCatalog(item, layout);
    set((state) => ({
      ...withValidation({
        board: state.board,
        components: [...state.components, component],
        wires: state.wires
      }),
      selectedItem: { kind: "component", id: component.id }
    }));
  },

  moveComponent: (componentId, layout) => {
    set((state) =>
      withValidation({
        board: state.board,
        components: state.components.map((component) =>
          component.id === componentId ? { ...component, layout } : component
        ),
        wires: state.wires
      })
    );
  },

  updateComponentName: (componentId, name) => {
    set((state) =>
      withValidation({
        board: state.board,
        components: state.components.map((component) =>
          component.id === componentId ? { ...component, name } : component
        ),
        wires: state.wires
      })
    );
  },

  updateComponentElectrical: (componentId, electrical) => {
    set((state) =>
      withValidation({
        board: state.board,
        components: state.components.map((component) =>
          component.id === componentId
            ? { ...component, electrical: { ...component.electrical, ...electrical } }
            : component
        ),
        wires: state.wires
      })
    );
  },

  removeComponent: (componentId) => {
    set((state) => ({
      ...withValidation({
        board: state.board,
        components: state.components.filter((component) => component.id !== componentId),
        wires: state.wires.filter(
          (wire) =>
            !(
              (wire.from.kind === "component_terminal" && wire.from.componentId === componentId) ||
              (wire.to.kind === "component_terminal" && wire.to.componentId === componentId)
            )
        )
      }),
      selectedItem: null,
      pendingTerminal: null
    }));
  },

  selectItem: (item) => set({ selectedItem: item, editingWireId: null }),

  clickTerminal: (endpoint) => {
    const state = get();

    // 1. If we are currently moving a wire end
    if (state.editingWireId) {
      const wireId = state.editingWireId;
      const pending = state.pendingTerminal; // This is the FIXED end
      if (!pending) return;

      if (endpointKey(pending) === endpointKey(endpoint)) {
         set({ pendingTerminal: null, editingWireId: null });
         return;
      }

      set((state) => ({
        ...withValidation({
          board: state.board,
          components: state.components,
          wires: state.wires.map((wire) =>
            wire.id === wireId ? { ...wire, from: pending, to: endpoint } : wire
          )
        }),
        selectedItem: { kind: "wire", id: wireId },
        pendingTerminal: null,
        editingWireId: null
      }));
      return;
    }

    // 2. If a wire is selected and we click one of its terminals, pick it up
    if (state.selectedItem?.kind === "wire") {
      const wire = state.wires.find((w) => w.id === (state.selectedItem as any).id);
      if (wire) {
        const isFrom = endpointKey(wire.from) === endpointKey(endpoint);
        const isTo = endpointKey(wire.to) === endpointKey(endpoint);
        if (isFrom || isTo) {
          set({
            editingWireId: wire.id,
            pendingTerminal: isFrom ? wire.to : wire.from,
            selectedItem: { kind: "terminal", endpoint }
          });
          return;
        }
      }
    }

    // 3. Normal wire creation logic
    if (!state.pendingTerminal) {
      set({ pendingTerminal: endpoint, selectedItem: { kind: "terminal", endpoint } });
      return;
    }

    const pending = state.pendingTerminal;
    if (endpointKey(pending) === endpointKey(endpoint)) {
      set({ pendingTerminal: null });
      return;
    }

    if (wireExists(state.wires, pending, endpoint)) {
      set({ pendingTerminal: null });
      return;
    }

    const wire: WireConnection = {
      id: crypto.randomUUID(),
      from: pending,
      to: endpoint,
      cable: {
        crossSectionMm2: 2.5,
        type: "H07V-K",
        color: colorForEndpoint(pending, state.board, state.components)
      }
    };

    set({
      ...withValidation({
        board: state.board,
        components: state.components,
        wires: [...state.wires, wire]
      }),
      selectedItem: { kind: "wire", id: wire.id },
      pendingTerminal: null
    });
  },

  removeWire: (wireId) => {
    set((state) => ({
      ...withValidation({
        board: state.board,
        components: state.components,
        wires: state.wires.filter((wire) => wire.id !== wireId)
      }),
      selectedItem: null
    }));
  },

  updateWireCable: (wireId, cable) => {
    set((state) =>
      withValidation({
        board: state.board,
        components: state.components,
        wires: state.wires.map((wire) =>
          wire.id === wireId ? { ...wire, cable: { ...wire.cable, ...cable } } : wire
        )
      })
    );
  },

  focusIssue: (issue) => {
    const componentId = issue.relatedComponents?.[0];
    const wireId = issue.relatedWires?.[0];
    if (wireId) {
      set({ selectedItem: { kind: "wire", id: wireId } });
    } else if (componentId) {
      set({ selectedItem: { kind: "component", id: componentId } });
    }
  },

  exportProject: () => {
    const { board, components, wires } = get();
    return JSON.stringify({ board, components, wires }, null, 2);
  },

  importProject: (json) => {
    try {
      const project = projectSchema.parse(JSON.parse(json));
      set({
        board: project.board,
        components: project.components,
        wires: project.wires,
        selectedItem: null,
        pendingTerminal: null,
        validationResults: validateState(project)
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid project JSON"
      };
    }
  },

  loadEmptyProject: () => {
    const project = createEmptyProject();
    set({
      board: project.board,
      components: project.components,
      wires: project.wires,
      selectedItem: null,
      pendingTerminal: null,
      validationResults: validateState(project)
    });
  },

  loadDemo: () => {
    set({
      board: demoProject.board,
      components: demoProject.components,
      wires: demoProject.wires,
      selectedItem: null,
      pendingTerminal: null,
      validationResults: validateState(demoProject)
    });
  }
}));

export function getCatalogVisual(component: BoardComponent): string {
  return findCatalogItem(component.catalogItemId)?.visual.src ?? "/assets/components/blank.png";
}
