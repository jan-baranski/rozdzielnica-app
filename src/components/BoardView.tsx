"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { findCatalogItem } from "@/domain/catalog";
import {
  EXTERNAL_ZONE_WIDTH_PX,
  MODULE_HEIGHT_PX,
  MODULE_WIDTH_PX,
  ROW_GAP,
  SUPPLY_ZONE_WIDTH_PX,
  TERMINAL_HIT_SIZE
} from "@/domain/constants";
import { endpointKey } from "@/domain/connectivityEngine";
import type { Board, BoardComponent, BoardTerminal, CatalogItem, Pole, WireBreakpoint, WireConnection, WireEndpoint } from "@/domain/types";
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

interface RenderedWirePath {
  d: string;
  color: string;
  signature: string;
}

const CATALOG_POINTER_DRAG_START = "catalog-pointer-drag-start";
const dragThresholdPx = 6;
const longPressThresholdMs = 350;

type DragPlacement = {
  layout: BoardComponent["layout"];
  indicator: { left: number; top: number; width: number; height: number };
};

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

function componentOrigin(component: BoardComponent, boardOffsetX = 0): TerminalPoint {
  return component.layout.placementMode === "din_module"
    ? {
        x: boardOffsetX + component.layout.startModule * MODULE_WIDTH_PX,
        y: component.layout.row * (MODULE_HEIGHT_PX + ROW_GAP)
      }
    : { x: boardOffsetX + component.layout.x, y: component.layout.y };
}

function componentBounds(component: BoardComponent, boardOffsetX = 0) {
  const origin = componentOrigin(component, boardOffsetX);
  const size = componentVisualSize(component);
  return {
    left: origin.x,
    right: origin.x + size.width,
    top: origin.y,
    bottom: origin.y + size.height
  };
}

function terminalPoint(component: BoardComponent, endpoint: WireEndpoint, boardOffsetX = 0): TerminalPoint | null {
  if (endpoint.kind !== "component_terminal") {
    return null;
  }
  const terminal = component.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  if (!terminal) {
    return null;
  }

  const origin = componentOrigin(component, boardOffsetX);
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
  endpoint: WireEndpoint,
  boardOffsetX = 0
): EndpointRoute | null {
  if (endpoint.kind === "board_terminal") {
    const point = boardTerminalPoint(board, endpoint);
    return point ? { point, approachY: point.y } : null;
  }

  const component = components.find((candidate) => candidate.id === endpoint.componentId);
  if (!component) {
    return null;
  }
  const point = terminalPoint(component, endpoint, boardOffsetX);
  const terminal = component.terminals.find((candidate) => candidate.id === endpoint.terminalId);
  if (!point || !terminal) {
    return null;
  }

  const bounds = componentBounds(component, boardOffsetX);
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
  boardOffsetX: number,
  boardWidth: number,
  workspaceWidth: number
): number {
  const boardRight = boardOffsetX + boardWidth;

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

  const rightSide = Math.min(workspaceWidth - 12, Math.max(from.point.x, to.point.x, boardRight) + 24);
  const leftSide = Math.max(12, Math.min(from.point.x, to.point.x, boardOffsetX) - 24);
  return rightSide < workspaceWidth - 6 ? rightSide : leftSide;
}

