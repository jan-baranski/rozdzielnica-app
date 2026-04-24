import { describe, expect, it } from "vitest";
import {
  boardEndpoint,
  buildConnectionGraph,
  componentEndpoint,
  endpointKey,
  validateTerminalCompatibility
} from "./connectivityEngine";
import { load, neutralBus, peBus, source, testBoard, wire } from "./testFixtures";

describe("connectivity engine", () => {
  it("accepts a board supply terminal connected to a component input", () => {
    const issues = validateTerminalCompatibility(
      testBoard,
      [source],
      wire(boardEndpoint("supply-l1"), componentEndpoint("source", "l-in"))
    );

    expect(issues).toHaveLength(0);
  });

  it("accepts a board neutral terminal connected to a busbar terminal", () => {
    const issues = validateTerminalCompatibility(
      testBoard,
      [neutralBus],
      wire(boardEndpoint("supply-n"), componentEndpoint("n-bus", "n1"))
    );

    expect(issues).toHaveLength(0);
  });

  it("rejects output-to-output wiring", () => {
    const issues = validateTerminalCompatibility(
      testBoard,
      [source, load],
      wire(componentEndpoint("source", "l-out"), componentEndpoint("load", "l-out"))
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("TERMINAL_INCOMPATIBLE");
  });

  it("rejects PE board terminal connected to a non-earth terminal", () => {
    const issues = validateTerminalCompatibility(
      testBoard,
      [load],
      wire(boardEndpoint("supply-pe"), componentEndpoint("load", "l-in"))
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("PE_TO_NON_EARTH");
  });

  it("accepts PE board terminal connected to PE busbar", () => {
    const issues = validateTerminalCompatibility(
      testBoard,
      [peBus],
      wire(boardEndpoint("supply-pe"), componentEndpoint("pe-bus", "pe1"))
    );

    expect(issues).toHaveLength(0);
  });

  it("includes board terminals in the connection graph", () => {
    const graph = buildConnectionGraph([], testBoard);

    expect(graph.adjacency.has(endpointKey(boardEndpoint("supply-l1")))).toBe(true);
    expect(graph.adjacency.has(endpointKey(boardEndpoint("supply-n")))).toBe(true);
    expect(graph.adjacency.has(endpointKey(boardEndpoint("supply-pe")))).toBe(true);
  });
});
