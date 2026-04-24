import { describe, expect, it } from "vitest";
import { catalogItems } from "./catalog";
import {
  boardSupplyConnectionPolicy,
  cableGaugePolicy,
  freePlacementBoundsPolicy,
  highOccupancyPolicy,
  missingMainSwitchPolicy,
  overlapPolicy,
  peConnectionPolicy,
  requiredLoadPolesPolicy
} from "./policies";
import { boardEndpoint, componentEndpoint } from "./connectivityEngine";
import { dinComponent, load, peBus, source, testBoard, wire } from "./testFixtures";
import type { ProjectData } from "./types";

const project: ProjectData = {
  board: testBoard,
  components: [dinComponent("a", 0, 2), dinComponent("b", 1, 2)],
  wires: []
};

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
});
