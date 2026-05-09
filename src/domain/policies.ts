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
import type { BoardComponent, Pole, ProjectData, ValidationIssue, WireConnection, WireEndpoint } from "./types";

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
            message: "Zacisk PE jest polaczony z zaciskiem innym niz ochronny.",
            relatedComponents: [
              from.ownerKind === "component" ? from.ownerId : "",
              to.ownerKind === "component" ? to.ownerId : ""
            ].filter(Boolean),
            relatedWires: [wire.id],
            suggestion: "Przenies to polaczenie na zacisk PE."
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
            message: "Zacisk N jest polaczony z zaciskiem innego bieguna.",
            relatedComponents: [
              from.ownerKind === "component" ? from.ownerId : "",
              to.ownerKind === "component" ? to.ownerId : ""
            ].filter(Boolean),
            relatedWires: [wire.id],
            suggestion: "Sprawdz, czy przewod neutralny trafia wylacznie na zaciski N."
          }
        ]
      : [];
  });

type EndpointMeta = {
  endpoint: WireEndpoint;
  component?: BoardComponent;
  pole: Pole;
  role: string;
  direction: string;
};

function addGraphEdge(graph: Map<string, Set<string>>, a: string, b: string) {
  graph.set(a, graph.get(a) ?? new Set());
  graph.set(b, graph.get(b) ?? new Set());
  graph.get(a)?.add(b);
  graph.get(b)?.add(a);
}

function terminalEndpoint(componentId: string, terminalId: string): WireEndpoint {
  return { kind: "component_terminal", componentId, terminalId };
}

function endpointMeta(project: ProjectData): Map<string, EndpointMeta> {
  const meta = new Map<string, EndpointMeta>();

  project.board.supplyTerminals.forEach((terminal) => {
    const endpoint: WireEndpoint = { kind: "board_terminal", boardTerminalId: terminal.id };
    meta.set(endpointKey(endpoint), {
      endpoint,
      pole: terminal.pole,
      role: terminal.role,
      direction: terminal.direction
    });
  });

  project.components.forEach((component) => {
    component.terminals.forEach((terminal) => {
      const endpoint = terminalEndpoint(component.id, terminal.id);
      meta.set(endpointKey(endpoint), {
        endpoint,
        component,
        pole: terminal.pole,
        role: terminal.role,
        direction: terminal.direction
      });
    });
  });

  return meta;
}

function buildElectricalGraph(
  project: ProjectData,
  options: { omitRcdInternals?: boolean; omitBreakerInternals?: boolean } = {}
) {
  const graph = new Map<string, Set<string>>();

  project.wires.forEach((wire) => {
    addGraphEdge(graph, endpointKey(wire.from), endpointKey(wire.to));
  });

  project.components.forEach((component) => {
    component.terminals.forEach((terminal) => {
      graph.set(endpointKey(terminalEndpoint(component.id, terminal.id)), graph.get(endpointKey(terminalEndpoint(component.id, terminal.id))) ?? new Set());
    });

    if (component.type === "neutral_bus" || component.type === "pe_bus") {
      component.terminals.forEach((left, index) => {
        component.terminals.slice(index + 1).forEach((right) => {
          if (left.pole === right.pole) {
            addGraphEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, left.id)),
              endpointKey(terminalEndpoint(component.id, right.id))
            );
          }
        });
      });
      return;
    }

    if (options.omitRcdInternals && (component.type === "rcd" || component.type === "rcbo")) {
      return;
    }

    if (options.omitBreakerInternals && (component.type === "mcb" || component.type === "rcbo")) {
      return;
    }

    component.terminals
      .filter((terminal) => terminal.direction === "in")
      .forEach((input) => {
        component.terminals
          .filter((terminal) => terminal.direction === "out" && terminal.pole === input.pole)
          .forEach((output) => {
            addGraphEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, input.id)),
              endpointKey(terminalEndpoint(component.id, output.id))
            );
          });
      });

    component.terminals
      .filter((terminal) => terminal.direction === "bidirectional")
      .forEach((left, index, terminals) => {
        terminals.slice(index + 1).forEach((right) => {
          if (left.pole === right.pole) {
            addGraphEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, left.id)),
              endpointKey(terminalEndpoint(component.id, right.id))
            );
          }
        });
      });
  });

  project.board.supplyTerminals.forEach((terminal) => {
    const key = endpointKey({ kind: "board_terminal", boardTerminalId: terminal.id });
    graph.set(key, graph.get(key) ?? new Set());
  });

  return graph;
}

function reachableKeys(
  startKey: string,
  graph: Map<string, Set<string>>,
  meta: Map<string, EndpointMeta>,
  allowedPoles: Set<Pole>
) {
  const visited = new Set<string>();
  const queue = [startKey];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    const currentMeta = meta.get(current);
    if (!currentMeta || !allowedPoles.has(currentMeta.pole)) {
      continue;
    }

    visited.add(current);
    graph.get(current)?.forEach((next) => {
      if (!visited.has(next)) {
        queue.push(next);
      }
    });
  }

  return visited;
}

function componentTerminalKeys(component: BoardComponent, role: string, pole?: Pole) {
  return component.terminals
    .filter((terminal) => terminal.role === role && (!pole || terminal.pole === pole))
    .map((terminal) => endpointKey(terminalEndpoint(component.id, terminal.id)));
}

