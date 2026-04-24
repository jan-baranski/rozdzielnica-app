"use client";

import { useMemo } from "react";
import { findCatalogItem } from "@/domain/catalog";
import { resolveEndpoint } from "@/domain/connectivityEngine";
import { useBoardStore } from "@/store/useBoardStore";

export function PropertiesPanel() {
  const {
    board,
    components,
    wires,
    selectedItem,
    updateBoardSize,
    updateComponentName,
    removeComponent,
    removeWire,
    updateWireCable,
    validationResults
  } = useBoardStore();

  const selectedComponent = useMemo(
    () =>
      selectedItem?.kind === "component"
        ? components.find((component) => component.id === selectedItem.id)
        : undefined,
    [components, selectedItem]
  );
  const selectedWire = useMemo(
    () => (selectedItem?.kind === "wire" ? wires.find((wire) => wire.id === selectedItem.id) : undefined),
    [selectedItem, wires]
  );
  const selectedTerminal =
    selectedItem?.kind === "terminal"
      ? resolveEndpoint(board, components, selectedItem.endpoint)
      : undefined;
  const describeEndpoint = (endpoint: NonNullable<typeof selectedWire>["from"]) => {
    const resolved = resolveEndpoint(board, components, endpoint);
    return resolved ? `${resolved.ownerName} / ${resolved.terminal.label}` : "Nieznany zacisk";
  };

  return (
    <aside className="overflow-y-auto border-l border-slate-800 bg-slate-900/40 p-6 scrollbar-thin scrollbar-thumb-slate-700">
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Panel Właściwości</h2>
        <div className="mt-1 h-1 w-8 rounded-full bg-blue-600" />
      </div>

      <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-800/20 p-5 backdrop-blur-sm shadow-xl">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Konfiguracja Obudowy</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400" htmlFor="board-rows">
            Rzędy
            <input
              id="board-rows"
              type="number"
              min={1}
              max={8}
              value={board.rows.length}
              onChange={(event) =>
                updateBoardSize({
                  rowCount: Number(event.target.value),
                  modulesPerRow: board.widthModulesPerRow
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-bold text-white outline-none ring-blue-500/20 transition-all focus:border-blue-500/50 focus:ring-4"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400" htmlFor="board-modules">
            Moduły / rz.
            <input
              id="board-modules"
              type="number"
              min={6}
              max={48}
              value={board.widthModulesPerRow}
              onChange={(event) =>
                updateBoardSize({
                  rowCount: board.rows.length,
                  modulesPerRow: Number(event.target.value)
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-bold text-white outline-none ring-blue-500/20 transition-all focus:border-blue-500/50 focus:ring-4"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-[10px] font-bold uppercase tracking-widest">
          <span className="text-slate-500">Suma Modułów</span>
          <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-blue-400">
            {board.rows.length * board.widthModulesPerRow}M
          </span>
        </div>
      </section>

      {!selectedComponent && !selectedWire && !selectedTerminal ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/20 p-8 text-center text-xs text-slate-500">
          <svg className="mb-3 opacity-20" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 13h5"/><path d="M15 9h5"/><path d="M15 17h5"/><rect x="3" y="5" width="12" height="14" rx="2"/></svg>
          Wybierz element na schemacie, aby edytować jego parametry.
        </div>
      ) : null}

      {selectedComponent ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 shadow-xl">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500" htmlFor="component-name">
              Etykieta Aparatu
            </label>
            <input
              id="component-name"
              value={selectedComponent.name}
              onChange={(event) => updateComponentName(selectedComponent.id, event.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm font-bold text-white outline-none ring-blue-500/20 transition-all focus:border-blue-500/50 focus:ring-4"
            />
            <div className="mt-6 grid grid-cols-2 gap-y-4 border-t border-slate-800 pt-6">
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Typ Urządzenia</dt>
                <dd className="mt-1 text-xs font-bold text-slate-200">{selectedComponent.type}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Szerokość</dt>
                <dd className="mt-1 text-xs font-bold text-slate-200">{selectedComponent.moduleWidth} Moduły</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Lokalizacja</dt>
                <dd className="mt-1 text-xs font-bold text-slate-200">
                  {selectedComponent.layout.placementMode === "din_module" ? `Rząd ${selectedComponent.layout.row + 1}` : "Montaż wolny"}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pozycja X,Y</dt>
                <dd className="mt-1 text-xs font-bold text-slate-200">
                  {selectedComponent.layout.placementMode === "din_module"
                    ? `Moduł ${selectedComponent.layout.startModule}`
                    : `${Math.round(selectedComponent.layout.x)}, ${Math.round(selectedComponent.layout.y)}`}
                </dd>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 shadow-xl">
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Parametry Elektryczne</h3>
            <div className="space-y-2">
              {Object.entries(selectedComponent.electrical).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <dt className="text-[9px] font-bold uppercase tracking-tight text-slate-500">{key}</dt>
                  <dd className="text-[10px] font-black text-blue-400 uppercase">{String(value)}</dd>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={() => removeComponent(selectedComponent.id)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-600/10 px-4 py-3 text-xs font-bold text-red-400 transition-all hover:bg-red-600 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            USUŃ APARAT
          </button>
        </div>
      ) : null}

      {selectedWire ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 shadow-xl text-sm">
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Szczegóły Połączenia</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-[10px] font-black text-blue-400">A</div>
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Źródło (Od)</dt>
                  <dd className="mt-1 text-xs font-bold text-slate-200">{describeEndpoint(selectedWire.from)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-[10px] font-black text-blue-400">B</div>
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Cel (Do)</dt>
                  <dd className="mt-1 text-xs font-bold text-slate-200">{describeEndpoint(selectedWire.to)}</dd>
                </div>
              </div>
            </div>
          </section>
          
          <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-5 shadow-xl">
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Parametry Przewodu</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400" htmlFor="wire-type">
                Typ
                <input
                  id="wire-type"
                  value={selectedWire.cable.type}
                  onChange={(event) => updateWireCable(selectedWire.id, { type: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400" htmlFor="wire-cross-section">
                Przekrój mm²
                <input
                  id="wire-cross-section"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={selectedWire.cable.crossSectionMm2}
                  onChange={(event) =>
                    updateWireCable(selectedWire.id, {
                      crossSectionMm2: Number(event.target.value)
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                />
              </label>
            </div>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-tight text-slate-400" htmlFor="wire-color">
              Kolor / Oznaczenie
              <input
                id="wire-color"
                value={selectedWire.cable.color}
                onChange={(event) => updateWireCable(selectedWire.id, { color: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50"
              />
            </label>
          </section>

          <button
            onClick={() => removeWire(selectedWire.id)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-600/10 px-4 py-3 text-xs font-bold text-red-400 transition-all hover:bg-red-600 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            USUŃ PRZEWÓD
          </button>
        </div>
      ) : null}

      {selectedTerminal ? (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-800/30 p-5 shadow-xl">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center text-white">Informacja o Zacisku</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-lg bg-slate-900/40 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Etykieta</span>
              <span className="text-xs font-black text-white">{selectedTerminal.terminal.label}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg bg-slate-900/40 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Biegun</span>
              <span className="text-xs font-black text-blue-400">{selectedTerminal.terminal.pole}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg bg-slate-900/40 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Rola</span>
              <span className="text-[10px] font-bold uppercase text-slate-300">{selectedTerminal.normalizedRole}</span>
            </div>
          </div>
        </section>
      ) : null}

      {selectedComponent ? (
        <section className="mt-6 border-t border-slate-800 pt-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4 text-center">Analiza Błędów</h3>
          <div className="space-y-3">
            {validationResults
              .filter((issue) => issue.relatedComponents?.includes(selectedComponent.id))
              .map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className={`rounded-xl border p-3 text-[11px] leading-relaxed transition-all ${
                    issue.severity === "error" 
                    ? "border-red-900/50 bg-red-600/5 text-red-300" 
                    : "border-amber-900/50 bg-amber-600/5 text-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black uppercase tracking-tighter mb-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${issue.severity === "error" ? "bg-red-500" : "bg-amber-500"}`} />
                    {issue.code}
                  </div>
                  <p className="opacity-80 font-medium">{issue.message}</p>
                </div>
              ))}
            {validationResults.filter((issue) => issue.relatedComponents?.includes(selectedComponent.id)).length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-slate-700 italic text-[10px]">
                 Brak wykrytych nieprawidłowości
              </div>
            )}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
