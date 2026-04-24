import { describe, expect, it } from "vitest";
import { catalogItems } from "./catalog";
import {
  boardSupplyConnectionPolicy,
  cableGaugePolicy,
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

function mcb(id: string, startModule = 3): BoardComponent {
  return {
    ...load,
    id,
    name: id,
    layout: { placementMode: "din_module", row: 0, startModule },
    terminals: [
      { id: "l1-in", label: "L in", role: "power_in", pole: "L1", direction: "in" },
      { id: "l1-out", label: "L out", role: "power_out", pole: "L1", direction: "out" }
    ]
  };
}

function externalLoad(id: string): BoardComponent {
  return {
    ...load,
    id,
    type: "outlet",
    name: id,
    placementMode: "free",
    layout: { placementMode: "free", x: 220, y: 120 },
    electrical: { externalLoad: true, requiredPoles: ["L1", "N", "PE"], requiresInput: true },
    terminals: [
      { id: "l-in", label: "L", role: "power_in", pole: "L1", direction: "in" },
      { id: "n-in", label: "N", role: "neutral_in", pole: "N", direction: "in" },
      { id: "pe", label: "PE", role: "earth", pole: "PE", direction: "bidirectional" }
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

  it("errors when a B16 MCB is wired with less than 2.5 mm2 cable", () => {
    const b16 = {
      ...load,
      electrical: { ratedCurrentA: 16, curve: "B", requiresInput: true }
    };
    const issues = cableGaugePolicy({
      board: testBoard,
      components: [source, b16],
      wires: [
        {
          ...wire(componentEndpoint("source", "l-out"), componentEndpoint("load", "l-in")),
          cable: { crossSectionMm2: 1.5, type: "H07V-K", color: "brown" }
        }
      ]
    });

    expect(issues[0].code).toBe("CABLE_UNDERSIZED_B16");
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