function connectedRcdOutputs(
  startKey: string,
  project: ProjectData,
  graphWithoutRcdInternals: Map<string, Set<string>>,
  meta: Map<string, EndpointMeta>,
  poleGroup: "live" | "neutral"
) {
  const allowedPoles =
    poleGroup === "neutral"
      ? new Set<Pole>(["N"])
      : new Set<Pole>(["L1", "L2", "L3"]);
  const reachable = reachableKeys(startKey, graphWithoutRcdInternals, meta, allowedPoles);

  return new Set(
    project.components
      .filter((component) => component.type === "rcd" || component.type === "rcbo")
      .filter((component) => {
        const outputKeys =
          poleGroup === "neutral"
            ? componentTerminalKeys(component, "neutral_out", "N")
            : component.terminals
                .filter((terminal) => terminal.role === "power_out" && terminal.pole.startsWith("L"))
                .map((terminal) => endpointKey(terminalEndpoint(component.id, terminal.id)));

        return outputKeys.some((key) => reachable.has(key));
      })
      .map((component) => component.id)
  );
}

function connectedBreakerOutputs(
  startKey: string,
  project: ProjectData,
  graphWithoutBreakerInternals: Map<string, Set<string>>,
  meta: Map<string, EndpointMeta>
) {
  const reachable = reachableKeys(startKey, graphWithoutBreakerInternals, meta, new Set<Pole>(["L1", "L2", "L3"]));

  return new Set(
    project.components
      .filter((component) => component.type === "mcb" || component.type === "rcbo")
      .filter((component) =>
        component.terminals
          .filter((terminal) => terminal.role === "power_out" && terminal.pole.startsWith("L"))
          .map((terminal) => endpointKey(terminalEndpoint(component.id, terminal.id)))
          .some((key) => reachable.has(key))
      )
      .map((component) => component.id)
  );
}

function hasReachableRole(
  startKey: string,
  graph: Map<string, Set<string>>,
  meta: Map<string, EndpointMeta>,
  role: string
) {
  const reachable = reachableKeys(startKey, graph, meta, new Set<Pole>(["N"]));
  return [...reachable].some((key) => {
    const item = meta.get(key);
    return item?.role === role || (role === "neutral_source" && item?.endpoint.kind === "board_terminal");
  });
}

