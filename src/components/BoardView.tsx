"use client";

import { useRef, useMemo } from "react";
import { findCatalogItem } from "@/domain/catalog";
import {
  EXTERNAL_ZONE_WIDTH_PX,
  MODULE_HEIGHT_PX,
  MODULE_WIDTH_PX,
  ROW_GAP,
  TERMINAL_HIT_SIZE
} from "@/domain/constants";
import { endpointKey } from "@/domain/connectivityEngine";
import type { Board, BoardComponent, BoardTerminal, Pole, WireConnection, WireEndpoint } from "@/domain/types";
import { getCatalogVisual, useBoardStore, activeDragState } from "@/store/useBoardStore";
import { BoardComponentView } from "./BoardComponentView";

interface TerminalPoint {
  x: number;
  y: number;
}

interface EndpointRoute {
  point: TerminalPoint;
  approachY: number;
  bounds?: { left: number; right: number; top: number; bottom: number };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function poleColor(pole: Pole | undefined): string {
  if (pole === "N") {
    return "#1d6fd6";
  }

  if (pole === "PE") {
    return "#20a55a";
  }

  if (pole === "L2") {
    return "#1f2937";
  }

  if (pole === "L3") {
    return "#8a8f98";
  }

  return "#7a4b1f";
}

function componentVisualSize(component: BoardComponent): { width: number; height: number } {
  const visual = findCatalogItem(component.catalogItemId)?.visual;
  if (component.layout.placementMode === "free") {
    return {
      width: visual?.widthPx ?? Math.max(120, component.moduleWidth * MODULE_WIDTH_PX),
      height: visual?.heightPx ?? 28
    };
  }

  return {
    width: component.moduleWidth * MODULE_WIDTH_PX,
    height: MODULE_HEIGHT_PX
  };
}

function componentOrigin(component: BoardComponent): TerminalPoint {
  return component.layout.placementMode === "din_module"
    ? {
        x: component.layout.startModule * MODULE_WIDTH_PX,
        y: component.layout.row * (MODULE_HEIGHT_PX + ROW_GAP)
      }
    : { x: component.layout.x, y: component.layout.y };
}

function componentBounds(component: BoardComponent) {
  const origin = componentOrigin(component);
  const size = componentVisualSize(component);
  return {
    left: origin.x,
    right: origin.x + size.width,
    top: origin.y,
    bottom: origin.y + size.height
  };
}

function terminalPoint(component: BoardComponent, endpoint: WireEndpoint): TerminalPoint | null {
  if (endpoint.kind !== "component_terminal") {
    return null;
  }
  const terminal = component.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  if (!terminal) {
    return null;
  }

  const origin = componentOrigin(component);
  const size = componentVisualSize(component);

  if (component.layout.placementMode === "free") {
    const index = Math.max(0, component.terminals.findIndex((candidate) => candidate.id === terminal.id));
    return {
      x: origin.x + ((index + 0.5) / component.terminals.length) * size.width,
      y: origin.y + size.height / 2
    };
  }

  const sameEdge = component.terminals.filter((candidate) => {
    if (terminal.direction === "in") {
      return candidate.direction === "in";
    }
    if (terminal.direction === "out") {
      return candidate.direction === "out";
    }
    return candidate.direction === "bidirectional";
  });
  const index = Math.max(0, sameEdge.findIndex((candidate) => candidate.id === terminal.id));
  const localX = ((index + 0.5) / sameEdge.length) * size.width;
  const localY =
    terminal.direction === "in"
      ? TERMINAL_HIT_SIZE
      : terminal.direction === "out"
        ? MODULE_HEIGHT_PX - TERMINAL_HIT_SIZE
        : MODULE_HEIGHT_PX / 2;

  return {
    x: origin.x + localX,
    y: origin.y + localY
  };
}

function boardTerminalPoint(board: Board, endpoint: WireEndpoint): TerminalPoint | null {
  if (endpoint.kind !== "board_terminal") {
    return null;
  }
  const terminal = board.supplyTerminals.find((candidate) => candidate.id === endpoint.boardTerminalId);
  return terminal ? terminal.position : null;
}

function endpointRoute(
  board: Board,
  components: BoardComponent[],
  endpoint: WireEndpoint
): EndpointRoute | null {
  if (endpoint.kind === "board_terminal") {
    const point = boardTerminalPoint(board, endpoint);
    return point ? { point, approachY: point.y } : null;
  }

  const component = components.find((candidate) => candidate.id === endpoint.componentId);
  if (!component) {
    return null;
  }
  const point = terminalPoint(component, endpoint);
  const terminal = component.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  if (!point || !terminal) {
    return null;
  }

  const bounds = componentBounds(component);
  if (component.layout.placementMode === "din_module") {
    const approachY =
      terminal.direction === "in"
        ? Math.max(8, bounds.top - 14)
        : terminal.direction === "out"
          ? bounds.bottom + Math.min(22, ROW_GAP / 2)
          : point.y;
    return { point, approachY, bounds };
  }

  const approachY = terminal.direction === "in" ? bounds.top - 14 : bounds.bottom + 14;
  return { point, approachY, bounds };
}

function chooseWireCorridor(
  from: EndpointRoute,
  to: EndpointRoute,
  boardWidth: number,
  workspaceWidth: number
): number {
  if (from.bounds && to.bounds) {
    if (from.bounds.right <= to.bounds.left) {
      return (from.bounds.right + to.bounds.left) / 2;
    }
    if (to.bounds.right <= from.bounds.left) {
      return (to.bounds.right + from.bounds.left) / 2;
    }
  }

  const bounded = from.bounds ?? to.bounds;
  const pointOnly = from.bounds ? to.point : from.point;
  if (bounded) {
    if (pointOnly.x <= bounded.left) {
      return Math.max(8, (pointOnly.x + bounded.left) / 2);
    }
    if (pointOnly.x >= bounded.right) {
      return Math.min(workspaceWidth - 8, (pointOnly.x + bounded.right) / 2);
    }
  }

  const rightSide = Math.min(workspaceWidth - 12, Math.max(from.point.x, to.point.x, boardWidth) + 24);
  const leftSide = Math.max(12, Math.min(from.point.x, to.point.x) - 24);
  return rightSide < workspaceWidth - 6 ? rightSide : leftSide;
}

function wirePath(
  wire: WireConnection,
  board: Board,
  components: BoardComponent[],
  workspaceWidth: number,
  laneOffset = 0
): { d: string; color: string; signature: string } | null {
  const fromEndpoint = wire.from;
  const toEndpoint = wire.to;
  const fromComponent =
    fromEndpoint.kind === "component_terminal"
      ? components.find((component) => component.id === fromEndpoint.componentId)
      : undefined;
  const toComponent =
    toEndpoint.kind === "component_terminal"
      ? components.find((component) => component.id === toEndpoint.componentId)
      : undefined;

  const fromRoute = endpointRoute(board, components, fromEndpoint);
  const toRoute = endpointRoute(board, components, toEndpoint);
  const fromTerminal =
    fromEndpoint.kind === "component_terminal"
      ? fromComponent?.terminals.find((terminal) => terminal.id === fromEndpoint.terminalId)
      : board.supplyTerminals.find((terminal) => terminal.id === fromEndpoint.boardTerminalId);
  if (!fromRoute || !toRoute) {
    return null;
  }

  const boardWidth = board.widthModulesPerRow * MODULE_WIDTH_PX;
  const baseCorridorX = chooseWireCorridor(fromRoute, toRoute, boardWidth, workspaceWidth);
  const corridorX = clamp(baseCorridorX + laneOffset, 8, workspaceWidth - 8);
  const fromApproachY = fromRoute.approachY + laneOffset;
  const toApproachY = toRoute.approachY + laneOffset;
  const signature = [
    Math.round(fromRoute.point.x / 4),
    Math.round(fromRoute.point.y / 4),
    Math.round(fromRoute.approachY / 4),
    Math.round(baseCorridorX / 4),
    Math.round(toRoute.approachY / 4),
    Math.round(toRoute.point.x / 4),
    Math.round(toRoute.point.y / 4)
  ].join(":");
  return {
    d: [
      `M ${fromRoute.point.x} ${fromRoute.point.y}`,
      `V ${fromApproachY}`,
      `H ${corridorX}`,
      `V ${toApproachY}`,
      `H ${toRoute.point.x}`,
      `V ${toRoute.point.y}`
    ].join(" "),
    color: poleColor(fromTerminal?.pole),
    signature
  };
}

function supplyClass(terminal: BoardTerminal): string {
  if (terminal.pole === "N") {
    return "border-[#145bb0] bg-[#2f80ed]";
  }
  if (terminal.pole === "PE") {
    return "border-[#0d7b3f] bg-[#20a55a]";
  }
  if (terminal.pole === "L2") {
    return "border-[#111827] bg-[#1f2937]";
  }
  if (terminal.pole === "L3") {
    return "border-[#6b7280] bg-[#8a8f98]";
  }
  return "border-[#5a3514] bg-[#93602c]";
}

export function BoardView() {
  const dragIndicatorRef = useRef<HTMLDivElement>(null);
  const {
    board,
    components,
    wires,
    validationResults,
    selectedItem,
    pendingTerminal,
    editingWireId,
    boardZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    addComponent,
    moveComponent,
    selectItem,
    clickTerminal
  } = useBoardStore();

  const componentIssueIds = useMemo(() => {
    const ids = new Set<string>();
    validationResults
      .filter((issue) => issue.severity === "error")
      .forEach((issue) => issue.relatedComponents?.forEach((id) => ids.add(id)));
    return ids;
  }, [validationResults]);

  const boardWidth = board.widthModulesPerRow * MODULE_WIDTH_PX;
  const boardHeight = board.rows.length * MODULE_HEIGHT_PX + (board.rows.length - 1) * ROW_GAP;
  const workspaceWidth = boardWidth + EXTERNAL_ZONE_WIDTH_PX;
  const wireLaneOffsets = useMemo(() => {
    const groups = new Map<string, string[]>();
    wires.forEach((wire) => {
      const path = wirePath(wire, board, components, workspaceWidth);
      if (!path) {
        return;
      }
      groups.set(path.signature, [...(groups.get(path.signature) ?? []), wire.id]);
    });

    const offsets = new Map<string, number>();
    groups.forEach((wireIds) => {
      wireIds.forEach((wireId, index) => {
        offsets.set(wireId, (index - (wireIds.length - 1) / 2) * 7);
      });
    });
    return offsets;
  }, [board, components, wires, workspaceWidth]);

  const selectedWireEndpoints = useMemo(() => {
    if (selectedItem?.kind !== "wire") return new Set<string>();
    const wire = wires.find((w) => w.id === (selectedItem as any).id);
    if (!wire) return new Set<string>();
    return new Set([endpointKey(wire.from), endpointKey(wire.to)]);
  }, [selectedItem, wires]);

  return (
    <section className="min-w-0 overflow-auto bg-[#e7edf3] p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold">{board.name}</h2>
          <p className="text-xs text-[#667085]">
            {board.rows.length} rz. · {board.widthModulesPerRow} modułów w rzędzie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-[#b9c4d2] bg-white text-xs text-[#344054]">
            <button
              title="Pomniejsz widok"
              aria-label="Pomniejsz widok rozdzielnicy"
              onClick={zoomOut}
              className="h-7 w-8 border-r border-[#d4dce7] font-semibold hover:bg-[#f8fafc]"
            >
              -
            </button>
            <button
              title="Resetuj powiększenie"
              onClick={resetZoom}
              className="h-7 min-w-14 border-r border-[#d4dce7] px-2 font-medium hover:bg-[#f8fafc]"
            >
              {Math.round(boardZoom * 100)}%
            </button>
            <button
              title="Powiększ widok"
              aria-label="Powiększ widok rozdzielnicy"
              onClick={zoomIn}
              className="h-7 w-8 font-semibold hover:bg-[#f8fafc]"
            >
              +
            </button>
          </div>
          <div className="rounded border border-[#b9c4d2] bg-white px-3 py-1 text-xs text-[#344054]">
            Ułożono {components.reduce((sum, component) => sum + component.moduleWidth, 0)}M
          </div>
        </div>
      </div>

      <div className="inline-block rounded bg-[#d9e1ea] p-5 shadow-panel">
        <div style={{ width: workspaceWidth * boardZoom, height: boardHeight * boardZoom }}>
        <div
          className="relative overflow-visible rounded border border-[#a8b4c3] bg-[#eef3f8]"
          style={{
            width: workspaceWidth,
            height: boardHeight,
            transform: `scale(${boardZoom})`,
            transformOrigin: "top left"
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = event.dataTransfer.types.includes("application/x-component-id")
              ? "move"
              : "copy";
              
            if (!dragIndicatorRef.current) return;
            
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / boardZoom;
            const y = (event.clientY - rect.top) / boardZoom;
            
            const catalogId = activeDragState.catalogId;
            const componentId = activeDragState.componentId;
            const catalogItem = catalogId ? findCatalogItem(catalogId) : undefined;
            const moving = componentId ? components.find((component) => component.id === componentId) : undefined;
            const width = catalogItem?.moduleWidth ?? moving?.moduleWidth ?? 1;
            const placementMode = catalogItem?.placementMode ?? moving?.placementMode ?? "din_module";

            let finalX = 0;
            let finalY = 0;
            let finalWidth = 0;
            let finalHeight = 0;

            if (catalogItem) {
              if (placementMode === "free") {
                const size = {
                  width: catalogItem.visual.widthPx ?? Math.max(120, catalogItem.moduleWidth * MODULE_WIDTH_PX),
                  height: catalogItem.visual.heightPx ?? 28
                };
                finalX = clamp(
                  x - size.width / 2,
                  0,
                  Math.max(0, (catalogItem.electricalTemplate.externalLoad ? workspaceWidth : boardWidth) - size.width)
                );
                finalY = clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height));
                finalWidth = size.width;
                finalHeight = size.height;
              } else {
                const maxStart = Math.max(0, board.widthModulesPerRow - width);
                const startModule = clamp(Math.round(x / MODULE_WIDTH_PX), 0, maxStart);
                const row = clamp(Math.floor(y / (MODULE_HEIGHT_PX + ROW_GAP)), 0, board.rows.length - 1);
                finalX = startModule * MODULE_WIDTH_PX;
                finalY = row * (MODULE_HEIGHT_PX + ROW_GAP);
                finalWidth = width * MODULE_WIDTH_PX;
                finalHeight = MODULE_HEIGHT_PX;
              }
            } else if (moving) {
              if (moving.placementMode === "free") {
                const size = componentVisualSize(moving);
                finalX = clamp(
                  x - size.width / 2,
                  0,
                  Math.max(0, (moving.electrical.externalLoad ? workspaceWidth : boardWidth) - size.width)
                );
                finalY = clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height));
                finalWidth = size.width;
                finalHeight = size.height;
              } else {
                const maxStart = Math.max(0, board.widthModulesPerRow - width);
                const startModule = clamp(Math.round(x / MODULE_WIDTH_PX), 0, maxStart);
                const row = clamp(Math.floor(y / (MODULE_HEIGHT_PX + ROW_GAP)), 0, board.rows.length - 1);
                finalX = startModule * MODULE_WIDTH_PX;
                finalY = row * (MODULE_HEIGHT_PX + ROW_GAP);
                finalWidth = width * MODULE_WIDTH_PX;
                finalHeight = MODULE_HEIGHT_PX;
              }
            }
            
            if (finalWidth > 0) {
               dragIndicatorRef.current.style.display = "block";
               dragIndicatorRef.current.style.left = `${finalX}px`;
               dragIndicatorRef.current.style.top = `${finalY}px`;
               dragIndicatorRef.current.style.width = `${finalWidth}px`;
               dragIndicatorRef.current.style.height = `${finalHeight}px`;
            }
          }}
          onDragLeave={() => {
            if (dragIndicatorRef.current) {
               dragIndicatorRef.current.style.display = "none";
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndicatorRef.current) {
               dragIndicatorRef.current.style.display = "none";
            }
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / boardZoom;
            const y = (event.clientY - rect.top) / boardZoom;
            const row = clamp(
              Math.floor(y / (MODULE_HEIGHT_PX + ROW_GAP)),
              0,
              board.rows.length - 1
            );
            const catalogId = event.dataTransfer.getData("application/x-catalog-id");
            const componentId = event.dataTransfer.getData("application/x-component-id");
            const catalogItem = catalogId ? findCatalogItem(catalogId) : undefined;
            const moving = componentId ? components.find((component) => component.id === componentId) : undefined;
            const width = catalogItem?.moduleWidth ?? moving?.moduleWidth ?? 1;
            const placementMode = catalogItem?.placementMode ?? moving?.placementMode ?? "din_module";

            if (catalogItem) {
              if (placementMode === "free") {
                const size = {
                  width: catalogItem.visual.widthPx ?? Math.max(120, catalogItem.moduleWidth * MODULE_WIDTH_PX),
                  height: catalogItem.visual.heightPx
                };
                addComponent(catalogItem, {
                  placementMode: "free",
                  x: clamp(
                    x - size.width / 2,
                    0,
                    Math.max(0, (catalogItem.electricalTemplate.externalLoad ? workspaceWidth : boardWidth) - size.width)
                  ),
                  y: clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height))
                });
              } else {
                const maxStart = Math.max(0, board.widthModulesPerRow - width);
                const startModule = clamp(Math.round(x / MODULE_WIDTH_PX), 0, maxStart);
                addComponent(catalogItem, { placementMode: "din_module", row, startModule });
              }
            } else if (moving) {
              if (moving.placementMode === "free") {
                const size = componentVisualSize(moving);
                moveComponent(moving.id, {
                  placementMode: "free",
                  x: clamp(
                    x - size.width / 2,
                    0,
                    Math.max(0, (moving.electrical.externalLoad ? workspaceWidth : boardWidth) - size.width)
                  ),
                  y: clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height))
                });
              } else {
                const maxStart = Math.max(0, board.widthModulesPerRow - width);
                const startModule = clamp(Math.round(x / MODULE_WIDTH_PX), 0, maxStart);
                moveComponent(moving.id, { placementMode: "din_module", row, startModule });
              }
            }
          }}
        >
          <div
            ref={dragIndicatorRef}
            className="pointer-events-none absolute z-50 hidden rounded border-2 border-dashed border-[#2f80ed] bg-[#2f80ed]/10 transition-all duration-75"
          />
          <div
            className="absolute left-0 top-0 rounded bg-[#f7f8f9]"
            style={{ width: boardWidth, height: boardHeight }}
          />
          <div
            className="absolute top-0 border-l border-dashed border-[#aab5c4] bg-[#edf1f4]"
            style={{ left: boardWidth, width: EXTERNAL_ZONE_WIDTH_PX, height: boardHeight }}
          >
            <div className="absolute left-3 top-2 text-[10px] font-semibold uppercase text-[#667085]">
              Odbiorniki
            </div>
          </div>

          {board.supplyTerminals.map((terminal) => {
            const endpoint = { kind: "board_terminal" as const, boardTerminalId: terminal.id };
            const isPending = pendingTerminal && endpointKey(pendingTerminal) === endpointKey(endpoint);
            const isMoveable = selectedWireEndpoints.has(endpointKey(endpoint));
            
            return (
              <button
                key={terminal.id}
                title={`Zasilanie ${terminal.label}`}
                aria-label={`Zacisk zasilania ${terminal.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  clickTerminal(endpoint);
                }}
                className={[
                  "absolute z-40 flex h-5 min-w-9 items-center justify-center rounded-full border px-1 text-[10px] font-bold text-white shadow-sm transition-all",
                  supplyClass(terminal),
                  isPending ? "ring-2 ring-[#fdb022]" : "",
                  isMoveable ? "ring-4 ring-[#2f80ed] ring-offset-2 ring-offset-[#eef3f8]" : ""
                ].join(" ")}
                style={{
                  left: terminal.position.x - 10,
                  top: terminal.position.y - 10
                }}
              >
                {terminal.label}
              </button>
            );
          })}

          {board.rows.map((row) => (
            <div
              key={row.id}
              className="absolute left-0"
              style={{ top: row.index * (MODULE_HEIGHT_PX + ROW_GAP), width: boardWidth, height: MODULE_HEIGHT_PX }}
            >
              <div className="absolute left-0 right-0 top-[52px] h-4 border-y border-[#7f8b99] bg-[#bac5d1]" />
              {Array.from({ length: row.maxModules }).map((_, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full border-l border-[#dde3eb]"
                  style={{ left: index * MODULE_WIDTH_PX, width: MODULE_WIDTH_PX }}
                />
              ))}
              <div className="absolute left-2 top-2 text-[10px] font-semibold text-[#8792a1]">
                RZĄD {row.index + 1}
              </div>
            </div>
          ))}

          <svg className="absolute inset-0 z-20 overflow-visible" width={workspaceWidth} height={boardHeight}>
            {wires
              .filter((wire) => wire.id !== editingWireId)
              .map((wire) => {
                const path = wirePath(wire, board, components, workspaceWidth, wireLaneOffsets.get(wire.id) ?? 0);
                const selected = selectedItem?.kind === "wire" && selectedItem.id === wire.id;
                return path ? (
                  <g key={wire.id}>
                    <path
                      d={path.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={12}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pointerEvents="stroke"
                      className="cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectItem({ kind: "wire", id: wire.id });
                      }}
                    />
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.color}
                      strokeWidth={selected ? 4 : 2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={selected ? 0.95 : 0.7}
                      className="pointer-events-none"
                    />
                  </g>
                ) : null;
              })}
          </svg>

          {components.map((component) => (
            <BoardComponentView
              key={component.id}
              component={component}
              visualSrc={getCatalogVisual(component)}
              visualSize={componentVisualSize(component)}
              selected={selectedItem?.kind === "component" && selectedItem.id === component.id}
              hasError={componentIssueIds.has(component.id)}
              highlightedTerminals={selectedWireEndpoints}
              onSelect={() => selectItem({ kind: "component", id: component.id })}
              onTerminalClick={(terminalId) =>
                clickTerminal({ kind: "component_terminal", componentId: component.id, terminalId })
              }
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
