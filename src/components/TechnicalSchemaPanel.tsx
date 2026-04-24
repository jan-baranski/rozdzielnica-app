"use client";

import { useMemo, useState } from "react";
import {
  createTechnicalDesignations,
  formatTechnicalBoardSchema,
  formatTechnicalRating
} from "@/domain/technicalNotation";
import type { BoardComponent, ProjectData } from "@/domain/types";
import { useBoardStore } from "@/store/useBoardStore";

const schematicTypes = new Set<BoardComponent["type"]>(["main_switch", "rcd", "rcbo", "mcb", "spd"]);

function sortedSchematicComponents(components: BoardComponent[]): BoardComponent[] {
  return [...components]
    .filter((component) => schematicTypes.has(component.type))
    .sort((a, b) => {
      const aLayout = a.layout.placementMode === "din_module" ? a.layout : { row: 99, startModule: 99 };
      const bLayout = b.layout.placementMode === "din_module" ? b.layout : { row: 99, startModule: 99 };
      return aLayout.row - bLayout.row || aLayout.startModule - bLayout.startModule || a.name.localeCompare(b.name);
    });
}

function poleCount(component: BoardComponent): number {
  return component.electrical.poles ?? Math.max(1, component.terminals.filter((terminal) => terminal.direction === "out").length);
}

function deviceLabel(component: BoardComponent): string[] {
  const rating = formatTechnicalRating(component);
  if (rating === "-") {
    return [component.name];
  }

  return rating.split(" ").slice(0, 4);
}

function BreakerSymbol({ x, y, kind }: { x: number; y: number; kind: BoardComponent["type"] }) {
  if (kind === "rcd" || kind === "rcbo") {
    return (
      <g>
        <line x1={x - 14} y1={y - 16} x2={x - 14} y2={y + 10} />
        <line x1={x - 14} y1={y + 10} x2={x + 4} y2={y + 10} />
        <ellipse cx={x + 13} cy={y + 10} rx={12} ry={5} fill="white" />
        <line x1={x - 8} y1={y - 9} x2={x + 2} y2={y - 9} />
        <line x1={x - 8} y1={y - 5} x2={x + 2} y2={y - 5} />
      </g>
    );
  }

  if (kind === "main_switch" || kind === "spd") {
    return (
      <g>
        <line x1={x - 12} y1={y - 14} x2={x + 8} y2={y + 14} />
        <line x1={x - 18} y1={y - 2} x2={x - 8} y2={y + 12} />
        <line x1={x - 14} y1={y - 18} x2={x - 6} y2={y - 6} />
        <line x1={x - 21} y1={y - 12} x2={x - 11} y2={y + 2} />
      </g>
    );
  }

  return (
    <g>
      <line x1={x - 12} y1={y - 14} x2={x + 8} y2={y + 14} />
      <path d={`M ${x - 18} ${y - 3} l 9 13 l -6 0 l 9 12`} fill="none" />
      <line x1={x - 21} y1={y - 12} x2={x - 11} y2={y + 2} />
    </g>
  );
}

function OutputSymbol({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y - 20} x2={x} y2={y - 8} />
      <path d={`M ${x - 10} ${y - 8} q 10 -8 20 0`} fill="none" />
      <text x={x + 16} y={y - 9} className="fill-black text-[8px]">
        {label}
      </text>
    </g>
  );
}

