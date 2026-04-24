import {
  calculateBoardOccupancy,
  detectFreePlacementOutOfBounds,
  detectFreePlacementOverlap,
  detectOutOfBounds,
  detectOverlap
} from "./layoutEngine";
import {
  endpointKey,
  findTerminal,
  findUnconnectedTerminals,
  validateTerminalCompatibility
} from "./connectivityEngine";
import type { BoardComponent, ProjectData, ValidationIssue } from "./types";

export type ValidationPolicy = (project: ProjectData) => ValidationIssue[];

export const outOfBoundsPolicy: ValidationPolicy = ({ board, components }) =>
  detectOutOfBounds(board, components);

export const freePlacementBoundsPolicy: ValidationPolicy = ({ board, components }) =>
  detectFreePlacementOutOfBounds(board, components);

export const freePlacementOverlapPolicy: ValidationPolicy = ({ components }) =>
  detectFreePlacementOverlap(components);

export const overlapPolicy: ValidationPolicy = ({ components }) => detectOverlap(components);

export const terminalCompatibilityPolicy: ValidationPolicy = ({ board, components, wires }) =>
  wires.flatMap((wire) => validateTerminalCompatibility(board, components, wire));

export const peConnectionPolicy: ValidationPolicy = ({ board, components, wires }) =>
  wires.flatMap((wire) => {
    const from = findTerminal(board, components, wire.from);
    const to = findTerminal(board, components, wire.to);
    if (!from || !to) {
      return [];
    }

    const hasPe = from.terminal.pole === "PE" || to.terminal.pole === "PE";
    const bothEarth = from.normalizedRole === "earth" && to.normalizedRole === "earth";
    return hasPe && !bothEarth
      ? [
          {
            severity: "error" as const,
            code: "PE_CONNECTED_TO_NON_EARTH",
            message: "Zacisk PE jest połączony z zaciskiem innym niż ochronny.",
            relatedComponents: [
              from.ownerKind === "component" ? from.ownerId : "",
              to.ownerKind === "component" ? to.ownerId : ""
            ].filter(Boolean),
            relatedWires: [wire.id],
            suggestion: "Przenieś to połączenie na zacisk PE."
          }
        ]
      : [];
  });

export const neutralConnectionPolicy: ValidationPolicy = ({ board, components, wires }) =>
  wires.flatMap((wire) => {
    const from = findTerminal(board, components, wire.from);
    const to = findTerminal(board, components, wire.to);
    if (!from || !to) {
      return [];
    }

    const hasNeutral = from.terminal.pole === "N" || to.terminal.pole === "N";
    const bothNeutral = from.terminal.pole === "N" && to.terminal.pole === "N";
    return hasNeutral && !bothNeutral
      ? [
          {
            severity: "warning" as const,
            code: "N_CONNECTED_TO_NON_NEUTRAL",
            message: "Zacisk N jest połączony z zaciskiem innego bieguna.",
            relatedComponents: [
              from.ownerKind === "component" ? from.ownerId : "",
              to.ownerKind === "component" ? to.ownerId : ""
            ].filter(Boolean),
            relatedWires: [wire.id],
            suggestion: "Sprawdź, czy przewód neutralny trafia wyłącznie na zaciski N."
          }
        ]
      : [];
  });

function minimumCrossSectionForBreaker(current: number): number {
  if (current <= 10) {
    return 1.5;
  }
  if (current <= 20) {
    return 2.5;
  }
  if (current <= 25) {
    return 4;
  }
  return 6;
}

export const cableGaugePolicy: ValidationPolicy = ({ board, components, wires }) =>
  wires.flatMap((wire) => {
    const from = findTerminal(board, components, wire.from);
    const to = findTerminal(board, components, wire.to);
    if (!from || !to) {
      return [];
    }

    const relatedComponentIds = [from, to]
      .filter((endpoint) => endpoint.ownerKind === "component")
      .map((endpoint) => endpoint.ownerId);
    const protectiveDevice = relatedComponentIds
      .map((componentId) => components.find((candidate) => candidate.id === componentId))
      .find((component) => component?.type === "mcb" && component.electrical.ratedCurrentA);
    const current = protectiveDevice?.electrical.ratedCurrentA;
    if (!protectiveDevice || !current) {
      return [];
    }

    const minimumCrossSection = minimumCrossSectionForBreaker(current);
    return wire.cable.crossSectionMm2 < minimumCrossSection
      ? [
          {
            severity: "error" as const,
            code:
              protectiveDevice.electrical.curve === "B" && current === 16
                ? "CABLE_UNDERSIZED_B16"
                : "CABLE_UNDERSIZED",
            message: `Obwód ${protectiveDevice.electrical.curve ?? ""}${current} jest podłączony przewodem o przekroju mniejszym niż ${minimumCrossSection} mm².`,
            relatedComponents: relatedComponentIds,
            relatedWires: [wire.id],
            suggestion: `Zwiększ przekrój przewodu do co najmniej ${minimumCrossSection} mm² albo zmień zabezpieczenie.`
          }
        ]
      : [];
  });