function formatPolyline(points: TerminalPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function wireStrokeWidth(crossSectionMm2: number): number {
  if (crossSectionMm2 <= 1.5) {
    return 2.5;
  }
  if (crossSectionMm2 <= 2.5) {
    return 3.25;
  }
  if (crossSectionMm2 <= 4) {
    return 4;
  }
  if (crossSectionMm2 <= 6) {
    return 4.75;
  }
  if (crossSectionMm2 <= 10) {
    return 5.75;
  }
  return 6.75;
}

function wirePath(
  wire: WireConnection,
  board: Board,
  components: BoardComponent[],
  workspaceWidth: number,
  boardOffsetX: number,
  laneOffset = 0
): RenderedWirePath | null {
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

  const fromRoute = endpointRoute(board, components, fromEndpoint, boardOffsetX);
  const toRoute = endpointRoute(board, components, toEndpoint, boardOffsetX);
  const fromTerminal =
    fromEndpoint.kind === "component_terminal"
      ? fromComponent?.terminals.find((terminal) => terminal.id === fromEndpoint.terminalId)
      : board.supplyTerminals.find((terminal) => terminal.id === fromEndpoint.boardTerminalId);
  if (!fromRoute || !toRoute) {
    return null;
  }

  const color = poleColor(fromTerminal?.pole);
  if (wire.breakpoints?.length) {
    const points = [fromRoute.point, ...wire.breakpoints.map((point) => ({ x: point.x, y: point.y })), toRoute.point];
    return {
      d: formatPolyline(points),
      color,
      signature: points.map((point) => `${Math.round(point.x / 4)}:${Math.round(point.y / 4)}`).join("|")
    };
  }

  const boardWidth = board.widthModulesPerRow * MODULE_WIDTH_PX;
  const baseCorridorX = chooseWireCorridor(fromRoute, toRoute, boardOffsetX, boardWidth, workspaceWidth);
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
    color,
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

interface BoardViewProps {
  propertiesOpen: boolean;
}

export function BoardView({ propertiesOpen }: BoardViewProps) {
  const dragIndicatorRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const componentGestureRef = useRef<{
    componentId: string;
    pointerId: number;
    pointerStartX: number;
    pointerStartY: number;
    pointerDownTime: number;
    hasMoved: boolean;
    isDragging: boolean;
    pendingTapComponentId: string | null;
    cleanup: () => void;
    longPressTimer: number | null;
    longPressed: boolean;
  } | null>(null);
  const pointerDragRef = useRef<{
    source: { catalogId?: string; componentId?: string };
    placement: DragPlacement | null;
    overBoard: boolean;
  } | null>(null);
  const cleanupPointerDragRef = useRef<(() => void) | null>(null);
  const cleanupWireBreakpointDragRef = useRef<(() => void) | null>(null);
  const suppressNextComponentClickRef = useRef<string | null>(null);
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
    clickTerminal,
    addWireBreakpoint,
    updateWireBreakpoint
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
  const boardOffsetX = SUPPLY_ZONE_WIDTH_PX;
  const workspaceWidth = boardOffsetX + boardWidth + EXTERNAL_ZONE_WIDTH_PX;
  const wireLaneOffsets = useMemo(() => {
    const groups = new Map<string, string[]>();
    wires.forEach((wire) => {
      const path = wirePath(wire, board, components, workspaceWidth, boardOffsetX);
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
  }, [board, boardOffsetX, components, wires, workspaceWidth]);

  const selectedWireEndpoints = useMemo(() => {
    if (selectedItem?.kind !== "wire") return new Set<string>();
    const wire = wires.find((w) => w.id === (selectedItem as any).id);
    if (!wire) return new Set<string>();
    return new Set([endpointKey(wire.from), endpointKey(wire.to)]);
  }, [selectedItem, wires]);

  const resolveDragPlacement = useCallback(
    (x: number, y: number, catalogItem?: CatalogItem, moving?: BoardComponent): DragPlacement | null => {
      const localX = x - boardOffsetX;

      if (catalogItem) {
        if (catalogItem.placementMode === "free") {
          const size = {
            width: catalogItem.visual.widthPx ?? Math.max(120, catalogItem.moduleWidth * MODULE_WIDTH_PX),
            height: catalogItem.visual.heightPx ?? 28
          };
          const maxLocalWidth = (catalogItem.electricalTemplate.externalLoad ? boardWidth + EXTERNAL_ZONE_WIDTH_PX : boardWidth) - size.width;
          const left = clamp(
            localX - size.width / 2,
            0,
            Math.max(0, maxLocalWidth)
          );
          const top = clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height));
          return {
            layout: { placementMode: "free", x: left, y: top },
            indicator: { left: boardOffsetX + left, top, width: size.width, height: size.height }
          };
        }

        const maxStart = Math.max(0, board.widthModulesPerRow - catalogItem.moduleWidth);
        const startModule = clamp(Math.round(localX / MODULE_WIDTH_PX), 0, maxStart);
        const row = clamp(Math.floor(y / (MODULE_HEIGHT_PX + ROW_GAP)), 0, board.rows.length - 1);
        return {
          layout: { placementMode: "din_module", row, startModule },
          indicator: {
            left: boardOffsetX + startModule * MODULE_WIDTH_PX,
            top: row * (MODULE_HEIGHT_PX + ROW_GAP),
            width: catalogItem.moduleWidth * MODULE_WIDTH_PX,
            height: MODULE_HEIGHT_PX
          }
        };
      }

      if (!moving) {
        return null;
      }

      if (moving.placementMode === "free") {
        const size = componentVisualSize(moving);
        const maxLocalWidth = (moving.electrical.externalLoad ? boardWidth + EXTERNAL_ZONE_WIDTH_PX : boardWidth) - size.width;
        const left = clamp(
          localX - size.width / 2,
          0,
          Math.max(0, maxLocalWidth)
        );
        const top = clamp(y - size.height / 2, 0, Math.max(0, boardHeight - size.height));
        return {
          layout: { placementMode: "free", x: left, y: top },
          indicator: { left: boardOffsetX + left, top, width: size.width, height: size.height }
        };
      }

      const maxStart = Math.max(0, board.widthModulesPerRow - moving.moduleWidth);
      const startModule = clamp(Math.round(localX / MODULE_WIDTH_PX), 0, maxStart);
      const row = clamp(Math.floor(y / (MODULE_HEIGHT_PX + ROW_GAP)), 0, board.rows.length - 1);
      return {
        layout: { placementMode: "din_module", row, startModule },
        indicator: {
          left: boardOffsetX + startModule * MODULE_WIDTH_PX,
          top: row * (MODULE_HEIGHT_PX + ROW_GAP),
          width: moving.moduleWidth * MODULE_WIDTH_PX,
          height: MODULE_HEIGHT_PX
        }
      };
    },
    [board.rows.length, board.widthModulesPerRow, boardHeight, boardOffsetX, boardWidth]
  );

  const showDragIndicator = useCallback((placement: DragPlacement) => {
    if (!dragIndicatorRef.current) {
      return;
    }

    dragIndicatorRef.current.style.display = "block";
    dragIndicatorRef.current.style.left = `${placement.indicator.left}px`;
    dragIndicatorRef.current.style.top = `${placement.indicator.top}px`;
    dragIndicatorRef.current.style.width = `${placement.indicator.width}px`;
    dragIndicatorRef.current.style.height = `${placement.indicator.height}px`;
  }, []);

  const hideDragIndicator = useCallback(() => {
    if (dragIndicatorRef.current) {
      dragIndicatorRef.current.style.display = "none";
    }
  }, []);

  const dragPlacementFromClientPoint = useCallback(
    (clientX: number, clientY: number, source: { catalogId?: string; componentId?: string }) => {
      const workspace = workspaceRef.current;
      if (!workspace) {
        return { overBoard: false, placement: null };
      }

      const rect = workspace.getBoundingClientRect();
      const overBoard =
        clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      if (!overBoard) {
        return { overBoard: false, placement: null };
      }

      const x = (clientX - rect.left) / boardZoom;
      const y = (clientY - rect.top) / boardZoom;
      const catalogItem = source.catalogId ? findCatalogItem(source.catalogId) : undefined;
      const moving = source.componentId ? components.find((component) => component.id === source.componentId) : undefined;

      return { overBoard: true, placement: resolveDragPlacement(x, y, catalogItem, moving) };
    },
    [boardZoom, components, resolveDragPlacement]
  );

  const workspacePointFromClient = useCallback(
    (clientX: number, clientY: number): WireBreakpoint | null => {
      const workspace = workspaceRef.current;
      if (!workspace) {
        return null;
      }

      const rect = workspace.getBoundingClientRect();
      return {
        x: clamp((clientX - rect.left) / boardZoom, 0, workspaceWidth),
        y: clamp((clientY - rect.top) / boardZoom, 0, boardHeight)
      };
    },
    [boardHeight, boardZoom, workspaceWidth]
  );

  const startWireBreakpointDrag = useCallback(
    (wireId: string, index: number, event: ReactPointerEvent<SVGCircleElement>) => {
      event.preventDefault();
      event.stopPropagation();
      cleanupWireBreakpointDragRef.current?.();

      const pointerId = event.pointerId;
      const update = (clientX: number, clientY: number) => {
        const point = workspacePointFromClient(clientX, clientY);
        if (point) {
          updateWireBreakpoint(wireId, index, point);
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        cleanupWireBreakpointDragRef.current = null;
      };

      function onPointerMove(pointerEvent: PointerEvent) {
        if (pointerEvent.pointerId !== pointerId) {
          return;
        }
        pointerEvent.preventDefault();
        update(pointerEvent.clientX, pointerEvent.clientY);
      }

      function onPointerUp(pointerEvent: PointerEvent) {
        if (pointerEvent.pointerId !== pointerId) {
          return;
        }
        pointerEvent.preventDefault();
        cleanup();
      }

      function onPointerCancel(pointerEvent: PointerEvent) {
        if (pointerEvent.pointerId !== pointerId) {
          return;
        }
        cleanup();
      }

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp, { passive: false });
      window.addEventListener("pointercancel", onPointerCancel, { passive: false });
      cleanupWireBreakpointDragRef.current = cleanup;
      update(event.clientX, event.clientY);
    },
    [updateWireBreakpoint, workspacePointFromClient]
  );

  const commitDragPlacement = useCallback(
    (source: { catalogId?: string; componentId?: string }, placement: DragPlacement) => {
      const catalogItem = source.catalogId ? findCatalogItem(source.catalogId) : undefined;
      if (catalogItem) {
        addComponent(catalogItem, placement.layout);
        return;
      }

      if (source.componentId) {
        moveComponent(source.componentId, placement.layout);
        if (propertiesOpen) {
          selectItem({ kind: "component", id: source.componentId });
        }
      }
    },
    [addComponent, moveComponent, propertiesOpen, selectItem]
  );

  const clearActiveDragState = useCallback(() => {
    activeDragState.catalogId = undefined;
    activeDragState.componentId = undefined;
  }, []);

  const beginPointerDrag = useCallback(
    (source: { catalogId?: string; componentId?: string }, pointerId: number, clientX: number, clientY: number) => {
      cleanupPointerDragRef.current?.();

      activeDragState.catalogId = source.catalogId;
      activeDragState.componentId = source.componentId;
      pointerDragRef.current = { source, placement: null, overBoard: false };

      const update = (nextClientX: number, nextClientY: number) => {
        const next = dragPlacementFromClientPoint(nextClientX, nextClientY, source);
        pointerDragRef.current = { source, placement: next.placement, overBoard: next.overBoard };
        if (next.overBoard && next.placement) {
          showDragIndicator(next.placement);
        } else {
          hideDragIndicator();
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        cleanupPointerDragRef.current = null;
      };

      const finish = (event: PointerEvent, commit: boolean) => {
        if (event.pointerId !== pointerId) {
          return;
        }

        event.preventDefault();
        const current = pointerDragRef.current;
        if (commit && current?.overBoard && current.placement) {
          commitDragPlacement(current.source, current.placement);
        }

        pointerDragRef.current = null;
        hideDragIndicator();
        clearActiveDragState();
        cleanup();
      };

      function onPointerMove(event: PointerEvent) {
        if (event.pointerId !== pointerId) {
          return;
        }

        event.preventDefault();
        update(event.clientX, event.clientY);
      }

      function onPointerUp(event: PointerEvent) {
        finish(event, true);
      }

      function onPointerCancel(event: PointerEvent) {
        finish(event, false);
      }

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp, { passive: false });
      window.addEventListener("pointercancel", onPointerCancel, { passive: false });
      cleanupPointerDragRef.current = cleanup;
      update(clientX, clientY);
    },
    [clearActiveDragState, commitDragPlacement, dragPlacementFromClientPoint, hideDragIndicator, showDragIndicator]
  );

  useEffect(
    () => () => {
      componentGestureRef.current?.cleanup();
      cleanupPointerDragRef.current?.();
      cleanupWireBreakpointDragRef.current?.();
    },
    []
  );

  useEffect(() => {
    const onCatalogPointerDragStart = (event: Event) => {
      const detail = (event as CustomEvent<{ catalogId: string; pointerId: number; clientX: number; clientY: number }>)
        .detail;
      if (!detail?.catalogId || !findCatalogItem(detail.catalogId)) {
        return;
      }

      beginPointerDrag({ catalogId: detail.catalogId }, detail.pointerId, detail.clientX, detail.clientY);
    };

    window.addEventListener(CATALOG_POINTER_DRAG_START, onCatalogPointerDragStart);
    return () => window.removeEventListener(CATALOG_POINTER_DRAG_START, onCatalogPointerDragStart);
  }, [beginPointerDrag]);

  const suppressNextComponentClick = useCallback((componentId: string) => {
    suppressNextComponentClickRef.current = componentId;
    window.setTimeout(() => {
      if (suppressNextComponentClickRef.current === componentId) {
        suppressNextComponentClickRef.current = null;
      }
    }, 500);
  }, []);

  const selectComponentFromClick = useCallback(
    (componentId: string) => {
      if (suppressNextComponentClickRef.current === componentId) {
        suppressNextComponentClickRef.current = null;
        return;
      }

      selectItem({ kind: "component", id: componentId });
    },
    [selectItem]
  );

  const startComponentPointerGesture = useCallback(
    (componentId: string, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") {
        return;
      }

      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      componentGestureRef.current?.cleanup();

      const pointerId = event.pointerId;
      const pointerStartX = event.clientX;
      const pointerStartY = event.clientY;

      const cleanup = () => {
        const gesture = componentGestureRef.current;
        if (gesture?.longPressTimer) {
          window.clearTimeout(gesture.longPressTimer);
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        if (componentGestureRef.current?.pointerId === pointerId) {
          componentGestureRef.current = null;
        }
      };

      const startDrag = (clientX: number, clientY: number) => {
        const gesture = componentGestureRef.current;
        if (!gesture || gesture.isDragging) {
          return;
        }

        gesture.isDragging = true;
        gesture.pendingTapComponentId = null;
        suppressNextComponentClick(componentId);
        beginPointerDrag({ componentId }, pointerId, clientX, clientY);
      };

      function onPointerMove(pointerEvent: PointerEvent) {
        const gesture = componentGestureRef.current;
        if (!gesture || pointerEvent.pointerId !== pointerId) {
          return;
        }

        const distance = Math.hypot(pointerEvent.clientX - gesture.pointerStartX, pointerEvent.clientY - gesture.pointerStartY);
        if (distance > dragThresholdPx) {
          gesture.hasMoved = true;
          pointerEvent.preventDefault();
          startDrag(pointerEvent.clientX, pointerEvent.clientY);
        }
      }

      function onPointerUp(pointerEvent: PointerEvent) {
        const gesture = componentGestureRef.current;
        if (!gesture || pointerEvent.pointerId !== pointerId) {
          return;
        }

        const distance = Math.hypot(pointerEvent.clientX - gesture.pointerStartX, pointerEvent.clientY - gesture.pointerStartY);
        const elapsedMs = window.performance.now() - gesture.pointerDownTime;
        const isTap =
          !gesture.isDragging &&
          !gesture.longPressed &&
          !gesture.hasMoved &&
          elapsedMs <= longPressThresholdMs &&
          distance <= dragThresholdPx &&
          gesture.pendingTapComponentId === componentId;

        if (!isTap) {
          suppressNextComponentClick(componentId);
        }
        cleanup();

        if (isTap) {
          pointerEvent.preventDefault();
          suppressNextComponentClick(componentId);
          selectItem({ kind: "component", id: componentId });
        }
      }

      function onPointerCancel(pointerEvent: PointerEvent) {
        if (pointerEvent.pointerId !== pointerId) {
          return;
        }

        suppressNextComponentClick(componentId);
        cleanup();
      }

      const longPressTimer = window.setTimeout(() => {
        const gesture = componentGestureRef.current;
        if (!gesture || gesture.pointerId !== pointerId || gesture.hasMoved || gesture.isDragging) {
          return;
        }

        gesture.longPressed = true;
        gesture.pendingTapComponentId = null;
        suppressNextComponentClick(componentId);
      }, longPressThresholdMs);

      componentGestureRef.current = {
        componentId,
        pointerId,
        pointerStartX,
        pointerStartY,
        pointerDownTime: window.performance.now(),
        hasMoved: false,
        isDragging: false,
        pendingTapComponentId: componentId,
        cleanup,
        longPressTimer,
        longPressed: false
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp, { passive: false });
      window.addEventListener("pointercancel", onPointerCancel, { passive: false });
    },
    [beginPointerDrag, selectItem, suppressNextComponentClick]
  );

  return (
    <section className="h-full min-w-0 overflow-auto bg-[#e7edf3] p-3 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{board.name}</h2>
          <p className="text-xs text-[#667085]">
            {board.rows.length} rz. · {board.widthModulesPerRow} modułów w rzędzie
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      <div className="inline-block rounded bg-[#d9e1ea] p-3 shadow-panel sm:p-5">
        <div style={{ width: workspaceWidth * boardZoom, height: boardHeight * boardZoom }}>
        <div
          ref={workspaceRef}
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

            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / boardZoom;
            const y = (event.clientY - rect.top) / boardZoom;

            const catalogItem = activeDragState.catalogId ? findCatalogItem(activeDragState.catalogId) : undefined;
            const moving = activeDragState.componentId
              ? components.find((component) => component.id === activeDragState.componentId)
              : undefined;
            const placement = resolveDragPlacement(x, y, catalogItem, moving);

            if (placement) {
              showDragIndicator(placement);
            } else {
              hideDragIndicator();
            }
          }}
          onDragLeave={() => {
            hideDragIndicator();
          }}
          onDrop={(event) => {
            event.preventDefault();
            hideDragIndicator();
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / boardZoom;
            const y = (event.clientY - rect.top) / boardZoom;

            const source = {
              catalogId: event.dataTransfer.getData("application/x-catalog-id") || activeDragState.catalogId,
              componentId: event.dataTransfer.getData("application/x-component-id") || activeDragState.componentId
            };
            const catalogItem = source.catalogId ? findCatalogItem(source.catalogId) : undefined;
            const moving = source.componentId ? components.find((component) => component.id === source.componentId) : undefined;
            const placement = resolveDragPlacement(x, y, catalogItem, moving);

            if (placement) {
              commitDragPlacement(source, placement);
            }
            clearActiveDragState();
          }}
        >
          <div
            ref={dragIndicatorRef}
            className="pointer-events-none absolute z-50 hidden rounded border-2 border-dashed border-[#2f80ed] bg-[#2f80ed]/10 transition-all duration-75"
          />
          <div
            className="absolute left-0 top-0 rounded-l border-r border-dashed border-[#aab5c4] bg-[#e6edf4]"
            style={{ width: boardOffsetX, height: boardHeight }}
          >
            <div className="absolute left-3 top-2 text-[10px] font-semibold uppercase text-[#667085]">
              Zasilanie
            </div>
          </div>
          <div
            className="absolute top-0 rounded bg-[#f7f8f9]"
            style={{ left: boardOffsetX, width: boardWidth, height: boardHeight }}
          />
          <div
            className="absolute top-0 border-l border-dashed border-[#aab5c4] bg-[#edf1f4]"
            style={{ left: boardOffsetX + boardWidth, width: EXTERNAL_ZONE_WIDTH_PX, height: boardHeight }}
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
              className="absolute"
              style={{ left: boardOffsetX, top: row.index * (MODULE_HEIGHT_PX + ROW_GAP), width: boardWidth, height: MODULE_HEIGHT_PX }}
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

          <svg className="pointer-events-none absolute inset-0 z-20 overflow-visible" width={workspaceWidth} height={boardHeight}>
            {wires
              .filter((wire) => wire.id !== editingWireId)
              .map((wire) => {
                const path = wirePath(wire, board, components, workspaceWidth, boardOffsetX, wireLaneOffsets.get(wire.id) ?? 0);
                const selected = selectedItem?.kind === "wire" && selectedItem.id === wire.id;
                const strokeWidth = wireStrokeWidth(wire.cable.crossSectionMm2);
                return path ? (
                  <g key={wire.id}>
                    <path
                      d={path.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(12, strokeWidth + 8)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-auto cursor-pointer"
                      style={{ pointerEvents: "stroke" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectItem({ kind: "wire", id: wire.id });
                      }}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        const point = workspacePointFromClient(event.clientX, event.clientY);
                        if (point) {
                          addWireBreakpoint(wire.id, point);
                        }
                      }}
                    />
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.color}
                      strokeWidth={selected ? strokeWidth + 1.25 : strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={selected ? 0.95 : 0.7}
                      className="pointer-events-none"
                    />
                    {selected
                      ? (wire.breakpoints ?? []).map((breakpoint, index) => (
                          <circle
                            key={`${wire.id}-breakpoint-${index}`}
                            cx={breakpoint.x}
                            cy={breakpoint.y}
                            r={6}
                            fill="white"
                            stroke={path.color}
                            strokeWidth={2}
                            className="pointer-events-auto cursor-move"
                            onPointerDown={(event) => startWireBreakpointDrag(wire.id, index, event)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        ))
                      : null}
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
              boardOffsetX={boardOffsetX}
              onSelect={() => selectComponentFromClick(component.id)}
              onPointerDragStart={(event) => startComponentPointerGesture(component.id, event)}
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
