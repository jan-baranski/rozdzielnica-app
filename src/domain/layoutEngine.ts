import { EXTERNAL_ZONE_WIDTH_PX, MODULE_HEIGHT_PX, MODULE_WIDTH_PX, ROW_GAP } from "./constants";
import type { Board, BoardComponent, ValidationIssue } from "./types";

export interface RowOccupancy {
  rowIndex: number;
  modules: Array<string | null>;
  occupiedCount: number;
  capacity: number;
}

export function calculateRowOccupancy(board: Board, components: BoardComponent[]): RowOccupancy[] {
  return board.rows.map((row) => {
    const modules: Array<string | null> = Array.from({ length: row.maxModules }, () => null);

    components
      .filter((component) => component.layout.placementMode === "din_module" && component.layout.row === row.index)
      .forEach((component) => {
        if (component.layout.placementMode !== "din_module") {
          return;
        }
        for (let offset = 0; offset < component.moduleWidth; offset += 1) {
          const moduleIndex = component.layout.startModule + offset;
          if (moduleIndex >= 0 && moduleIndex < modules.length && modules[moduleIndex] === null) {
            modules[moduleIndex] = component.id;
          }
        }
      });

    return {
      rowIndex: row.index,
      modules,
      occupiedCount: modules.filter(Boolean).length,
      capacity: row.maxModules
    };
  });
}

export function detectOverlap(components: BoardComponent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dinComponents = components.filter((component) => component.layout.placementMode === "din_module");

  for (let i = 0; i < dinComponents.length; i += 1) {
    for (let j = i + 1; j < dinComponents.length; j += 1) {
      const a = dinComponents[i];
      const b = dinComponents[j];
      if (a.layout.placementMode !== "din_module" || b.layout.placementMode !== "din_module") {
        continue;
      }
      if (a.layout.row !== b.layout.row) {
        continue;
      }

      const aEnd = a.layout.startModule + a.moduleWidth;
      const bEnd = b.layout.startModule + b.moduleWidth;
      const overlaps = a.layout.startModule < bEnd && b.layout.startModule < aEnd;

      if (overlaps) {
        issues.push({
          severity: "error",
          code: "LAYOUT_OVERLAP",
          message: `${a.name} nachodzi na ${b.name} w rzędzie ${a.layout.row + 1}.`,
          relatedComponents: [a.id, b.id],
          suggestion: "Przesuń jeden z aparatów na wolne moduły."
        });
      }
    }
  }

  return issues;
}

export function detectOutOfBounds(board: Board, components: BoardComponent[]): ValidationIssue[] {
  return components.filter((component) => component.layout.placementMode === "din_module").flatMap((component) => {
    const layout = component.layout;
    if (layout.placementMode !== "din_module") {
      return [];
    }
    const row = board.rows.find((candidate) => candidate.index === layout.row);
    const endModule = layout.startModule + component.moduleWidth;

    if (!row || layout.startModule < 0 || endModule > (row?.maxModules ?? 0)) {
      return [
        {
          severity: "error" as const,
          code: "LAYOUT_OUT_OF_BOUNDS",
          message: `${component.name} znajduje się poza dostępnym obszarem szyny DIN.`,
          relatedComponents: [component.id],
          suggestion: "Umieść aparat w istniejącym rzędzie i zakresie modułów."
        }
      ];
    }

    return [];
  });
}

export function findFirstAvailableSlot(
  board: Board,
  components: BoardComponent[],
  moduleWidth: number
): { row: number; startModule: number } | null {
  for (const row of board.rows) {
    for (let startModule = 0; startModule <= row.maxModules - moduleWidth; startModule += 1) {
      const candidate = {
        id: "__candidate__",
        catalogItemId: "",
        type: "blank",
        name: "Candidate",
        moduleWidth,
        placementMode: "din_module",
        terminals: [],
        electrical: {},
        layout: { placementMode: "din_module", row: row.index, startModule }
      } satisfies BoardComponent;

      if (detectOverlap([...components, candidate]).length === 0) {
        return candidate.layout;
      }
    }
  }

  return null;
}

