import { describe, expect, it } from "vitest";
import { catalogItems } from "./catalog";
import {
  boardSupplyConnectionPolicy,
  cableGaugePolicy,
  circuitCompletenessPolicy,
  circuitLoadPolicy,
  freePlacementBoundsPolicy,
  highOccupancyPolicy,
  missingMainSwitchPolicy,
  neutralRcdCircuitPolicy,
  overlapPolicy,
  peConnectionPolicy,
  requiredLoadPolesPolicy
} from "./policies";
import { boardEndpoint, componentEndpoint } from "./connectivityEngine";
import { dinComponent, load, neutralBus, peBus, source, testBoard, wire } from "./testFixtures";
import type { BoardComponent, ProjectData } from "./types";

const project: ProjectData = {
  board: testBoard,
  components: [dinComponent("a", 0, 2), dinComponent("b", 1, 2)],
  wires: []
};

function rcd(id: string, startModule = 0): BoardComponent {
  return {
    id,
    catalogItemId: "rcd-2p-40a-30ma",
    type: "rcd",
    name: id,
    moduleWidth: 2,
    placementMode: "din_module",
    layout: { placementMode: "din_module", row: 0, startModule },
    electrical: { ratedCurrentA: 40, sensitivityMa: 30, poles: 2, requiresInput: true },
    terminals: [
      { id: "l1-in", label: "L in", role: "power_in", pole: "L1", direction: "in" },
      { id: "n-in", label: "N in", role: "neutral_in", pole: "N", direction: "in" },
      { id: "l1-out", label: "L out", role: "power_out", pole: "L1", direction: "out" },
      { id: "n-out", label: "N out", role: "neutral_out", pole: "N", direction: "out" }
    ]
  };
}

function rcbo(id: string): BoardComponent {
  return { ...rcd(id), type: "rcbo", catalogItemId: "rcbo-1pn", name: id };
}

function mcb(id: string, startModule = 3, current = 16, curve = "B"): BoardComponent {
  return {
    ...load,
    id,
    name: id,
    layout: { placementMode: "din_module", row: 0, startModule },
    electrical: { ratedCurrentA: current, curve, requiresInput: true },
    terminals: [
      { id: "l1-in", label: "L in", role: "power_in", pole: "L1", direction: "in" },
      { id: "l1-out", label: "L out", role: "power_out", pole: "L1", direction: "out" }
    ]
  };
}

function externalLoad(id: string, currentA = 0): BoardComponent {
  return {
    ...load,
    id,
    type: "outlet",
    name: id,
    placementMode: "free",
    layout: { placementMode: "free", x: 220, y: 120 },
    electrical: { externalLoad: true, requiredPoles: ["L1", "N", "PE"], requiresInput: true, currentA },
    terminals: [
      { id: "l-in", label: "L", role: "power_in", pole: "L1", direction: "in" },
      { id: "n-in", label: "N", role: "neutral_in", pole: "N", direction: "in" },
      { id: "pe", label: "PE", role: "earth", pole: "PE", direction: "bidirectional" }
    ]
  };
}

function genericOutlet(id: string): BoardComponent {
  return {
    ...externalLoad(id, 0),
    electrical: { externalLoad: true, requiredPoles: ["L1", "N", "PE"], requiresInput: true, ratingA: 16, currentA: 0 }
  };
}

function bulbLoad(id: string): BoardComponent {
  return {
    ...externalLoad(id, 0.5),
    type: "bulb",
    electrical: { externalLoad: true, requiredPoles: ["L1", "N"], requiresInput: true, currentA: 0.5 },
    terminals: [
      { id: "l-in", label: "L", role: "power_in", pole: "L1", direction: "in" },
      { id: "n-in", label: "N", role: "neutral_in", pole: "N", direction: "in" }
    ]
  };
}

function nBus(id: string): BoardComponent {
  return {
    ...neutralBus,
    id,
    name: id,
    terminals: [
      { id: "n1", label: "N1", role: "neutral_bus", pole: "N", direction: "bidirectional" },
      { id: "n2", label: "N2", role: "neutral_bus", pole: "N", direction: "bidirectional" },
      { id: "n3", label: "N3", role: "neutral_bus", pole: "N", direction: "bidirectional" }
    ]
  };
}

