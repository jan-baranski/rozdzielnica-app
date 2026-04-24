import type {
  Board,
  BoardComponent,
  BoardTerminal,
  Terminal,
  TerminalDirection,
  TerminalRole,
  ValidationIssue,
  WireConnection,
  WireEndpoint
} from "./types";

export interface ConnectionGraph {
  adjacency: Map<string, Set<string>>;
  endpointsByKey: Map<string, WireEndpoint>;
}

export interface ResolvedEndpoint {
  endpoint: WireEndpoint;
  ownerId: string;
  ownerName: string;
  ownerKind: "component" | "board";
  terminal: Terminal | BoardTerminal;
  normalizedRole: TerminalRole;
  direction: TerminalDirection;
}

export function componentEndpoint(componentId: string, terminalId: string): WireEndpoint {
  return { kind: "component_terminal", componentId, terminalId };
}

export function boardEndpoint(boardTerminalId: string): WireEndpoint {
  return { kind: "board_terminal", boardTerminalId };
}

export function endpointKey(endpoint: WireEndpoint): string {
  return endpoint.kind === "board_terminal"
    ? `board:${endpoint.boardTerminalId}`
    : `component:${endpoint.componentId}:${endpoint.terminalId}`;
}

function normalizeBoardTerminalRole(terminal: BoardTerminal): TerminalRole {
  if (terminal.role === "earth_source") {
    return "earth";
  }
  if (terminal.role === "neutral_source") {
    return "neutral_out";
  }
  return "power_out";
}

export function resolveEndpoint(
  board: Board,
  components: BoardComponent[],
  endpoint: WireEndpoint
): ResolvedEndpoint | null {
  if (endpoint.kind === "board_terminal") {
    const terminal = board.supplyTerminals.find((candidate) => candidate.id === endpoint.boardTerminalId);
    return terminal
      ? {
          endpoint,
          ownerId: board.id,
          ownerName: "Zasilanie rozdzielnicy",
          ownerKind: "board",
          terminal,
          normalizedRole: normalizeBoardTerminalRole(terminal),
          direction: terminal.direction
        }
      : null;
  }

  const component = components.find((candidate) => candidate.id === endpoint.componentId);
  const terminal = component?.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  return component && terminal
    ? {
        endpoint,
        ownerId: component.id,
        ownerName: component.name,
        ownerKind: "component",
        terminal,
        normalizedRole: terminal.role,
        direction: terminal.direction
      }
    : null;
}

export function findTerminal(
  board: Board,
  components: BoardComponent[],
  endpoint: WireEndpoint
): ResolvedEndpoint | null {
  return resolveEndpoint(board, components, endpoint);
}

export function buildConnectionGraph(
  wires: WireConnection[],
  board?: Board
): ConnectionGraph {
  const adjacency = new Map<string, Set<string>>();
  const endpointsByKey = new Map<string, WireEndpoint>();

  board?.supplyTerminals.forEach((terminal) => {
    const endpoint = boardEndpoint(terminal.id);
    const key = endpointKey(endpoint);
    endpointsByKey.set(key, endpoint);
    adjacency.set(key, adjacency.get(key) ?? new Set());
  });

  wires.forEach((wire) => {
    const fromKey = endpointKey(wire.from);
    const toKey = endpointKey(wire.to);
    endpointsByKey.set(fromKey, wire.from);
    endpointsByKey.set(toKey, wire.to);
    adjacency.set(fromKey, adjacency.get(fromKey) ?? new Set());
    adjacency.set(toKey, adjacency.get(toKey) ?? new Set());
    adjacency.get(fromKey)?.add(toKey);
    adjacency.get(toKey)?.add(fromKey);
  });

  return { adjacency, endpointsByKey };
}

function directionsCompatible(a: ResolvedEndpoint, b: ResolvedEndpoint): boolean {
  if (a.direction === "bidirectional" || b.direction === "bidirectional") {
    return true;
  }

  return a.direction !== b.direction;
}

function rolesCompatible(a: ResolvedEndpoint, b: ResolvedEndpoint): boolean {
  if (a.normalizedRole === "earth" || b.normalizedRole === "earth") {
    return a.normalizedRole === "earth" && b.normalizedRole === "earth";
  }

  const aPole = a.terminal.pole;
  const bPole = b.terminal.pole;
  const neutralPair = aPole === "N" && bPole === "N";
  const livePair = aPole.startsWith("L") && bPole.startsWith("L");
  const compatiblePoles = neutralPair || livePair;

  if (!compatiblePoles) {
    return false;
  }

  const aIn = a.normalizedRole.endsWith("_in");
  const aOut = a.normalizedRole.endsWith("_out") || a.normalizedRole === "neutral_bus";
  const bIn = b.normalizedRole.endsWith("_in");
  const bOut = b.normalizedRole.endsWith("_out") || b.normalizedRole === "neutral_bus";

  return (aIn && bOut) || (aOut && bIn) || a.direction === "bidirectional" || b.direction === "bidirectional";
}

export function validateTerminalCompatibility(
  board: Board,
  components: BoardComponent[],
  wire: WireConnection
): ValidationIssue[] {
  const from = resolveEndpoint(board, components, wire.from);
  const to = resolveEndpoint(board, components, wire.to);

  if (!from || !to) {
    return [
      {
        severity: "error",
        code: "WIRE_MISSING_TERMINAL",
        message: "Przewód wskazuje zacisk, który już nie istnieje.",
        relatedWires: [wire.id],
        suggestion: "Usuń przewód albo podłącz go do istniejącego zacisku."
      }
    ];
  }

  if (from.terminal.pole === "PE" || to.terminal.pole === "PE") {
    if (from.normalizedRole !== "earth" || to.normalizedRole !== "earth") {
      return [
        {
          severity: "error",
          code: "PE_TO_NON_EARTH",
          message: "W tym modelu MVP przewody PE mogą łączyć się tylko z zaciskami ochronnymi.",
          relatedComponents: [from.ownerKind === "component" ? from.ownerId : "", to.ownerKind === "component" ? to.ownerId : ""].filter(Boolean),
          relatedWires: [wire.id],
          suggestion: "Podłącz PE wyłącznie do zacisków oznaczonych PE."
        }
      ];
    }
  }

  if (!directionsCompatible(from, to) || !rolesCompatible(from, to)) {
    return [
      {
        severity: "error",
        code: "TERMINAL_INCOMPATIBLE",
        message: `${from.ownerName} ${from.terminal.label} nie jest zgodny z ${to.ownerName} ${to.terminal.label}.`,
        relatedComponents: [from.ownerKind === "component" ? from.ownerId : "", to.ownerKind === "component" ? to.ownerId : ""].filter(Boolean),
        relatedWires: [wire.id],
        suggestion: "Połącz zacisk wyjściowy z pasującym zaciskiem wejściowym."
      }
    ];
  }

  return [];
}

export function findUnconnectedTerminals(
  components: BoardComponent[],
  wires: WireConnection[]
): Array<{ component: BoardComponent; terminal: Terminal }> {
  const connected = new Set<string>();
  wires.forEach((wire) => {
    connected.add(endpointKey(wire.from));
    connected.add(endpointKey(wire.to));
  });

  return components.flatMap((component) =>
    component.terminals
      .filter((terminal) => !connected.has(endpointKey(componentEndpoint(component.id, terminal.id))))
      .map((terminal) => ({ component, terminal }))
  );
}