export const neutralRcdCircuitPolicy: ValidationPolicy = (project) => {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const meta = endpointMeta(project);
  const graphWithoutRcdInternals = buildElectricalGraph(project, { omitRcdInternals: true });

  function addNeutralIssue(issue: ValidationIssue) {
    const key = [
      issue.code,
      issue.relatedComponents?.join(",") ?? "",
      issue.relatedWires?.join(",") ?? ""
    ].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  }

  project.components
    .filter((component) => component.type === "neutral_bus")
    .forEach((bus) => {
      const rcdIds = new Set<string>();
      bus.terminals.forEach((terminal) => {
        const key = endpointKey(terminalEndpoint(bus.id, terminal.id));
        connectedRcdOutputs(key, project, graphWithoutRcdInternals, meta, "neutral").forEach((id) => rcdIds.add(id));
      });

      if (rcdIds.size > 1) {
        issues.push({
          severity: "error",
          code: "N_BUS_SHARED_BY_RCDS",
          message: "Dwa różne RCD korzystają z tej samej listwy N. Każdy RCD powinien mieć oddzielną listwę N.",
          relatedComponents: [bus.id, ...rcdIds],
          suggestion: "Rozdziel listwy N tak, aby wyjście N każdego RCD trafiało na osobną listwę."
        });
      }
    });

  project.components
    .filter((component) => component.electrical.externalLoad)
    .forEach((loadComponent) => {
      const liveTerminals = loadComponent.terminals.filter((terminal) => terminal.pole.startsWith("L"));
      const neutralTerminal = loadComponent.terminals.find((terminal) => terminal.pole === "N");

      liveTerminals.forEach((liveTerminal) => {
        const liveKey = endpointKey(terminalEndpoint(loadComponent.id, liveTerminal.id));
        const liveReachable = reachableKeys(
          liveKey,
          graphWithoutRcdInternals,
          meta,
          new Set<Pole>(["L1", "L2", "L3"])
        );
        if (liveReachable.size <= 1) {
          return;
        }

        const liveRcds = connectedRcdOutputs(liveKey, project, graphWithoutRcdInternals, meta, "live");
        if (!neutralTerminal) {
          return;
        }

        const neutralKey = endpointKey(terminalEndpoint(loadComponent.id, neutralTerminal.id));
        const neutralReachable = reachableKeys(neutralKey, graphWithoutRcdInternals, meta, new Set<Pole>(["N"]));
        if (neutralReachable.size <= 1) {
          issues.push({
            severity: "warning",
            code: "LOAD_NEUTRAL_MISSING",
            message: "Odbiornik ma podłączoną fazę, ale nie ma poprawnie przypisanego przewodu N.",
            relatedComponents: [loadComponent.id],
            suggestion: "Podłącz N odbiornika do listwy N właściwej dla tego samego obwodu."
          });
          return;
        }

        const neutralRcds = connectedRcdOutputs(neutralKey, project, graphWithoutRcdInternals, meta, "neutral");
        if (liveRcds.size === 0) {
          if (neutralRcds.size > 0) {
            issues.push({
              severity: "warning",
              code: "LOAD_NEUTRAL_CIRCUIT_MISMATCH",
              message: "Przewód N odbiornika nie jest przypisany do tego samego obwodu co przewód fazowy.",
              relatedComponents: [loadComponent.id, ...neutralRcds],
              suggestion: "Sprawdź, czy L i N odbiornika są prowadzone przez ten sam tor ochrony."
            });
          }
          return;
        }

        const matchingRcds = [...liveRcds].filter((id) => neutralRcds.has(id));
        if (matchingRcds.length > 0) {
          return;
        }

        const neutralBeforeRcd =
          neutralRcds.size === 0 &&
          (hasReachableRole(neutralKey, graphWithoutRcdInternals, meta, "neutral_source") ||
            hasReachableRole(neutralKey, graphWithoutRcdInternals, meta, "neutral_in"));

        issues.push({
          severity: "error",
          code: neutralBeforeRcd ? "N_CONNECTED_BEFORE_RCD" : "N_RCD_MISMATCH",
          message: neutralBeforeRcd
            ? "Neutralny N jest podłączony przed RCD, mimo że faza obwodu jest za RCD."
            : "Obwód ma fazę za RCD, ale przewód N nie przechodzi przez ten sam RCD.",
          relatedComponents: [loadComponent.id, ...liveRcds, ...neutralRcds],
          suggestion: "Poprowadź N przez ten sam RCD/RCBO albo listwę N przypisaną do tego RCD."
        });
      });
    });

  project.components
    .filter((component) => component.type === "neutral_bus")
    .forEach((bus) => {
      const busReachable = new Set<string>();
      const rcdIds = new Set<string>();
      bus.terminals.forEach((terminal) => {
        const key = endpointKey(terminalEndpoint(bus.id, terminal.id));
        reachableKeys(key, graphWithoutRcdInternals, meta, new Set<Pole>(["N"])).forEach((reachableKey) =>
          busReachable.add(reachableKey)
        );
        connectedRcdOutputs(key, project, graphWithoutRcdInternals, meta, "neutral").forEach((id) => rcdIds.add(id));
      });

      const hasDirectSupplyNeutral = hasReachableBoardRole(busReachable, meta, "neutral_source");
      if (hasDirectSupplyNeutral && rcdIds.size > 0) {
        addNeutralIssue({
          severity: "error",
          code: "N_BUS_MIXES_RCD_AND_SUPPLY",
          message: "Szyna N jest podłączona jednocześnie do zasilania i do wyjścia N RCD.",
          relatedComponents: [bus.id, ...rcdIds],
          suggestion: "Rozdziel N przed RCD od listwy N zasilanej z wyjścia tego RCD."
        });
      }

      if (!hasDirectSupplyNeutral) {
        return;
      }

      const affectedComponents = new Set<string>();
      const affectedRcds = new Set<string>();
      project.components
        .filter((component) => component.electrical.externalLoad)
        .forEach((loadComponent) => {
          const neutralTerminal = loadComponent.terminals.find((terminal) => terminal.pole === "N");
          const liveTerminal = loadComponent.terminals.find((terminal) => terminal.pole.startsWith("L"));
          if (!neutralTerminal || !liveTerminal) {
            return;
          }

          const neutralKey = endpointKey(terminalEndpoint(loadComponent.id, neutralTerminal.id));
          if (!busReachable.has(neutralKey)) {
            return;
          }

          const liveKey = endpointKey(terminalEndpoint(loadComponent.id, liveTerminal.id));
          const liveRcds = connectedRcdOutputs(liveKey, project, graphWithoutRcdInternals, meta, "live");
          if (liveRcds.size === 0) {
            return;
          }

          affectedComponents.add(loadComponent.id);
          liveRcds.forEach((id) => affectedRcds.add(id));
        });

      if (affectedComponents.size > 0) {
        addNeutralIssue({
          severity: "error",
          code: "N_BUS_BYPASSES_RCD",
          message: "Szyna N jest podłączona bezpośrednio do zasilania, mimo że obwody korzystają z RCD.",
          relatedComponents: [bus.id, ...affectedComponents, ...affectedRcds],
          suggestion: "Zasil listwę N z wyjścia N tego samego RCD, przez który przechodzi tor L obwodu."
        });
      }
    });

  return issues;
};

function connectedEndpointKeys(wires: ProjectData["wires"]) {
  const connected = new Set<string>();
  wires.forEach((wire) => {
    connected.add(endpointKey(wire.from));
    connected.add(endpointKey(wire.to));
  });
  return connected;
}

function hasReachableBoardRole(
  reachable: Set<string>,
  meta: Map<string, EndpointMeta>,
  role: "power_source" | "neutral_source" | "earth_source"
) {
  return [...reachable].some((key) => {
    const item = meta.get(key);
    return item?.endpoint.kind === "board_terminal" && item.role === role;
  });
}

function terminalKey(component: BoardComponent, terminalId: string) {
  return endpointKey(terminalEndpoint(component.id, terminalId));
}

function relatedLoadWireIds(componentId: string, wires: ProjectData["wires"]) {
  return wires
    .filter((wire) =>
      [wire.from, wire.to].some(
        (endpoint) => endpoint.kind === "component_terminal" && endpoint.componentId === componentId
      )
    )
    .map((wire) => wire.id);
}

type LiveSupplyPath = {
  keys: string[];
  breakerIds: Set<string>;
  rcdIds: Set<string>;
};

function isLiveSource(metaItem: EndpointMeta | undefined) {
  return metaItem?.endpoint.kind === "board_terminal" && metaItem.role === "power_source";
}

function analyzeLiveSupplyPath(keys: string[], meta: Map<string, EndpointMeta>): LiveSupplyPath {
  const breakerIds = new Set<string>();
  const rcdIds = new Set<string>();

  keys.forEach((key) => {
    const item = meta.get(key);
    const component = item?.component;
    if (!item || !component || item.role !== "power_out") {
      return;
    }

    if (component.type === "mcb" || component.type === "rcbo") {
      breakerIds.add(component.id);
    }
    if (component.type === "rcd" || component.type === "rcbo") {
      rcdIds.add(component.id);
    }
  });

  return { keys, breakerIds, rcdIds };
}