function terminalBlock(id: string): BoardComponent {
  return {
    id,
    catalogItemId: "terminal-block",
    type: "blank",
    name: id,
    moduleWidth: 1,
    placementMode: "din_module",
    layout: { placementMode: "din_module", row: 0, startModule: 5 },
    electrical: {},
    terminals: [
      { id: "l1", label: "L1", role: "power_in", pole: "L1", direction: "bidirectional" },
      { id: "l2", label: "L2", role: "power_out", pole: "L1", direction: "bidirectional" },
      { id: "l3", label: "L3", role: "power_out", pole: "L1", direction: "bidirectional" }
    ]
  };
}

function withCrossSection(connection: ReturnType<typeof wire>, crossSectionMm2: number) {
  return {
    ...connection,
    cable: { ...connection.cable, crossSectionMm2 }
  };
}

function protectedCircuit(
  rcdId: string,
  busId: string,
  breakerId: string,
  loadId: string,
  wirePrefix = rcdId
) {
  return [
    wire(boardEndpoint("supply-l1"), componentEndpoint(rcdId, "l1-in"), `${wirePrefix}-l-supply`),
    wire(boardEndpoint("supply-n"), componentEndpoint(rcdId, "n-in"), `${wirePrefix}-n-supply`),
    wire(componentEndpoint(rcdId, "l1-out"), componentEndpoint(breakerId, "l1-in"), `${wirePrefix}-l-rcd-mcb`),
    wire(componentEndpoint(breakerId, "l1-out"), componentEndpoint(loadId, "l-in"), `${wirePrefix}-l-load`),
    wire(componentEndpoint(rcdId, "n-out"), componentEndpoint(busId, "n1"), `${wirePrefix}-n-rcd-bus`),
    wire(componentEndpoint(busId, "n2"), componentEndpoint(loadId, "n-in"), `${wirePrefix}-n-load`)
  ];
}

function completeCircuitProject(loadComponent: BoardComponent = externalLoad("load-a", 5)): ProjectData {
  return {
    board: testBoard,
    components: [rcd("rcd-a"), mcb("mcb-a"), nBus("n-a"), peBus, loadComponent],
    wires: [
      wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "supply-rcd-l"),
      wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "supply-rcd-n"),
      wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "rcd-mcb-l"),
      wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint(loadComponent.id, "l-in"), "mcb-load-l"),
      wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-a", "n1"), "rcd-bus-n"),
      wire(componentEndpoint("n-a", "n2"), componentEndpoint(loadComponent.id, "n-in"), "bus-load-n"),
      wire(boardEndpoint("supply-pe"), componentEndpoint("pe-bus", "pe1"), "supply-pe-bus"),
      ...(loadComponent.terminals.some((terminal) => terminal.pole === "PE")
        ? [wire(componentEndpoint("pe-bus", "pe1"), componentEndpoint(loadComponent.id, "pe"), "bus-load-pe")]
        : [])
    ]
  };
}

