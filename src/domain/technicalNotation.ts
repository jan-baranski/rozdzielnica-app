import type { BoardComponent, ProjectData, WireConnection, WireEndpoint } from "./types";

const designationPrefixes: Record<BoardComponent["type"], string> = {
  mcb: "QF",
  rcd: "F",
  rcbo: "QF",
  spd: "FV",
  main_switch: "QS",
  neutral_bus: "XN",
  pe_bus: "XPE",
  blank: "A",
  bulb: "EL",
  outlet: "XS",
  custom_load: "EL"
};

function componentSortKey(component: BoardComponent): string {
  if (component.layout.placementMode === "din_module") {
    return `0:${component.layout.row.toString().padStart(3, "0")}:${component.layout.startModule
      .toString()
      .padStart(3, "0")}:${component.name}`;
  }

  return `1:${component.layout.y.toString().padStart(5, "0")}:${component.layout.x.toString().padStart(5, "0")}:${
    component.name
  }`;
}

export function createTechnicalDesignations(components: BoardComponent[]): Map<string, string> {
  const counters = new Map<string, number>();
  const designations = new Map<string, string>();

  [...components].sort((a, b) => componentSortKey(a).localeCompare(componentSortKey(b))).forEach((component) => {
    const prefix = designationPrefixes[component.type];
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    designations.set(component.id, `${prefix}${next}`);
  });

  return designations;
}

export function formatTechnicalRating(component: BoardComponent): string {
  const electrical = component.electrical;
  const details = [
    electrical.curve && electrical.ratedCurrentA ? `${electrical.curve}${electrical.ratedCurrentA}A` : null,
    !electrical.curve && electrical.ratedCurrentA ? `${electrical.ratedCurrentA}A` : null,
    electrical.sensitivityMa ? `${electrical.sensitivityMa}mA` : null,
    electrical.shortCircuitCapacityKa ? `${electrical.shortCircuitCapacityKa}kA` : null,
    electrical.poles ? `${electrical.poles}P` : null,
    electrical.voltage ?? null,
    electrical.busType ? `BUS-${electrical.busType}` : null
  ].filter(Boolean);

  return details.length > 0 ? details.join(" ") : "-";
}

function formatLayout(component: BoardComponent): string {
  if (component.layout.placementMode === "din_module") {
    const from = component.layout.startModule + 1;
    const to = component.layout.startModule + component.moduleWidth;
    return `DIN R${component.layout.row + 1} M${from}-${to}`;
  }

  return `FREE X${component.layout.x} Y${component.layout.y}`;
}

function formatTerminalList(component: BoardComponent): string {
  if (component.terminals.length === 0) {
    return "none";
  }

  return component.terminals
    .map((terminal) => `${terminal.label}[${terminal.pole}/${terminal.direction}/${terminal.role}]`)
    .join(", ");
}

function resolveEndpointNotation(
  endpoint: WireEndpoint,
  project: ProjectData,
  designations: Map<string, string>
): string {
  if (endpoint.kind === "board_terminal") {
    const terminal = project.board.supplyTerminals.find((candidate) => candidate.id === endpoint.boardTerminalId);
    return `X0:${terminal?.pole ?? endpoint.boardTerminalId}`;
  }

  const component = project.components.find((candidate) => candidate.id === endpoint.componentId);
  const terminal = component?.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  const designation = designations.get(endpoint.componentId) ?? endpoint.componentId;
  return `${designation}:${terminal?.pole ?? "?"}.${terminal?.label ?? endpoint.terminalId}`;
}

function wireNumber(index: number): string {
  return `W${(index + 1).toString().padStart(2, "0")}`;
}

function formatWire(wire: WireConnection, index: number, project: ProjectData, designations: Map<string, string>): string {
  const from = resolveEndpointNotation(wire.from, project, designations);
  const to = resolveEndpointNotation(wire.to, project, designations);
  return `${wireNumber(index)}  ${from} -> ${to}  ${wire.cable.type} ${wire.cable.crossSectionMm2}mm2 ${wire.cable.color}`;
}

export function formatTechnicalBoardSchema(project: ProjectData): string {
  const designations = createTechnicalDesignations(project.components);
  const sortedComponents = [...project.components].sort((a, b) => componentSortKey(a).localeCompare(componentSortKey(b)));

  const header = [
    `FORMAL BOARD SCHEMA`,
    `BOARD: ${project.board.name} (${project.board.id})`,
    `DIN: ${project.board.rows.length} rows x ${project.board.widthModulesPerRow} modules`,
    `SUPPLY: ${project.board.supplyTerminals.map((terminal) => `X0:${terminal.pole}`).join(", ")}`
  ];

  const rows = project.board.rows.map((row) => {
    const rowComponents = sortedComponents
      .filter((component) => component.layout.placementMode === "din_module" && component.layout.row === row.index)
      .map((component) => {
        const start = component.layout.placementMode === "din_module" ? component.layout.startModule + 1 : 0;
        const end = start + component.moduleWidth - 1;
        return `M${start}-${end} ${designations.get(component.id)} ${component.name}`;
      });

    return `R${row.index + 1} (${row.maxModules}M): ${rowComponents.length > 0 ? rowComponents.join(" | ") : "empty"}`;
  });

  const apparatus = sortedComponents.map((component) => {
    const designation = designations.get(component.id);
    return `${designation}  ${component.type.toUpperCase()}  ${component.name}  ${formatTechnicalRating(component)}  ${formatLayout(
      component
    )}  terminals: ${formatTerminalList(component)}`;
  });

  const wires = project.wires.map((wire, index) => formatWire(wire, index, project, designations));

  return [
    ...header,
    "",
    "[DIN LAYOUT]",
    ...rows,
    "",
    "[APPARATUS]",
    ...(apparatus.length > 0 ? apparatus : ["none"]),
    "",
    "[CONNECTIONS]",
    ...(wires.length > 0 ? wires : ["none"])
  ].join("\n");
}