function findLiveSupplyPaths(
  startKey: string,
  graph: Map<string, Set<string>>,
  meta: Map<string, EndpointMeta>
): LiveSupplyPath[] {
  const paths: LiveSupplyPath[] = [];
  const stack: Array<{ key: string; path: string[]; visited: Set<string> }> = [
    { key: startKey, path: [startKey], visited: new Set([startKey]) }
  ];
  const maxPaths = 64;
  const maxDepth = 80;

  while (stack.length > 0 && paths.length < maxPaths) {
    const current = stack.pop();
    if (!current || current.path.length > maxDepth) {
      continue;
    }

    const currentMeta = meta.get(current.key);
    if (!currentMeta || !currentMeta.pole.startsWith("L")) {
      continue;
    }

    if (isLiveSource(currentMeta)) {
      paths.push(analyzeLiveSupplyPath(current.path, meta));
      continue;
    }

    graph.get(current.key)?.forEach((next) => {
      const nextMeta = meta.get(next);
      if (!nextMeta || !nextMeta.pole.startsWith("L") || current.visited.has(next)) {
        return;
      }

      stack.push({
        key: next,
        path: [...current.path, next],
        visited: new Set([...current.visited, next])
      });
    });
  }

  return paths;
}

function unionPathIds(paths: LiveSupplyPath[], field: "breakerIds" | "rcdIds") {
  const ids = new Set<string>();
  paths.forEach((path) => path[field].forEach((id) => ids.add(id)));
  return ids;
}

function distinctLivePathFirstHops(paths: LiveSupplyPath[]) {
  return new Set(paths.map((path) => path.keys[1]).filter(Boolean));
}

export const circuitCompletenessPolicy: ValidationPolicy = (project) => {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const meta = endpointMeta(project);
  const fullGraph = buildElectricalGraph(project);
  const graphWithoutRcdInternals = buildElectricalGraph(project, { omitRcdInternals: true });
  const connected = connectedEndpointKeys(project.wires);

  function addIssue(issue: ValidationIssue) {
    const key = [
      issue.code,
      issue.relatedComponents?.join(",") ?? "",
      issue.relatedWires?.join(",") ?? ""
    ].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  }

  project.components
    .filter((component) => component.electrical.externalLoad)
    .forEach((loadComponent) => {
      const requiredPoles = loadComponent.electrical.requiredPoles ?? [];
      const liveTerminals = loadComponent.terminals.filter((terminal) => terminal.pole.startsWith("L"));
      const neutralTerminal = loadComponent.terminals.find((terminal) => terminal.pole === "N");
      const peTerminal = loadComponent.terminals.find((terminal) => terminal.pole === "PE");
      const loadWireIds = relatedLoadWireIds(loadComponent.id, project.wires);
      const connectedLoadTerminals = loadComponent.terminals.filter((terminal) =>
        connected.has(terminalKey(loadComponent, terminal.id))
      );
      const hasNonPeConnection = connectedLoadTerminals.some((terminal) => terminal.pole !== "PE");

      if (!hasNonPeConnection) {
        return;
      }

      const liveTerminal = liveTerminals[0];
      const liveKey = liveTerminal ? terminalKey(loadComponent, liveTerminal.id) : "";
      const liveReachable = liveKey
        ? reachableKeys(liveKey, fullGraph, meta, new Set<Pole>(["L1", "L2", "L3"]))
        : new Set<string>();
      const livePaths = liveKey ? findLiveSupplyPaths(liveKey, fullGraph, meta) : [];
      const liveHasSource = livePaths.length > 0 || hasReachableBoardRole(liveReachable, meta, "power_source");
      const liveBreakers = unionPathIds(livePaths, "breakerIds");
      const liveRcds = unionPathIds(livePaths, "rcdIds");
      const hasLivePathWithoutBreaker = livePaths.some((path) => path.breakerIds.size === 0);
      const hasLivePathWithoutRcd = livePaths.some((path) => path.rcdIds.size === 0);
      const livePathFirstHops = distinctLivePathFirstHops(livePaths);

      if (!liveTerminal || !connected.has(liveKey) || !liveHasSource) {
        addIssue({
          severity: "error",
          code: "CIRCUIT_L_CONTINUITY",
          message: "Odbiornik ma niepoprawny tor L - brak ciaglosci z zasilaniem.",
          relatedComponents: [loadComponent.id],
          relatedWires: loadWireIds,
          suggestion: "Polacz tor L odbiornika z zasilaniem przez wlasciwe moduly zabezpieczajace."
        });
      }

      if (liveTerminal && connected.has(liveKey) && (liveBreakers.size === 0 || hasLivePathWithoutBreaker)) {
        addIssue({
          severity: "error",
          code: "CIRCUIT_MISSING_BREAKER",
          message: "Odbiornik jest podlaczony do L bez zabezpieczenia nadpradowego MCB/RCBO.",
          relatedComponents: [loadComponent.id],
          relatedWires: loadWireIds,
          suggestion: "Poprowadz tor L przez MCB albo RCBO."
        });
      }

      if (liveTerminal && connected.has(liveKey) && (liveRcds.size === 0 || hasLivePathWithoutRcd)) {
        addIssue({
          severity: "error",
          code: "CIRCUIT_MISSING_RCD",
          message: "Obwod odbiornika nie przechodzi przez RCD/RCBO.",
          relatedComponents: [loadComponent.id, ...liveBreakers],
          relatedWires: loadWireIds,
          suggestion: "Poprowadz obwod koncowy przez RCD albo RCBO."
        });
      }

      if (liveTerminal && connected.has(liveKey) && (livePathFirstHops.size > 1 || liveBreakers.size > 1 || liveRcds.size > 1)) {
        addIssue({
          severity: "error",
          code: "CIRCUIT_L_MULTIPLE_PATHS",
          message: `Odbiornik "${loadComponent.name}" ma niepoprawne dodatkowe zasilanie L: jedna ze sciezek omija MCB/RCD albo pochodzi z innego zabezpieczenia.`,
          relatedComponents: [loadComponent.id, ...liveBreakers, ...liveRcds],
          relatedWires: loadWireIds,
          suggestion: "Zostaw jedna sciezke L do odbiornika, prowadzona przez ten sam MCB/RCBO i RCD/RCBO."
        });
      }

      if (requiredPoles.includes("N") || neutralTerminal) {
        const neutralKey = neutralTerminal ? terminalKey(loadComponent, neutralTerminal.id) : "";
        const neutralReachable = neutralKey
          ? reachableKeys(neutralKey, fullGraph, meta, new Set<Pole>(["N"]))
          : new Set<string>();
        const neutralHasSource = hasReachableBoardRole(neutralReachable, meta, "neutral_source");
        const neutralRcds = neutralKey
          ? connectedRcdOutputs(neutralKey, project, graphWithoutRcdInternals, meta, "neutral")
          : new Set<string>();

        if (!neutralTerminal || !connected.has(neutralKey) || !neutralHasSource) {
          addIssue({
            severity: "error",
            code: "CIRCUIT_N_CONTINUITY",
            message: "Odbiornik ma niepoprawny tor N - brak ciaglosci neutralnego z zasilaniem.",
            relatedComponents: [loadComponent.id],
            relatedWires: loadWireIds,
            suggestion: "Polacz N odbiornika z listwa N i zasilaniem przez wlasciwy tor neutralny."
          });
        }

        const matchingRcds = [...liveRcds].filter((id) => neutralRcds.has(id));
        if (liveRcds.size > 0 && matchingRcds.length === 0) {
          addIssue({
            severity: "error",
            code: "CIRCUIT_RCD_MISMATCH",
            message: "Tor L i N odbiornika nie przechodza przez ten sam RCD.",
            relatedComponents: [loadComponent.id, ...liveRcds, ...neutralRcds],
            relatedWires: loadWireIds,
            suggestion: "Poprowadz L i N odbiornika przez ten sam RCD/RCBO albo przypisana do niego listwe N."
          });
        }
      }

      if (requiredPoles.includes("PE")) {
        const peKey = peTerminal ? terminalKey(loadComponent, peTerminal.id) : "";
        const peReachable = peKey ? reachableKeys(peKey, fullGraph, meta, new Set<Pole>(["PE"])) : new Set<string>();
        const peHasSource = hasReachableBoardRole(peReachable, meta, "earth_source");

        if (!peTerminal || !connected.has(peKey) || !peHasSource) {
          addIssue({
            severity: "error",
            code: "CIRCUIT_PE_CONTINUITY",
            message: "Odbiornik wymaga PE, ale przewod ochronny nie ma ciaglosci z szyna PE / wejsciem PE.",
            relatedComponents: [loadComponent.id],
            relatedWires: loadWireIds,
            suggestion: "Polacz PE odbiornika z listwa PE i zaciskiem PE zasilania."
          });
        }
      }
    });

  return issues;
};