function demandFactor(circuitCount: number): number {
  if (circuitCount >= 10) {
    return 0.5;
  }
  if (circuitCount >= 6) {
    return 0.6;
  }
  if (circuitCount >= 4) {
    return 0.7;
  }
  if (circuitCount >= 2) {
    return 0.8;
  }
  return 1;
}

function terminalDirection(component: BoardComponent | undefined, terminalId: string) {
  return component?.terminals.find((terminal) => terminal.id === terminalId)?.direction;
}

function downstreamComponentIds(componentId: string, project: ProjectData): Set<string> {
  const downstream = new Set<string>();
  const queue = [componentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    project.wires.forEach((wire) => {
      if (wire.from.kind !== "component_terminal" || wire.to.kind !== "component_terminal") {
        return;
      }
      const fromEndpoint = wire.from;
      const toEndpoint = wire.to;
      if (fromEndpoint.componentId !== currentId || downstream.has(toEndpoint.componentId)) {
        return;
      }

      const fromComponent = project.components.find((component) => component.id === fromEndpoint.componentId);
      const toComponent = project.components.find((component) => component.id === toEndpoint.componentId);
      const pointsDownstream =
        terminalDirection(fromComponent, fromEndpoint.terminalId) === "out" &&
        terminalDirection(toComponent, toEndpoint.terminalId) === "in";

      if (pointsDownstream) {
        downstream.add(toEndpoint.componentId);
        queue.push(toEndpoint.componentId);
      }
    });
  }

  downstream.delete(componentId);
  return downstream;
}

export const breakerGroupingPolicy: ValidationPolicy = (project) =>
  project.components.flatMap((component) => {
    if (!["main_switch", "rcd", "rcbo"].includes(component.type) || !component.electrical.ratedCurrentA) {
      return [];
    }

    const downstreamIds = downstreamComponentIds(component.id, project);
    const downstreamBreakers = [...downstreamIds]
      .map((componentId) => project.components.find((candidate) => candidate.id === componentId))
      .filter((candidate) => candidate?.type === "mcb" && candidate.electrical.ratedCurrentA);

    if (downstreamBreakers.length < 2) {
      return [];
    }

    const totalCurrent = downstreamBreakers.reduce(
      (sum, breaker) => sum + (breaker?.electrical.ratedCurrentA ?? 0),
      0
    );
    const factor = demandFactor(downstreamBreakers.length);
    const estimatedCurrent = totalCurrent * factor;

    return estimatedCurrent > component.electrical.ratedCurrentA
      ? [
          {
            severity: "warning" as const,
            code: "BREAKER_GROUP_OVERLOAD",
            message: `${component.name} może być przeciążony: obwody za nim mają szacowane obciążenie ${estimatedCurrent.toFixed(1)} A.`,
            relatedComponents: [
              component.id,
              ...downstreamBreakers.map((breaker) => breaker?.id ?? "").filter(Boolean)
            ],
            suggestion: `Suma zabezpieczeń to ${totalCurrent} A, współczynnik jednoczesności ${factor}, a aparat nadrzędny ma ${component.electrical.ratedCurrentA} A.`
          }
        ]
      : [];
  });

export const missingInputPolicy: ValidationPolicy = ({ components, wires }) => {
  const floating = findUnconnectedTerminals(components, wires);

  return floating
    .filter(
      ({ component, terminal }) =>
        component.electrical.requiresInput && !component.electrical.externalLoad && terminal.direction === "in"
    )
    .map(({ component, terminal }) => ({
      severity: "warning" as const,
      code: "MISSING_INPUT",
      message: `${component.name} ${terminal.label} nie ma połączenia wejściowego.`,
      relatedComponents: [component.id],
      suggestion: "Podłącz to wejście z nadrzędnego aparatu zabezpieczającego lub łącznika."
    }));
};

function connectedPolesForComponent(
  componentId: string,
  wires: ProjectData["wires"],
  components: ProjectData["components"]
) {
  const connectedTerminalIds = new Set<string>();
  wires.forEach((wire) => {
    if (wire.from.kind === "component_terminal" && wire.from.componentId === componentId) {
      connectedTerminalIds.add(wire.from.terminalId);
    }
    if (wire.to.kind === "component_terminal" && wire.to.componentId === componentId) {
      connectedTerminalIds.add(wire.to.terminalId);
    }
  });

  const component = components.find((candidate) => candidate.id === componentId);
  return new Set(
    component?.terminals
      .filter((terminal) => connectedTerminalIds.has(terminal.id))
      .map((terminal) => terminal.pole) ?? []
  );
}