export function calculateBoardOccupancy(board: Board, components: BoardComponent[]): number {
  const occupied = components
    .filter((component) => component.layout.placementMode === "din_module")
    .reduce((sum, component) => sum + component.moduleWidth, 0);
  const capacity = board.rows.reduce((sum, row) => sum + row.maxModules, 0);
  return capacity === 0 ? 0 : occupied / capacity;
}

export function getBoardBounds(board: Board): { width: number; height: number } {
  return {
    width: board.widthModulesPerRow * MODULE_WIDTH_PX,
    height: board.rows.length * MODULE_HEIGHT_PX + (board.rows.length - 1) * ROW_GAP
  };
}

export function getComponentVisualSize(component: BoardComponent): { width: number; height: number } {
  if (component.layout.placementMode === "free") {
    const fallbackWidth = component.moduleWidth * MODULE_WIDTH_PX;
    return {
      width: component.electrical.busType ? Math.max(120, fallbackWidth) : fallbackWidth,
      height: component.electrical.busType ? 28 : MODULE_HEIGHT_PX
    };
  }

  return {
    width: component.moduleWidth * MODULE_WIDTH_PX,
    height: MODULE_HEIGHT_PX
  };
}

export function detectFreePlacementOutOfBounds(
  board: Board,
  components: BoardComponent[]
): ValidationIssue[] {
  const bounds = getBoardBounds(board);

  return components.filter((component) => component.layout.placementMode === "free").flatMap((component) => {
    if (component.layout.placementMode !== "free") {
      return [];
    }
    const size = getComponentVisualSize(component);
    const maxWidth = component.electrical.externalLoad ? bounds.width + EXTERNAL_ZONE_WIDTH_PX : bounds.width;
    const out =
      component.layout.x < 0 ||
      component.layout.y < 0 ||
      component.layout.x + size.width > maxWidth ||
      component.layout.y + size.height > bounds.height;

    return out
      ? [
          {
            severity: "error" as const,
            code: "FREE_LAYOUT_OUT_OF_BOUNDS",
            message: `${component.name} znajduje się poza obszarem rozdzielnicy.`,
            relatedComponents: [component.id],
            suggestion: "Przesuń element pomocniczy do wnętrza obrysu rozdzielnicy."
          }
        ]
      : [];
  });
}

export function detectFreePlacementOverlap(components: BoardComponent[]): ValidationIssue[] {
  const freeComponents = components.filter((component) => component.layout.placementMode === "free");
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < freeComponents.length; i += 1) {
    for (let j = i + 1; j < freeComponents.length; j += 1) {
      const a = freeComponents[i];
      const b = freeComponents[j];
      if (a.layout.placementMode !== "free" || b.layout.placementMode !== "free") {
        continue;
      }

      const aSize = getComponentVisualSize(a);
      const bSize = getComponentVisualSize(b);
      const overlaps =
        a.layout.x < b.layout.x + bSize.width &&
        b.layout.x < a.layout.x + aSize.width &&
        a.layout.y < b.layout.y + bSize.height &&
        b.layout.y < a.layout.y + aSize.height;

      if (overlaps) {
        issues.push({
          severity: "warning",
          code: "FREE_LAYOUT_OVERLAP",
          message: `${a.name} nachodzi na ${b.name}.`,
          relatedComponents: [a.id, b.id],
          suggestion: "Rozsuń elementy pomocnicze, aby zaciski były czytelne."
        });
      }
    }
  }

  return issues;
}

export function getBoardForbiddenZones(board: Board): Array<{ x: number; y: number; width: number; height: number }> {
  return board.rows.map((row) => ({
    x: 0,
    y: row.index * (MODULE_HEIGHT_PX + ROW_GAP),
    width: board.widthModulesPerRow * MODULE_WIDTH_PX,
    height: MODULE_HEIGHT_PX
  }));
}

export function getBoardFreeZones(board: Board): Array<{ x: number; y: number; width: number; height: number }> {
  const width = board.widthModulesPerRow * MODULE_WIDTH_PX;
  return board.rows.slice(0, -1).map((row) => ({
    x: 0,
    y: row.index * (MODULE_HEIGHT_PX + ROW_GAP) + MODULE_HEIGHT_PX,
    width,
    height: ROW_GAP
  }));
}