function minimumCrossSectionForBreaker(current: number): number {
  if (current <= 10) {
    return 1.5;
  }
  if (current <= 16) {
    return 2.5;
  }
  if (current <= 20) {
    return 4;
  }
  return 6;
}

type CableGaugeEdge = {
  to: string;
  wire?: WireConnection;
};

function breakerLabel(component: BoardComponent): string {
  const current = component.electrical.ratedCurrentA;
  return `${component.electrical.curve ?? ""}${current ?? ""}`.trim();
}

function addCableGaugeEdge(graph: Map<string, CableGaugeEdge[]>, a: string, b: string, wire?: WireConnection) {
  graph.set(a, graph.get(a) ?? []);
  graph.set(b, graph.get(b) ?? []);
  graph.get(a)?.push({ to: b, wire });
  graph.get(b)?.push({ to: a, wire });
}

function isProtectiveBreaker(component: BoardComponent): boolean {
  return (component.type === "mcb" || component.type === "rcbo") && Boolean(component.electrical.ratedCurrentA);
}

function loadCurrentA(component: BoardComponent): number {
  return component.electrical.currentA ?? 0;
}

function maximumCurrentForCrossSection(crossSectionMm2: number): number {
  if (crossSectionMm2 >= 6) {
    return 32;
  }
  if (crossSectionMm2 >= 4) {
    return 25;
  }
  if (crossSectionMm2 >= 2.5) {
    return 16;
  }
  if (crossSectionMm2 >= 1.5) {
    return 10;
  }
  return 0;
}

