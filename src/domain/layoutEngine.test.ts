import { describe, expect, it } from "vitest";
import {
  detectFreePlacementOutOfBounds,
  detectOutOfBounds,
  detectOverlap,
  findFirstAvailableSlot
} from "./layoutEngine";
import { dinComponent, neutralBus, testBoard } from "./testFixtures";

describe("layout engine", () => {
  it("detects overlapping DIN components on the same row", () => {
    const issues = detectOverlap([dinComponent("a", 1, 3), dinComponent("b", 3, 2)]);

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("LAYOUT_OVERLAP");
    expect(issues[0].relatedComponents).toEqual(["a", "b"]);
  });

  it("detects DIN components outside row bounds", () => {
    const issues = detectOutOfBounds(testBoard, [dinComponent("a", 5, 2)]);

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("LAYOUT_OUT_OF_BOUNDS");
  });

  it("finds the first available module slot", () => {
    const slot = findFirstAvailableSlot(testBoard, [dinComponent("a", 0, 2), dinComponent("b", 2, 2)], 2);

    expect(slot).toEqual({ placementMode: "din_module", row: 0, startModule: 4 });
  });

  it("detects free-placement elements outside board bounds", () => {
    const outside = {
      ...neutralBus,
      layout: { placementMode: "free" as const, x: 500, y: 500 }
    };

    const issues = detectFreePlacementOutOfBounds(testBoard, [outside]);

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("FREE_LAYOUT_OUT_OF_BOUNDS");
  });
});
