"use client";

import { MODULE_HEIGHT_PX, MODULE_WIDTH_PX, ROW_GAP, TERMINAL_HIT_SIZE } from "@/domain/constants";
import type { BoardComponent, Terminal } from "@/domain/types";
import { endpointKey } from "@/domain/connectivityEngine";
import { useBoardStore, activeDragState } from "@/store/useBoardStore";
import { graphicsRegistry } from "./GraphicsRegistry";

function terminalClass(terminal: Terminal): string {
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

function terminalPosition(component: BoardComponent, terminal: Terminal, widthPx: number, heightPx: number) {
  if (component.layout.placementMode === "free") {
    const index = Math.max(0, component.terminals.findIndex((candidate) => candidate.id === terminal.id));
    return {
      left: ((index + 0.5) / component.terminals.length) * widthPx - TERMINAL_HIT_SIZE / 2,
      top: heightPx / 2 - TERMINAL_HIT_SIZE / 2
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
  return {
    left: ((index + 0.5) / sameEdge.length) * widthPx - TERMINAL_HIT_SIZE / 2,
    top:
      terminal.direction === "in"
        ? TERMINAL_HIT_SIZE / 2
        : terminal.direction === "out"
          ? heightPx - TERMINAL_HIT_SIZE * 1.5
          : heightPx / 2 - TERMINAL_HIT_SIZE / 2
  };
}

export function BoardComponentView({
  component,
  visualSrc,
  visualSize,
  selected,
  hasError,
  highlightedTerminals,
  onSelect,
  onTerminalClick
}: {
  component: BoardComponent;
  visualSrc: string;
  visualSize: { width: number; height: number };
  selected: boolean;
  hasError: boolean;
  highlightedTerminals?: Set<string>;
  onSelect: () => void;
  onTerminalClick: (terminalId: string) => void;
}) {
  const pendingTerminal = useBoardStore((state) => state.pendingTerminal);
  const componentEndpoint = (terminalId: string) => ({
    kind: "component_terminal" as const,
    componentId: component.id,
    terminalId
  });
  const left =
    component.layout.placementMode === "din_module"
      ? component.layout.startModule * MODULE_WIDTH_PX
      : component.layout.x;
  const top =
    component.layout.placementMode === "din_module"
      ? component.layout.row * (MODULE_HEIGHT_PX + ROW_GAP)
      : component.layout.y;

  const GraphicsComponent = graphicsRegistry[component.catalogItemId];

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-component-id", component.id);
        event.dataTransfer.effectAllowed = "move";
        activeDragState.componentId = component.id;
        activeDragState.catalogId = undefined;
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className="component-shadow absolute z-30 cursor-move"
      style={{
        width: visualSize.width,
        height: visualSize.height,
        left,
        top
      }}
    >
      <div
        className={[
          "relative h-full w-full rounded-[3px] border bg-white transition",
          selected ? "border-[#2f80ed] ring-2 ring-[#2f80ed]/30" : "border-[#9aa7b8]",
          hasError ? "ring-2 ring-[#d92d20]" : ""
        ].join(" ")}
      >
        <div className="h-full w-full overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:object-fill">
          {GraphicsComponent ? (
            <GraphicsComponent preserveAspectRatio="none" />
          ) : (
            <img src={visualSrc} alt="" className="h-full w-full object-fill" draggable={false} />
          )}
        </div>
        {component.terminals.map((terminal) => {
          const position = terminalPosition(component, terminal, visualSize.width, visualSize.height);
          const endpoint = componentEndpoint(terminal.id);
              const pending =
                pendingTerminal && endpointKey(pendingTerminal) === endpointKey(endpoint);
              const isMoveable = highlightedTerminals?.has(endpointKey(endpoint));
              return (
                <button
                  key={terminal.id}
                  title={`${terminal.label} · ${terminal.pole}`}
                  aria-label={`${component.name} ${terminal.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTerminalClick(terminal.id);
                  }}
                  className={[
                    "absolute z-30 rounded-full border shadow-sm transition-all",
                    terminalClass(terminal),
                    pending ? "ring-2 ring-[#fdb022]" : "",
                    isMoveable ? "ring-4 ring-[#2f80ed] ring-offset-2 ring-offset-white" : ""
                  ].join(" ")}
              style={{
                width: TERMINAL_HIT_SIZE,
                height: TERMINAL_HIT_SIZE,
                left: position.left,
                top: position.top
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
