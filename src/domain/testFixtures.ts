import type { Board, BoardComponent, WireConnection } from "./types";

export const testBoard: Board = {
  id: "b1",
  name: "Test board",
  widthModulesPerRow: 6,
  rows: [{ id: "r1", index: 0, maxModules: 6 }],
  supplyTerminals: [
    {
      id: "supply-l1",
      label: "L1",
      role: "power_source",
      pole: "L1",
      direction: "out",
      position: { x: 10, y: 10 }
    },
    {
      id: "supply-n",
      label: "N",
      role: "neutral_source",
      pole: "N",
      direction: "out",
      position: { x: 10, y: 30 }
    },
    {
      id: "supply-pe",
      label: "PE",
      role: "earth_source",
      pole: "PE",
      direction: "out",
      position: { x: 10, y: 50 }
    }
  ]
};

export function dinComponent(id: string, startModule: number, moduleWidth = 2): BoardComponent {
  return {
    id,
    catalogItemId: "mcb",
    type: "mcb",
    name: id,
    moduleWidth,
    placementMode: "din_module",
    terminals: [],
    electrical: {},
    layout: { placementMode: "din_module", row: 0, startModule }
  };
}

export const source: BoardComponent = {
  id: "source",
  catalogItemId: "main",
  type: "main_switch",
  name: "Main",
  moduleWidth: 4,
  placementMode: "din_module",
  layout: { placementMode: "din_module", row: 0, startModule: 0 },
  electrical: {},
  terminals: [
    { id: "l-in", label: "L in", role: "power_in", pole: "L1", direction: "in" },
    { id: "l-out", label: "L out", role: "power_out", pole: "L1", direction: "out" },
    { id: "pe", label: "PE", role: "earth", pole: "PE", direction: "bidirectional" }
  ]
};

export const load: BoardComponent = {
  id: "load",
  catalogItemId: "mcb",
  type: "mcb",
  name: "Load",
  moduleWidth: 1,
  placementMode: "din_module",
  layout: { placementMode: "din_module", row: 0, startModule: 4 },
  electrical: { requiresInput: true },
  terminals: [
    { id: "l-in", label: "L in", role: "power_in", pole: "L1", direction: "in" },
    { id: "l-out", label: "L out", role: "power_out", pole: "L1", direction: "out" }
  ]
};

export const neutralBus: BoardComponent = {
  id: "n-bus",
  catalogItemId: "generic-n-bus-8",
  type: "neutral_bus",
  name: "N bus",
  moduleWidth: 8,
  placementMode: "free",
  layout: { placementMode: "free", x: 80, y: 130 },
  electrical: { busType: "N" },
  terminals: [{ id: "n1", label: "N1", role: "neutral_bus", pole: "N", direction: "bidirectional" }]
};

export const peBus: BoardComponent = {
  id: "pe-bus",
  catalogItemId: "generic-pe-bus-8",
  type: "pe_bus",
  name: "PE bus",
  moduleWidth: 8,
  placementMode: "free",
  layout: { placementMode: "free", x: 80, y: 130 },
  electrical: { busType: "PE" },
  terminals: [{ id: "pe1", label: "PE1", role: "earth", pole: "PE", direction: "bidirectional" }]
};

export function wire(
  from: WireConnection["from"],
  to: WireConnection["to"],
  id = "w1"
): WireConnection {
  return {
    id,
    from,
    to,
    cable: { crossSectionMm2: 2.5, type: "H07V-K", color: "brown" }
  };
}