export const requiredLoadPolesPolicy: ValidationPolicy = ({ components, wires }) =>
  components.flatMap((component) => {
    const requiredPoles = component.electrical.requiredPoles;
    if (!component.electrical.externalLoad || !requiredPoles?.length) {
      return [];
    }

    const connectedPoles = connectedPolesForComponent(component.id, wires, components);
    const hasOnlyPe = connectedPoles.size === 1 && connectedPoles.has("PE");
    if (hasOnlyPe || connectedPoles.size === 0) {
      return [];
    }

    const missingPoles = requiredPoles.filter((pole) => !connectedPoles.has(pole));
    return missingPoles.length > 0
      ? [
          {
            severity: "error" as const,
            code: "LOAD_PARTIAL_CONNECTION",
            message: `${component.name} ma niepełne podłączenie: brakuje ${missingPoles.join(", ")}.`,
            relatedComponents: [component.id],
            relatedWires: wires
              .filter((wire) =>
                [wire.from, wire.to].some(
                  (endpoint) => endpoint.kind === "component_terminal" && endpoint.componentId === component.id
                )
              )
              .map((wire) => wire.id),
            suggestion: "Podłącz wszystkie wymagane tory odbiornika albo zostaw podłączony wyłącznie PE."
          }
        ]
      : [];
  });

export const missingMainSwitchPolicy: ValidationPolicy = ({ components }) => {
  const hasMainSwitch = components.some((component) => component.electrical.isMainSwitch);
  return hasMainSwitch
    ? []
    : [
        {
          severity: "warning" as const,
          code: "MISSING_MAIN_SWITCH",
          message: "Rozdzielnica nie ma rozłącznika głównego.",
          suggestion: "Dodaj rozłącznik główny 4P przy zasilaniu wejściowym."
        }
      ];
};

export const boardSupplyConnectionPolicy: ValidationPolicy = ({ board, wires }) => {
  const connected = new Set<string>();
  wires.forEach((wire) => {
    connected.add(endpointKey(wire.from));
    connected.add(endpointKey(wire.to));
  });

  const anySupplyConnected = board.supplyTerminals.some((terminal) =>
    connected.has(endpointKey({ kind: "board_terminal", boardTerminalId: terminal.id }))
  );

  return anySupplyConnected
    ? []
    : [
        {
          severity: "warning" as const,
          code: "BOARD_SUPPLY_UNUSED",
          message: "Żaden zacisk zasilania rozdzielnicy nie jest podłączony.",
          suggestion: "Podłącz L1/L2/L3/N/PE do pierwszych aparatów lub listew."
        }
      ];
};

export const missingBusbarAdvisoryPolicy: ValidationPolicy = ({ components }) => {
  const needsNeutral = components.some((component) =>
    component.terminals.some((terminal) => terminal.pole === "N")
  );
  const hasNeutralBus = components.some((component) => component.type === "neutral_bus");
  const hasPeBus = components.some((component) => component.type === "pe_bus");

  const issues: ValidationIssue[] = [];
  if (needsNeutral && !hasNeutralBus) {
    issues.push({
      severity: "warning",
      code: "MISSING_N_BUSBAR",
      message: "Projekt używa zacisków N, ale nie ma listwy neutralnej.",
      suggestion: "Dodaj listwę N w wolnej strefie rozdzielnicy."
    });
  }

  if (!hasPeBus) {
    issues.push({
      severity: "warning",
      code: "MISSING_PE_BUSBAR",
      message: "Projekt nie ma listwy PE.",
      suggestion: "Dodaj listwę PE w wolnej strefie rozdzielnicy."
    });
  }

  return issues;
};

export const highOccupancyPolicy: ValidationPolicy = ({ board, components }) => {
  const occupancy = calculateBoardOccupancy(board, components);
  return occupancy > 0.85
    ? [
        {
          severity: "warning" as const,
          code: "HIGH_BOARD_OCCUPANCY",
          message: `Zajętość rozdzielnicy wynosi ${Math.round(occupancy * 100)}%.`,
          suggestion: "Zostaw wolne moduły na przyszłe obwody i łatwiejsze prowadzenie przewodów."
        }
      ]
    : [];
};

export const validationPolicies: ValidationPolicy[] = [
  outOfBoundsPolicy,
  freePlacementBoundsPolicy,
  freePlacementOverlapPolicy,
  overlapPolicy,
  terminalCompatibilityPolicy,
  peConnectionPolicy,
  neutralConnectionPolicy,
  cableGaugePolicy,
  breakerGroupingPolicy,
  missingInputPolicy,
  requiredLoadPolesPolicy,
  missingMainSwitchPolicy,
  boardSupplyConnectionPolicy,
  missingBusbarAdvisoryPolicy,
  highOccupancyPolicy
];