function buildCableGaugeGraph(project: ProjectData, protectiveDeviceId: string) {
  const graph = new Map<string, CableGaugeEdge[]>();

  project.wires.forEach((wire) => {
    addCableGaugeEdge(graph, endpointKey(wire.from), endpointKey(wire.to), wire);
  });

  project.components.forEach((component) => {
    component.terminals.forEach((terminal) => {
      const key = endpointKey(terminalEndpoint(component.id, terminal.id));
      graph.set(key, graph.get(key) ?? []);
    });

    if (component.electrical.externalLoad) {
      return;
    }

    if (isProtectiveBreaker(component)) {
      return;
    }

    if (component.type === "neutral_bus" || component.type === "pe_bus") {
      component.terminals.forEach((left, index) => {
        component.terminals.slice(index + 1).forEach((right) => {
          if (left.pole === right.pole) {
            addCableGaugeEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, left.id)),
              endpointKey(terminalEndpoint(component.id, right.id))
            );
          }
        });
      });
      return;
    }

    component.terminals.forEach((left, index) => {
      component.terminals.slice(index + 1).forEach((right) => {
        if (left.pole === right.pole) {
          addCableGaugeEdge(
            graph,
            endpointKey(terminalEndpoint(component.id, left.id)),
            endpointKey(terminalEndpoint(component.id, right.id))
          );
        }
      });
    });
  });

  return graph;
}

function buildFullSupplyCableGraph(project: ProjectData) {
  const graph = new Map<string, CableGaugeEdge[]>();

  project.wires.forEach((wire) => {
    addCableGaugeEdge(graph, endpointKey(wire.from), endpointKey(wire.to), wire);
  });

  project.components.forEach((component) => {
    component.terminals.forEach((terminal) => {
      const key = endpointKey(terminalEndpoint(component.id, terminal.id));
      graph.set(key, graph.get(key) ?? []);
    });

    if (component.electrical.externalLoad) {
      return;
    }

    if (component.type === "neutral_bus" || component.type === "pe_bus") {
      component.terminals.forEach((left, index) => {
        component.terminals.slice(index + 1).forEach((right) => {
          if (left.pole === right.pole) {
            addCableGaugeEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, left.id)),
              endpointKey(terminalEndpoint(component.id, right.id))
            );
          }
        });
      });
      return;
    }

    component.terminals
      .filter((terminal) => terminal.direction === "in")
      .forEach((input) => {
        component.terminals
          .filter((terminal) => terminal.direction === "out" && terminal.pole === input.pole)
          .forEach((output) => {
            addCableGaugeEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, input.id)),
              endpointKey(terminalEndpoint(component.id, output.id))
            );
          });
      });

    component.terminals
      .filter((terminal) => terminal.direction === "bidirectional")
      .forEach((left, index, terminals) => {
        terminals.slice(index + 1).forEach((right) => {
          if (left.pole === right.pole) {
            addCableGaugeEdge(
              graph,
              endpointKey(terminalEndpoint(component.id, left.id)),
              endpointKey(terminalEndpoint(component.id, right.id))
            );
          }
        });
      });
  });

  project.board.supplyTerminals.forEach((terminal) => {
    const key = endpointKey({ kind: "board_terminal", boardTerminalId: terminal.id });
    graph.set(key, graph.get(key) ?? []);
  });

  return graph;
}

function reachableExternalLoads(
  starts: string[],
  graph: Map<string, CableGaugeEdge[]>,
  meta: Map<string, EndpointMeta>,
  blockedKey?: string
) {
  const queue = [...starts];
  const visited = new Set<string>();
  const loads = new Map<string, BoardComponent>();

  while (queue.length > 0) {
    const key = queue.shift();
    if (!key || key === blockedKey || visited.has(key)) {
      continue;
    }

    visited.add(key);
    const component = meta.get(key)?.component;
    if (component?.electrical.externalLoad) {
      loads.set(component.id, component);
    }

    graph.get(key)?.forEach((edge) => {
      if (!visited.has(edge.to) && edge.to !== blockedKey) {
        queue.push(edge.to);
      }
    });
  }

  return loads;
}

function loadSum(loads: Iterable<BoardComponent>): number {
  return [...loads].reduce((sum, load) => sum + loadCurrentA(load), 0);
}

type FullSupplyPath = {
  keys: string[];
  wires: WireConnection[];
};

type FullRouteCableRequirement = {
  wire: WireConnection;
  minimumCrossSection: number;
  breakerLabel?: string;
  breakerId?: string;
  relatedComponents: Set<string>;
};

function isLiveEndpoint(key: string, meta: Map<string, EndpointMeta>) {
  return meta.get(key)?.pole.startsWith("L") ?? false;
}

function isLiveSupplyEndpoint(key: string, meta: Map<string, EndpointMeta>) {
  const endpoint = meta.get(key);
  return endpoint?.endpoint.kind === "board_terminal" && endpoint.role === "power_source" && endpoint.pole.startsWith("L");
}

function findFullLiveSupplyPaths(
  startKey: string,
  graph: Map<string, CableGaugeEdge[]>,
  meta: Map<string, EndpointMeta>,
  maxDepth = 80,
  maxPaths = 128
): FullSupplyPath[] {
  const paths: FullSupplyPath[] = [];
  const stack: Array<{ key: string; keys: string[]; wires: WireConnection[]; visited: Set<string> }> = [
    { key: startKey, keys: [startKey], wires: [], visited: new Set([startKey]) }
  ];

  while (stack.length > 0 && paths.length < maxPaths) {
    const current = stack.pop();
    if (!current || current.keys.length > maxDepth) {
      continue;
    }

    if (current.key !== startKey && isLiveSupplyEndpoint(current.key, meta)) {
      paths.push({ keys: current.keys, wires: current.wires });
      continue;
    }

    graph.get(current.key)?.forEach((edge) => {
      if (current.visited.has(edge.to) || !isLiveEndpoint(edge.to, meta)) {
        return;
      }

      stack.push({
        key: edge.to,
        keys: [...current.keys, edge.to],
        wires: edge.wire ? [...current.wires, edge.wire] : current.wires,
        visited: new Set([...current.visited, edge.to])
      });
    });
  }

  return paths;
}