describe("validation policies", () => {
  it("reports overlap policy errors", () => {
    const issues = overlapPolicy(project);

    expect(issues[0].severity).toBe("error");
    expect(issues[0].code).toBe("LAYOUT_OVERLAP");
  });

  it("reports missing main switch warnings", () => {
    const issues = missingMainSwitchPolicy(project);

    expect(issues[0].severity).toBe("warning");
    expect(issues[0].code).toBe("MISSING_MAIN_SWITCH");
  });

  it("warns when board occupancy is above 85 percent", () => {
    const issues = highOccupancyPolicy({
      ...project,
      components: [dinComponent("a", 0, 3), dinComponent("b", 3, 3)]
    });

    expect(issues[0].code).toBe("HIGH_BOARD_OCCUPANCY");
  });

  it("warns when no board supply terminal is connected", () => {
    const issues = boardSupplyConnectionPolicy(project);

    expect(issues[0].code).toBe("BOARD_SUPPLY_UNUSED");
  });

  it("detects invalid PE connections in policy layer", () => {
    const issues = peConnectionPolicy({
      board: testBoard,
      components: [load],
      wires: [wire(boardEndpoint("supply-pe"), componentEndpoint("load", "l-in"))]
    });

    expect(issues[0].code).toBe("PE_CONNECTED_TO_NON_EARTH");
  });

  it("detects free placement out of bounds through policy layer", () => {
    const issues = freePlacementBoundsPolicy({
      board: testBoard,
      components: [{ ...peBus, layout: { placementMode: "free", x: 999, y: 999 } }],
      wires: []
    });

    expect(issues[0].code).toBe("FREE_LAYOUT_OUT_OF_BOUNDS");
  });

  it("loads catalog items with free placement mode", () => {
    const freeItem = catalogItems.find((item) => item.id === "generic-n-bus-8");

    expect(freeItem?.placementMode).toBe("free");
    expect(freeItem?.visual.widthPx).toBe(140);
  });

  it("accepts a complete load circuit with L, N, PE, MCB and RCD", () => {
    const issues = circuitCompletenessPolicy(completeCircuitProject());

    expect(issues).toHaveLength(0);
  });

  it("errors when load neutral has no continuity to supply", () => {
    const project = completeCircuitProject();
    const issues = circuitCompletenessPolicy({
      ...project,
      wires: project.wires.filter((wire) => wire.id !== "supply-rcd-n")
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_N_CONTINUITY")).toBe(true);
  });

  it("errors when load PE has no continuity to supply PE", () => {
    const project = completeCircuitProject();
    const issues = circuitCompletenessPolicy({
      ...project,
      wires: project.wires.filter((wire) => wire.id !== "supply-pe-bus")
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_PE_CONTINUITY")).toBe(true);
  });

  it("errors when a bulb is connected to L without RCD protection", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("bulb-a", "l-in"), "direct-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("bulb-a", "n-in"), "direct-n")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_MISSING_RCD")).toBe(true);
  });

  it("errors when a bulb is connected to L without MCB or RCBO", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("bulb-a", "l-in"), "direct-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("bulb-a", "n-in"), "direct-n")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_MISSING_BREAKER")).toBe(true);
  });

  it("errors when load L is behind RCD A and N is behind RCD B", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), rcd("rcd-b", 2), mcb("mcb-a"), nBus("n-b"), bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "a-l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "a-l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("bulb-a", "l-in"), "a-l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-b", "n-in"), "b-n-supply"),
        wire(componentEndpoint("rcd-b", "n-out"), componentEndpoint("n-b", "n1"), "b-n-bus"),
        wire(componentEndpoint("n-b", "n2"), componentEndpoint("bulb-a", "n-in"), "b-n-load")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_RCD_MISMATCH")).toBe(true);
  });

  it("errors when load L is behind RCD but N is before RCD", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("mcb-a"), nBus("n-before"), bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("bulb-a", "l-in"), "l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("n-before", "n1"), "n-before-bus"),
        wire(componentEndpoint("n-before", "n2"), componentEndpoint("bulb-a", "n-in"), "n-load")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_RCD_MISMATCH")).toBe(true);
  });

  it("errors when an outlet circuit has L and N but lacks required PE continuity", () => {
    const project = completeCircuitProject();
    const issues = circuitCompletenessPolicy({
      ...project,
      wires: project.wires.filter((wire) => wire.id !== "bus-load-pe")
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_PE_CONTINUITY")).toBe(true);
  });

  it("does not require PE for a bulb that only requires L and N", () => {
    const issues = circuitCompletenessPolicy(completeCircuitProject(bulbLoad("bulb-a")));

    expect(issues.some((issue) => issue.code === "CIRCUIT_PE_CONTINUITY")).toBe(false);
    expect(issues).toHaveLength(0);
  });

  it("errors when a bulb has a correct L path and an extra direct supply L path", () => {
    const project = completeCircuitProject(bulbLoad("bulb-a"));
    const issues = circuitCompletenessPolicy({
      ...project,
      wires: [
        ...project.wires,
        wire(boardEndpoint("supply-l1"), componentEndpoint("bulb-a", "l-in"), "extra-direct-l")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_L_MULTIPLE_PATHS")).toBe(true);
    expect(issues.some((issue) => issue.code === "CIRCUIT_MISSING_BREAKER")).toBe(true);
    expect(issues.some((issue) => issue.code === "CIRCUIT_MISSING_RCD")).toBe(true);
  });

  it("errors when one bulb is fed by B10 and B16 at the same time", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b10", 3, 10, "B"), mcb("b16", 4, 16, "B"), nBus("n-a"), bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "supply-rcd-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "supply-rcd-n"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-b10"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b16", "l1-in"), "rcd-b16"),
        wire(componentEndpoint("b10", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b10-bulb"),
        wire(componentEndpoint("b16", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b16-bulb"),
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-a", "n1"), "rcd-bus-n"),
        wire(componentEndpoint("n-a", "n2"), componentEndpoint("bulb-a", "n-in"), "bus-bulb-n")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_L_MULTIPLE_PATHS")).toBe(true);
  });

  it("errors when one bulb is fed through two different RCDs", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [
        rcd("rcd-a"),
        rcd("rcd-b", 2),
        mcb("b10", 4, 10, "B"),
        mcb("b16", 5, 16, "B"),
        nBus("n-a"),
        bulbLoad("bulb-a")
      ],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "supply-rcd-a-l"),
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-b", "l1-in"), "supply-rcd-b-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "supply-rcd-a-n"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-a-b10"),
        wire(componentEndpoint("rcd-b", "l1-out"), componentEndpoint("b16", "l1-in"), "rcd-b-b16"),
        wire(componentEndpoint("b10", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b10-bulb"),
        wire(componentEndpoint("b16", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b16-bulb"),
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-a", "n1"), "rcd-a-bus-n"),
        wire(componentEndpoint("n-a", "n2"), componentEndpoint("bulb-a", "n-in"), "bus-bulb-n")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_L_MULTIPLE_PATHS")).toBe(true);
  });

  it("accepts one B10 branching to two bulbs after the breaker", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b10", 3, 10, "B"), terminalBlock("joint-a"), nBus("n-a"), bulbLoad("bulb-a"), bulbLoad("bulb-b")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "supply-rcd-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "supply-rcd-n"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-b10"),
        wire(componentEndpoint("b10", "l1-out"), componentEndpoint("joint-a", "l1"), "b10-joint"),
        wire(componentEndpoint("joint-a", "l2"), componentEndpoint("bulb-a", "l-in"), "joint-bulb-a"),
        wire(componentEndpoint("joint-a", "l3"), componentEndpoint("bulb-b", "l-in"), "joint-bulb-b"),
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-a", "n1"), "rcd-bus-n"),
        wire(componentEndpoint("n-a", "n2"), componentEndpoint("bulb-a", "n-in"), "bus-bulb-a-n"),
        wire(componentEndpoint("n-a", "n3"), componentEndpoint("bulb-b", "n-in"), "bus-bulb-b-n")
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("finds a bad extra L path even when the L graph contains a loop", () => {
    const issues = circuitCompletenessPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b10", 3, 10, "B"), terminalBlock("joint-a"), terminalBlock("joint-b"), nBus("n-a"), bulbLoad("bulb-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "supply-rcd-l"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "supply-rcd-n"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-b10"),
        wire(componentEndpoint("b10", "l1-out"), componentEndpoint("joint-a", "l1"), "b10-joint-a"),
        wire(componentEndpoint("joint-a", "l2"), componentEndpoint("joint-b", "l1"), "joint-loop-a"),
        wire(componentEndpoint("joint-b", "l2"), componentEndpoint("joint-a", "l3"), "joint-loop-b"),
        wire(componentEndpoint("joint-b", "l3"), componentEndpoint("bulb-a", "l-in"), "joint-bulb"),
        wire(boardEndpoint("supply-l1"), componentEndpoint("bulb-a", "l-in"), "extra-direct-l"),
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-a", "n1"), "rcd-bus-n"),
        wire(componentEndpoint("n-a", "n2"), componentEndpoint("bulb-a", "n-in"), "bus-bulb-n")
      ]
    });

    expect(issues.some((issue) => issue.code === "CIRCUIT_L_MULTIPLE_PATHS")).toBe(true);
    expect(issues.some((issue) => issue.code === "CIRCUIT_MISSING_BREAKER")).toBe(true);
  });

  it("errors when a B16 MCB is wired with less than 2.5 mm2 cable", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in")), 1.5)
      ]
    });

    expect(issues[0].code).toBe("CABLE_UNDERSIZED_B16");
  });

  it("accepts a B16 circuit wired with 2.5 mm2 all the way to a load", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a")],
      wires: [withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in")), 2.5)]
    });

    expect(issues).toHaveLength(0);
  });

  it("detects an undersized downstream segment behind a B16 breaker", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), terminalBlock("joint-a"), externalLoad("load-a", 10)],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("joint-a", "l1"), "b16-joint"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l2"), componentEndpoint("load-a", "l-in"), "joint-load"), 1.5)
      ]
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("CABLE_UNDERSIZED_B16");
    expect(issues[0].relatedWires).toEqual(["joint-load"]);
  });

  it("accepts a B10 circuit wired with 1.5 mm2", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b10", 3, 10, "B"), externalLoad("load-a", 10)],
      wires: [withCrossSection(wire(componentEndpoint("b10", "l1-out"), componentEndpoint("load-a", "l-in")), 1.5)]
    });

    expect(issues).toHaveLength(0);
  });

  it("keeps parallel B10 and B16 circuits behind one RCD separate for cable sizing", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b10", 3, 10, "B"), mcb("b16", 4, 16, "B"), bulbLoad("bulb-a"), genericOutlet("outlet-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-b10"), 1.5),
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b16", "l1-in"), "rcd-b16"), 2.5),
        withCrossSection(wire(componentEndpoint("b10", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b10-bulb"), 1.5),
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("outlet-a", "l-in"), "b16-outlet"), 2.5)
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("reports only the B16 output when parallel B10 and B16 circuits use 1.5 mm2 downstream wires", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b10", 3, 10, "B"), mcb("b16", 4, 16, "B"), bulbLoad("bulb-a"), genericOutlet("outlet-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b10", "l1-in"), "rcd-b10"), 1.5),
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b16", "l1-in"), "rcd-b16"), 1.5),
        withCrossSection(wire(componentEndpoint("b10", "l1-out"), componentEndpoint("bulb-a", "l-in"), "b10-bulb"), 1.5),
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("outlet-a", "l-in"), "b16-outlet"), 1.5)
      ]
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].relatedWires).toEqual(["b16-outlet"]);
  });

  it("does not classify an undersized RCD-to-MCB feed as a final B16 circuit wire", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("b16", 4, 16, "B"), genericOutlet("outlet-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("b16", "l1-in"), "rcd-b16"), 1.5),
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("outlet-a", "l-in"), "b16-outlet"), 2.5)
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("detects a C20 circuit that drops from 4 mm2 to 2.5 mm2 after a distribution block", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("c20", 3, 20, "C"), terminalBlock("block-a"), externalLoad("load-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("c20", "l1-out"), componentEndpoint("block-a", "l1"), "c20-block"), 4),
        withCrossSection(wire(componentEndpoint("block-a", "l2"), componentEndpoint("load-a", "l-in"), "block-load"), 2.5)
      ]
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("C20");
    expect(issues[0].relatedWires).toEqual(["block-load"]);
  });

  it("accepts a B16 route through an RCD and terminal block when every segment is 2.5 mm2", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), rcd("rcd-a"), terminalBlock("joint-a"), externalLoad("load-a", 10)],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("rcd-a", "l1-in"), "b16-rcd"), 2.5),
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("joint-a", "l1"), "rcd-joint"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l2"), componentEndpoint("load-a", "l-in"), "joint-load"), 2.5)
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("detects an undersized B16 segment after an RCD and terminal block", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), rcd("rcd-a"), terminalBlock("joint-a"), externalLoad("load-a", 10)],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("rcd-a", "l1-in"), "b16-rcd"), 2.5),
        withCrossSection(wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("joint-a", "l1"), "rcd-joint"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l2"), componentEndpoint("load-a", "l-in"), "joint-load"), 1.5)
      ]
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].relatedWires).toEqual(["joint-load"]);
  });

  it("does not loop or duplicate issues when the downstream graph has a cycle", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), terminalBlock("joint-a"), terminalBlock("joint-b"), externalLoad("load-a", 10)],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("joint-a", "l1"), "b16-joint"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l2"), componentEndpoint("joint-b", "l1"), "undersized-loop"), 1.5),
        withCrossSection(wire(componentEndpoint("joint-b", "l2"), componentEndpoint("joint-a", "l3"), "loop-return"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-b", "l3"), componentEndpoint("load-a", "l-in"), "joint-load"), 2.5)
      ]
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].relatedWires).toEqual(["undersized-loop"]);
  });

  it("does not report cable gauge errors for an incomplete circuit without a load", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), terminalBlock("joint-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("joint-a", "l1"), "unfinished"), 1.5)
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("accepts a B16 circuit with a 10 A load", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a", 10)],
      wires: [wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in"))]
    });

    expect(issues).toHaveLength(0);
  });

  it("errors when a B16 circuit has a 20 A custom load", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b16"), { ...externalLoad("custom-a", 20), type: "custom_load" as const }],
      wires: [wire(componentEndpoint("b16", "l1-out"), componentEndpoint("custom-a", "l-in"))]
    });

    expect(issues[0].code).toBe("CIRCUIT_LOAD_EXCEEDS_BREAKER");
  });

  it("errors when two loads behind B16 sum to 18 A", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b16"), terminalBlock("joint-a"), externalLoad("load-a", 10), externalLoad("load-b", 8)],
      wires: [
        wire(componentEndpoint("b16", "l1-out"), componentEndpoint("joint-a", "l1"), "b16-joint"),
        wire(componentEndpoint("joint-a", "l2"), componentEndpoint("load-a", "l-in"), "joint-load-a"),
        wire(componentEndpoint("joint-a", "l3"), componentEndpoint("load-b", "l-in"), "joint-load-b")
      ]
    });

    expect(issues[0].message).toContain("18 A");
  });

  it("errors when a 1.5 mm2 wire feeds a 14 A load even if load is below B16", () => {
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a", 14)],
      wires: [withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in")), 1.5)]
    });

    expect(issues.some((issue) => issue.code === "CABLE_UNDERSIZED_LOAD")).toBe(true);
  });

  it("accepts a 10 A load on a B16 circuit wired with 2.5 mm2", () => {
    const loadIssues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a", 10)],
      wires: [withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in")), 2.5)]
    });
    const cableIssues = cableGaugePolicy({
      board: testBoard,
      components: [mcb("b16"), externalLoad("load-a", 10)],
      wires: [withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in")), 2.5)]
    });

    expect([...loadIssues, ...cableIssues]).toHaveLength(0);
  });

  it("uses the generic outlet current fallback when a load has no current set", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [
        mcb("b16"),
        {
          ...externalLoad("load-a", 10),
          electrical: { externalLoad: true, requiresInput: true, requiredPoles: ["L1" as const, "N" as const, "PE" as const] }
        }
      ],
      wires: [wire(componentEndpoint("b16", "l1-out"), componentEndpoint("load-a", "l-in"))]
    });

    expect(issues).toHaveLength(0);
  });

  it("accepts a B16 circuit with 2.5 mm2 wire and a generic outlet rated 16 A with 0 A load", () => {
    const project = {
      board: testBoard,
      components: [mcb("b16"), genericOutlet("outlet-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("outlet-a", "l-in")), 2.5)
      ]
    };

    expect(circuitLoadPolicy(project)).toHaveLength(0);
    expect(cableGaugePolicy(project)).toHaveLength(0);
  });

  it("accepts a B16 circuit with a generic outlet and a 0.5 A bulb", () => {
    const project = {
      board: testBoard,
      components: [mcb("b16"), terminalBlock("joint-a"), genericOutlet("outlet-a"), bulbLoad("bulb-a")],
      wires: [
        withCrossSection(wire(componentEndpoint("b16", "l1-out"), componentEndpoint("joint-a", "l1"), "b16-joint"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l2"), componentEndpoint("outlet-a", "l-in"), "joint-outlet"), 2.5),
        withCrossSection(wire(componentEndpoint("joint-a", "l3"), componentEndpoint("bulb-a", "l-in"), "joint-bulb"), 2.5)
      ]
    };

    expect(circuitLoadPolicy(project)).toHaveLength(0);
    expect(cableGaugePolicy(project)).toHaveLength(0);
  });

  it("does not treat a generic outlet 16 A rating as 16 A load", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b10", 3, 10, "B"), genericOutlet("outlet-a")],
      wires: [wire(componentEndpoint("b10", "l1-out"), componentEndpoint("outlet-a", "l-in"))]
    });

    expect(issues).toHaveLength(0);
  });

  it("does not give a bulb 16 A default load", () => {
    const issues = circuitLoadPolicy({
      board: testBoard,
      components: [mcb("b10", 3, 10, "B"), bulbLoad("bulb-a")],
      wires: [wire(componentEndpoint("b10", "l1-out"), componentEndpoint("bulb-a", "l-in"))]
    });

    expect(issues).toHaveLength(0);
  });

  it("errors when an outlet has phase connected but required neutral and PE are missing", () => {
    const outlet = {
      ...load,
      id: "outlet",
      type: "outlet" as const,
      electrical: { externalLoad: true, requiredPoles: ["L1" as const, "N" as const, "PE" as const] },
      terminals: [
        { id: "l-in", label: "L", role: "power_in" as const, pole: "L1" as const, direction: "in" as const },
        { id: "n-in", label: "N", role: "neutral_in" as const, pole: "N" as const, direction: "in" as const },
        { id: "pe", label: "PE", role: "earth" as const, pole: "PE" as const, direction: "bidirectional" as const }
      ]
    };

    const issues = requiredLoadPolesPolicy({
      board: testBoard,
      components: [source, outlet],
      wires: [wire(componentEndpoint("source", "l-out"), componentEndpoint("outlet", "l-in"))]
    });

    expect(issues[0].code).toBe("LOAD_PARTIAL_CONNECTION");
    expect(issues[0].message).toContain("N");
    expect(issues[0].message).toContain("PE");
  });

  it("does not error when an external load has only PE connected", () => {
    const outlet = {
      ...peBus,
      id: "outlet",
      type: "outlet" as const,
      electrical: { externalLoad: true, requiredPoles: ["L1" as const, "N" as const, "PE" as const] },
      terminals: [
        { id: "l-in", label: "L", role: "power_in" as const, pole: "L1" as const, direction: "in" as const },
        { id: "n-in", label: "N", role: "neutral_in" as const, pole: "N" as const, direction: "in" as const },
        { id: "pe", label: "PE", role: "earth" as const, pole: "PE" as const, direction: "bidirectional" as const }
      ]
    };

    const issues = requiredLoadPolesPolicy({
      board: testBoard,
      components: [peBus, outlet],
      wires: [wire(componentEndpoint("pe-bus", "pe1"), componentEndpoint("outlet", "pe"))]
    });

    expect(issues).toHaveLength(0);
  });

  it("accepts one RCD with one N bus and multiple circuits behind it", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), nBus("n-a"), mcb("mcb-a"), mcb("mcb-b"), externalLoad("load-a"), externalLoad("load-b")],
      wires: [
        ...protectedCircuit("rcd-a", "n-a", "mcb-a", "load-a", "a"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-b", "l1-in"), "b-l-rcd-mcb"),
        wire(componentEndpoint("mcb-b", "l1-out"), componentEndpoint("load-b", "l-in"), "b-l-load"),
        wire(componentEndpoint("n-a", "n3"), componentEndpoint("load-b", "n-in"), "b-n-load")
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("accepts an N bus supplied from the RCD N output for a load behind that RCD", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), nBus("n-a"), mcb("mcb-a"), externalLoad("load-a")],
      wires: protectedCircuit("rcd-a", "n-a", "mcb-a", "load-a", "a")
    });

    expect(issues).toHaveLength(0);
  });

  it("accepts two RCDs with separate N buses", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [
        rcd("rcd-a"),
        rcd("rcd-b", 2),
        nBus("n-a"),
        nBus("n-b"),
        mcb("mcb-a"),
        mcb("mcb-b"),
        externalLoad("load-a"),
        externalLoad("load-b")
      ],
      wires: [
        ...protectedCircuit("rcd-a", "n-a", "mcb-a", "load-a", "a"),
        ...protectedCircuit("rcd-b", "n-b", "mcb-b", "load-b", "b")
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("errors when two RCDs share one N bus", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), rcd("rcd-b", 2), nBus("n-shared")],
      wires: [
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-shared", "n1"), "a-n"),
        wire(componentEndpoint("rcd-b", "n-out"), componentEndpoint("n-shared", "n2"), "b-n")
      ]
    });

    expect(issues[0].code).toBe("N_BUS_SHARED_BY_RCDS");
  });

  it("errors when an N bus is supplied directly from supply while serving a load whose L is behind RCD", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), nBus("n-bypass"), mcb("mcb-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("n-bypass", "n1"), "n-supply-bus"),
        wire(componentEndpoint("n-bypass", "n2"), componentEndpoint("load-a", "n-in"), "n-bus-load")
      ]
    });

    expect(issues.some((issue) => issue.code === "N_BUS_BYPASSES_RCD")).toBe(true);
  });

  it("errors when one N bus is connected to supply N and RCD N output at the same time", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), nBus("n-mixed")],
      wires: [
        wire(boardEndpoint("supply-n"), componentEndpoint("n-mixed", "n1"), "supply-bus"),
        wire(componentEndpoint("rcd-a", "n-out"), componentEndpoint("n-mixed", "n2"), "rcd-bus")
      ]
    });

    expect(issues.some((issue) => issue.code === "N_BUS_MIXES_RCD_AND_SUPPLY")).toBe(true);
  });

  it("does not report the N-bus bypass rule for a circuit without RCD", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [nBus("n-a"), mcb("mcb-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("mcb-a", "l1-in"), "l-supply-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("n-a", "n1"), "n-supply-bus"),
        wire(componentEndpoint("n-a", "n2"), componentEndpoint("load-a", "n-in"), "n-bus-load")
      ]
    });

    expect(issues.some((issue) => issue.code === "N_BUS_BYPASSES_RCD")).toBe(false);
    expect(issues.some((issue) => issue.code === "N_BUS_MIXES_RCD_AND_SUPPLY")).toBe(false);
  });

  it("errors when phase is behind RCD but N is connected before RCD", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), nBus("n-before"), mcb("mcb-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "l-supply"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-a", "n-in"), "n-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("n-before", "n1"), "n-before-bus"),
        wire(componentEndpoint("n-before", "n2"), componentEndpoint("load-a", "n-in"), "n-load")
      ]
    });

    expect(issues[0].code).toBe("N_CONNECTED_BEFORE_RCD");
  });

  it("errors when phase is behind RCD A but N is behind RCD B", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), rcd("rcd-b", 2), nBus("n-b"), mcb("mcb-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "a-l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "a-l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "a-l-load"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcd-b", "n-in"), "b-n-supply"),
        wire(componentEndpoint("rcd-b", "n-out"), componentEndpoint("n-b", "n1"), "b-n-bus"),
        wire(componentEndpoint("n-b", "n2"), componentEndpoint("load-a", "n-in"), "b-n-load")
      ]
    });

    expect(issues[0].code).toBe("N_RCD_MISMATCH");
  });

  it("warns when a load has L but no valid N", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("mcb-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load")
      ]
    });

    expect(issues[0].code).toBe("LOAD_NEUTRAL_MISSING");
    expect(issues[0].severity).toBe("warning");
  });

  it("accepts an RCBO with its own N output", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcbo("rcbo-a"), externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcbo-a", "l1-in"), "l-supply"),
        wire(boardEndpoint("supply-n"), componentEndpoint("rcbo-a", "n-in"), "n-supply"),
        wire(componentEndpoint("rcbo-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load"),
        wire(componentEndpoint("rcbo-a", "n-out"), componentEndpoint("load-a", "n-in"), "n-load")
      ]
    });

    expect(issues).toHaveLength(0);
  });

  it("warns when PE is used where a load neutral should be", () => {
    const issues = neutralRcdCircuitPolicy({
      board: testBoard,
      components: [rcd("rcd-a"), mcb("mcb-a"), peBus, externalLoad("load-a")],
      wires: [
        wire(boardEndpoint("supply-l1"), componentEndpoint("rcd-a", "l1-in"), "l-supply"),
        wire(componentEndpoint("rcd-a", "l1-out"), componentEndpoint("mcb-a", "l1-in"), "l-rcd-mcb"),
        wire(componentEndpoint("mcb-a", "l1-out"), componentEndpoint("load-a", "l-in"), "l-load"),
        wire(componentEndpoint("pe-bus", "pe1"), componentEndpoint("load-a", "n-in"), "pe-as-n")
      ]
    });

    expect(issues[0].code).toBe("LOAD_NEUTRAL_MISSING");
  });
});