function OfficialSchemaPreview({ project }: { project: ProjectData }) {
  const devices = sortedSchematicComponents(project.components);
  const designations = createTechnicalDesignations(project.components);
  const width = Math.max(760, devices.length * 92 + 130);
  const enclosure = { x: 12, y: 22, width: width - 24, height: 360 };
  const topY = 52;
  const deviceTopY = 98;
  const branchY = 210;
  const outputY = 398;
  const leftX = 62;
  const step = devices.length > 1 ? (width - 160) / (devices.length - 1) : 0;
  const xs = devices.map((_, index) => leftX + index * step);

  return (
    <div className="overflow-auto rounded border border-[#c8d1dc] bg-white">
      <svg
        viewBox={`0 0 ${width} 430`}
        className="min-h-[390px] w-full min-w-[760px] font-mono"
        role="img"
        aria-label="Formalny schemat jednokreskowy rozdzielnicy"
      >
        <rect x={enclosure.x} y={enclosure.y} width={enclosure.width} height={enclosure.height} fill="white" stroke="black" strokeDasharray="4 3" />
        <g stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1={leftX} y1={topY} x2={width - 64} y2={topY} />
          <line x1={leftX} y1={branchY} x2={width - 64} y2={branchY} stroke="#19c742" strokeDasharray="4 3" />
          {devices.length === 0 ? (
            <g>
              <text x={width / 2} y={190} textAnchor="middle" className="fill-[#667085] text-[14px]">
                Pusty projekt - dodaj aparaty z biblioteki
              </text>
              <line x1={leftX} y1={topY} x2={leftX} y2={outputY - 36} />
              <circle cx={leftX} cy={topY} r={3} fill="black" />
              <circle cx={leftX} cy={branchY} r={3} fill="black" />
            </g>
          ) : null}
          {devices.map((component, index) => {
            const x = xs[index];
            const poles = poleCount(component);
            const isUpperDevice = component.type === "rcd" || component.type === "main_switch" || component.type === "spd";
            const symbolY = isUpperDevice ? deviceTopY + 30 : deviceTopY + 120;
            const feedY = isUpperDevice ? topY : branchY - 70;
            const outY = isUpperDevice ? branchY : outputY - 46;
            const label = deviceLabel(component);
            const outputLabel = `${component.electrical.ratedCurrentA ?? ""}A`.trim() || `${poles}P`;

            return (
              <g key={component.id}>
                <circle cx={x} cy={feedY} r={3} fill="black" />
                <line x1={x} y1={feedY} x2={x} y2={symbolY - 28} />
                <BreakerSymbol x={x} y={symbolY} kind={component.type} />
                <line x1={x} y1={symbolY + 30} x2={x} y2={outY} />
                <circle cx={x} cy={outY} r={3} fill="black" />
                <text x={x + 18} y={symbolY - 8} className="fill-black text-[9px]">
                  {label[0]}
                </text>
                {label.slice(1, 4).map((line, lineIndex) => (
                  <text key={line} x={x + 18} y={symbolY + 3 + lineIndex * 11} className="fill-black text-[9px]">
                    {line}
                  </text>
                ))}
                <text x={x + 18} y={symbolY + 36} className="fill-black text-[8px]">
                  {designations.get(component.id)}
                </text>
                {!isUpperDevice ? <OutputSymbol x={x} y={outputY} label={`${outputLabel} ${poles}P`} /> : null}
              </g>
            );
          })}
          <g>
            <line x1={leftX - 24} y1={topY + 36} x2={leftX - 24} y2={outputY - 36} />
            <path d={`M ${leftX - 36} ${topY + 86} l 24 -14 l -9 26 l 24 -14`} />
            <OutputSymbol x={leftX - 24} y={outputY} label="IN" />
            <text x={leftX - 16} y={topY + 82} className="fill-black text-[8px]">
              A
            </text>
            <text x={leftX - 15} y={topY + 92} className="fill-black text-[8px]">
              160A
            </text>
          </g>
          <g>
            <line x1={width - 50} y1={topY + 36} x2={width - 50} y2={outputY - 36} />
            <path d={`M ${width - 62} ${topY + 86} l 24 -14 l -9 26 l 24 -14`} />
            <OutputSymbol x={width - 50} y={outputY} label="PEN" />
            <text x={width - 38} y={topY + 82} className="fill-black text-[8px]">
              A
            </text>
            <text x={width - 40} y={topY + 92} className="fill-black text-[8px]">
              160A
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export function TechnicalSchemaPanel() {
  const board = useBoardStore((state) => state.board);
  const components = useBoardStore((state) => state.components);
  const wires = useBoardStore((state) => state.wires);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const schema = useMemo(
    () => formatTechnicalBoardSchema({ board, components, wires }),
    [board, components, wires]
  );
  const project = useMemo(() => ({ board, components, wires }), [board, components, wires]);

  return (
    <div className="relative">
      <button
        title="Pokaz formalny schemat techniczny"
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
        }}
        className="rounded border border-[#c8d1dc] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
      >
        Schemat
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[860px] rounded border border-[#b9c4d2] bg-white p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Formalny schemat techniczny</h2>
            {message ? <span className="text-xs text-[#667085]">{message}</span> : null}
          </div>
          <div className="mb-3 rounded border border-[#facc15] bg-[#fef9c3] px-3 py-2 text-sm font-medium text-[#854d0e]">
            Ta funkcjonalnosc nie dziala poprawnie. Trzeba poprawic prompt generowania schematu.
          </div>
          <OfficialSchemaPreview project={project} />
          <textarea
            value={schema}
            readOnly
            className="mt-3 h-44 w-full resize-none rounded border border-[#c8d1dc] bg-[#f8fafc] p-2 font-mono text-xs leading-5 outline-none focus:border-[#2f80ed]"
            spellCheck={false}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-[#667085]">
            <span>Oznaczenia: QF - wylacznik nadpradowy, QS - rozlacznik, X - listwa/zaciski.</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(schema);
                setMessage("Skopiowano");
              }}
              className="rounded border border-[#2f80ed] bg-[#2f80ed] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#1769d1]"
            >
              Kopiuj
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
