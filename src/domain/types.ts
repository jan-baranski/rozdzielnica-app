export type ComponentType =
  | "mcb"
  | "rcd"
  | "rcbo"
  | "spd"
  | "main_switch"
  | "neutral_bus"
  | "pe_bus"
  | "blank"
  | "bulb"
  | "outlet";

export type TerminalRole =
  | "power_in"
  | "power_out"
  | "neutral_in"
  | "neutral_out"
  | "neutral_bus"
  | "earth";

export type BoardTerminalRole = "power_source" | "neutral_source" | "earth_source";
export type Pole = "L1" | "L2" | "L3" | "N" | "PE";
export type TerminalDirection = "in" | "out" | "bidirectional";
export type ValidationSeverity = "error" | "warning";
export type PlacementMode = "din_module" | "free";

export interface Board {
  id: string;
  name: string;
  rows: BoardRow[];
  widthModulesPerRow: number;
  supplyTerminals: BoardTerminal[];
}

export interface BoardRow {
  id: string;
  index: number;
  maxModules: number;
}

export interface Terminal {
  id: string;
  label: string;
  role: TerminalRole;
  pole: Pole;
  direction: TerminalDirection;
}

export interface BoardTerminal {
  id: string;
  label: string;
  role: BoardTerminalRole;
  pole: Pole;
  direction: "out";
  position: {
    x: number;
    y: number;
  };
}

export interface ComponentElectricalProperties {
  ratedCurrentA?: number;
  curve?: string;
  poles?: number;
  sensitivityMa?: number;
  voltage?: string;
  shortCircuitCapacityKa?: number;
  requiresInput?: boolean;
  isMainSwitch?: boolean;
  busType?: "N" | "PE";
  externalLoad?: boolean;
  requiredPoles?: Pole[];
}

export interface DinModuleLayout {
  placementMode: "din_module";
  row: number;
  startModule: number;
}

export interface FreeLayoutProperties {
  placementMode: "free";
  x: number;
  y: number;
}

export type LayoutProperties = DinModuleLayout | FreeLayoutProperties;

export interface BoardComponent {
  id: string;
  catalogItemId: string;
  type: ComponentType;
  name: string;
  moduleWidth: number;
  placementMode: PlacementMode;
  terminals: Terminal[];
  electrical: ComponentElectricalProperties;
  layout: LayoutProperties;
}

export type WireEndpoint =
  | {
      kind: "component_terminal";
      componentId: string;
      terminalId: string;
    }
  | {
      kind: "board_terminal";
      boardTerminalId: string;
    };

export type ConnectionEndpoint = WireEndpoint;

export interface LegacyConnectionEndpoint {
  componentId: string;
  terminalId: string;
}

export interface CableProperties {
  crossSectionMm2: number;
  type: string;
  color: string;
}

export interface WireConnection {
  id: string;
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
  cable: CableProperties;
}

export interface VisualAsset {
  src: string;
  widthModules?: number;
  widthPx?: number;
  heightPx: number;
}

export interface CatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  displayName: string;
  type: ComponentType;
  placementMode: PlacementMode;
  moduleWidth: number;
  terminalsTemplate: Terminal[];
  electricalTemplate: ComponentElectricalProperties;
  visual: VisualAsset;
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  relatedComponents?: string[];
  relatedWires?: string[];
  suggestion?: string;
}

export interface ProjectData {
  board: Board;
  components: BoardComponent[];
  wires: WireConnection[];
}