function strongestBreakerOnPath(path: FullSupplyPath, meta: Map<string, EndpointMeta>) {
  const breakers = new Map<string, BoardComponent>();
  path.keys.forEach((key) => {
    const component = meta.get(key)?.component;
    if (component && isProtectiveBreaker(component)) {
      breakers.set(component.id, component);
    }
  });

  return [...breakers.values()].reduce<BoardComponent | undefined>((strongest, breaker) => {
    if (!strongest) {
      return breaker;
    }
    return (breaker.electrical.ratedCurrentA ?? 0) > (strongest.electrical.ratedCurrentA ?? 0) ? breaker : strongest;
  }, undefined);
}

function relatedComponentsForWire(project: ProjectData, wire: WireConnection) {
  return [findTerminal(project.board, project.components, wire.from), findTerminal(project.board, project.components, wire.to)]
    .filter((endpoint) => endpoint?.ownerKind === "component")
    .map((endpoint) => endpoint?.ownerId ?? "")
    .filter(Boolean);
}

function rememberFullRouteRequirement(
  requirements: Map<string, FullRouteCableRequirement>,
  wire: WireConnection,
  minimumCrossSection: number,
  relatedComponents: string[],
  breaker?: BoardComponent
) {
  const existing = requirements.get(wire.id);
  const breakerId = breaker?.id;
  const label = breaker ? breakerLabel(breaker) : undefined;

  if (!existing || minimumCrossSection > existing.minimumCrossSection) {
    requirements.set(wire.id, {
      wire,
      minimumCrossSection,
      breakerLabel: label,
      breakerId,
      relatedComponents: new Set([...(breakerId ? [breakerId] : []), ...relatedComponents])
    });
    return;
  }

  if (minimumCrossSection === existing.minimumCrossSection) {
    if (!existing.breakerLabel && label) {
      existing.breakerLabel = label;
    }
    if (!existing.breakerId && breakerId) {
      existing.breakerId = breakerId;
    }
    relatedComponents.forEach((componentId) => existing.relatedComponents.add(componentId));
    if (breakerId) {
      existing.relatedComponents.add(breakerId);
    }
  }
}

