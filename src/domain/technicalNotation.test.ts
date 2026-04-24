import { describe, expect, it } from "vitest";
import { formatTechnicalBoardSchema } from "./technicalNotation";
import { componentEndpoint } from "./connectivityEngine";
import { source, testBoard, wire } from "./testFixtures";
import type { ProjectData } from "./types";

describe("formatTechnicalBoardSchema", () => {
  it("renders DIN layout, apparatus designations, and wire notation", () => {
    const project: ProjectData = {
      board: testBoard,
      components: [source],
      wires: [wire({ kind: "board_terminal", boardTerminalId: "supply-l1" }, componentEndpoint("source", "l-in"))]
    };

    const schema = formatTechnicalBoardSchema(project);

    expect(schema).toContain("FORMAL BOARD SCHEMA");
    expect(schema).toContain("DIN: 1 rows x 6 modules");
    expect(schema).toContain("R1 (6M): M1-4 QS1 Main");
    expect(schema).toContain("QS1  MAIN_SWITCH  Main  -  DIN R1 M1-4");
    expect(schema).toContain("W01  X0:L1 -> QS1:L1.L in  H07V-K 2.5mm2 brown");
  });
});