export const cableGaugePolicy: ValidationPolicy = (project) => {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const meta = endpointMeta(project);

  project.components.filter(isProtectiveBreaker).forEach((protectiveDevice) => {
    const current = protectiveDevice.electrical.ratedCurrentA;
    if (!current) {
      return;
    }

    const minimumCrossSection = minimumCrossSectionForBreaker(current);
    const label = breakerLabel(protectiveDevice);
    const graph = buildCableGaugeGraph(project, protectiveDevice.id);
    const starts = protectiveDevice.terminals
      .filter(
        (terminal) =>
          terminal.direction === "out" &&
          (terminal.role === "power_out" || (protectiveDevice.type === "rcbo" && terminal.role === "neutral_out"))
      )
      .map((terminal) => endpointKey(terminalEndpoint(protectiveDevice.id, terminal.id)));
    const circuitLoads = reachableExternalLoads(starts, graph, meta);
    if (circuitLoads.size === 0) {
      return;
    }

    const queue = starts.map((key) => ({ key, depth: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode || visited.has(currentNode.key)) {
        continue;
      }

      visited.add(currentNode.key);
      graph.get(currentNode.key)?.forEach((edge) => {
        const edgeMeta = meta.get(edge.to);
        const edgeComponent = edgeMeta?.component;
        const crossesIntoOtherBreaker =
          edgeComponent && isProtectiveBreaker(edgeComponent) && edgeComponent.id !== protectiveDevice.id;

        if (crossesIntoOtherBreaker) {
          return;
        }

        if (edge.wire && edge.wire.cable.crossSectionMm2 < minimumCrossSection) {
          const issueKey = `${protectiveDevice.id}:${edge.wire.id}`;
          const wireIssueKey = `wire-min:${edge.wire.id}`;
          if (!seen.has(issueKey) && !seen.has(wireIssueKey)) {
            seen.add(issueKey);
            seen.add(wireIssueKey);
            const relatedComponents = relatedComponentsForWire(project, edge.wire);
            const routeHint = starts.includes(currentNode.key) || starts.includes(edge.to) ? "" : " na dalszej trasie";

            issues.push({
              severity: "error",
              code:
                protectiveDevice.electrical.curve === "B" && current === 16
                  ? "CABLE_UNDERSIZED_B16"
                  : "CABLE_UNDERSIZED",
              message: `Obwód zabezpieczony ${label} zawiera przewód ${edge.wire.cable.crossSectionMm2} mm²${routeHint}. Minimalny przekrój dla tej walidacji to ${minimumCrossSection} mm².`,
              relatedComponents: [protectiveDevice.id, ...relatedComponents],
              relatedWires: [edge.wire.id],
              suggestion: `Zwiększ przekrój przewodu do co najmniej ${minimumCrossSection} mm² albo zmień zabezpieczenie.`
            });
          }
        }

        if (edge.wire) {
          const downstreamLoad = loadSum(reachableExternalLoads([edge.to], graph, meta, currentNode.key).values());
          const maximumLoad = maximumCurrentForCrossSection(edge.wire.cable.crossSectionMm2);
          const issueKey = `${protectiveDevice.id}:${edge.wire.id}:load`;
          if (downstreamLoad > maximumLoad && !seen.has(issueKey)) {
            seen.add(issueKey);
            const relatedComponents = relatedComponentsForWire(project, edge.wire);

            issues.push({
              severity: "error",
              code: "CABLE_UNDERSIZED_LOAD",
              message: `Przewód ${edge.wire.cable.crossSectionMm2} mm² jest zbyt mały dla obciążenia ${downstreamLoad} A w tym obwodzie.`,
              relatedComponents: [protectiveDevice.id, ...relatedComponents],
              relatedWires: [edge.wire.id],
              suggestion: "Zwiększ przekrój przewodu albo zmniejsz zadeklarowane obciążenie odbiorników."
            });
          }
        }

        if (!visited.has(edge.to)) {
          queue.push({ key: edge.to, depth: currentNode.depth + 1 });
        }
      });
    }
  });

  const fullSupplyGraph = buildFullSupplyCableGraph(project);
  const fullRouteRequirements = new Map<string, FullRouteCableRequirement>();

  project.components
    .filter((component) => component.electrical.externalLoad)
    .forEach((loadComponent) => {
      loadComponent.terminals
        .filter((terminal) => terminal.pole.startsWith("L"))
        .forEach((terminal) => {
          const startKey = endpointKey(terminalEndpoint(loadComponent.id, terminal.id));
          const paths = findFullLiveSupplyPaths(startKey, fullSupplyGraph, meta);

          paths.forEach((path) => {
            const breaker = strongestBreakerOnPath(path, meta);
            const minimumCrossSection = breaker
              ? minimumCrossSectionForBreaker(breaker.electrical.ratedCurrentA ?? 0)
              : 1.5;

            path.wires.forEach((pathWire) => {
              const relatedComponents = relatedComponentsForWire(project, pathWire);
              rememberFullRouteRequirement(
                fullRouteRequirements,
                pathWire,
                minimumCrossSection,
                [loadComponent.id, ...relatedComponents],
                breaker
              );
            });
          });
        });
    });

  fullRouteRequirements.forEach((requirement) => {
    if (requirement.wire.cable.crossSectionMm2 >= requirement.minimumCrossSection) {
      return;
    }

    const issueKey = `wire-min:${requirement.wire.id}`;
    if (seen.has(issueKey)) {
      return;
    }
    seen.add(issueKey);

    const hasBreaker = Boolean(requirement.breakerLabel);
    issues.push({
      severity: hasBreaker ? "error" : "warning",
      code:
        requirement.breakerLabel === "B16"
          ? "CABLE_UNDERSIZED_B16"
          : "CABLE_UNDERSIZED",
      message: hasBreaker
        ? `Na trasie zasilania odbiornika wykryto przewód ${requirement.wire.cable.crossSectionMm2} mm². Dla obwodu ${requirement.breakerLabel} wymagane minimum to ${requirement.minimumCrossSection} mm².`
        : `Na trasie zasilania odbiornika wykryto przewód ${requirement.wire.cable.crossSectionMm2} mm² bez jednoznacznego zabezpieczenia. Dla tej uproszczonej walidacji przyjęto minimum ${requirement.minimumCrossSection} mm².`,
      relatedComponents: [...requirement.relatedComponents],
      relatedWires: [requirement.wire.id],
      suggestion: hasBreaker
        ? "Zwiększ przekrój tego fragmentu trasy albo zmień zabezpieczenie downstream."
        : "Sprawdź zasilanie tego odbiornika i dobierz przekrój przewodu do zabezpieczenia."
    });
  });

  return issues;
};

export const circuitLoadPolicy: ValidationPolicy = (project) => {
  const issues: ValidationIssue[] = [];
  const meta = endpointMeta(project);

  project.components.filter(isProtectiveBreaker).forEach((protectiveDevice) => {
    const current = protectiveDevice.electrical.ratedCurrentA;
    if (!current) {
      return;
    }

    const graph = buildCableGaugeGraph(project, protectiveDevice.id);
    const starts = protectiveDevice.terminals
      .filter(
        (terminal) =>
          terminal.direction === "out" &&
          (terminal.role === "power_out" || (protectiveDevice.type === "rcbo" && terminal.role === "neutral_out"))
      )
      .map((terminal) => endpointKey(terminalEndpoint(protectiveDevice.id, terminal.id)));
    const loads = reachableExternalLoads(starts, graph, meta);
    const totalLoad = loadSum(loads.values());

    if (loads.size === 0 || totalLoad <= current) {
      return;
    }

    issues.push({
      severity: "error",
      code: "CIRCUIT_LOAD_EXCEEDS_BREAKER",
      message: `Suma prądów odbiorników w obwodzie (${totalLoad} A) przekracza wartość zabezpieczenia ${breakerLabel(protectiveDevice)}.`,
      relatedComponents: [protectiveDevice.id, ...loads.keys()],
      suggestion: "Zmniejsz obciążenie obwodu albo dobierz odpowiednie zabezpieczenie i przewody."
    });
  });

  return issues;
};

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
            suggestion: `Suma zabezpieczeń to ${totalCurrent} A, współczynnik jednoczesności ${factor}, a moduł nadrzędny ma ${component.electrical.ratedCurrentA} A.`
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
      suggestion: "Podłącz to wejście z nadrzędnego modułu zabezpieczającego lub łącznika."
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
          suggestion: "Podłącz L1/L2/L3/N/PE do pierwszych modułów lub listew."
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
  neutralRcdCircuitPolicy,
  circuitCompletenessPolicy,
  cableGaugePolicy,
  circuitLoadPolicy,
  breakerGroupingPolicy,
  missingInputPolicy,
  requiredLoadPolesPolicy,
  missingMainSwitchPolicy,
  boardSupplyConnectionPolicy,
  missingBusbarAdvisoryPolicy,
  highOccupancyPolicy
];
