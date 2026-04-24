"use client";

import { useMemo } from "react";
import { findCatalogItem } from "@/domain/catalog";
import { resolveEndpoint } from "@/domain/connectivityEngine";
import { useBoardStore } from "@/store/useBoardStore";

interface PropertiesPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function PropertiesPanel({ open, onToggle }: PropertiesPanelProps) {
  const {
    board,
    components,
    wires,
    selectedItem,
    updateBoardSize,
    updateComponentName,
    updateComponentElectrical,
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

  if (!open) {
    return (
      <aside className="flex min-h-0 items-center justify-between border-t border-[#c8d1dc] bg-[#f8fafc] px-3 py-2 lg:h-full lg:flex-col lg:justify-start lg:border-l lg:border-t-0 lg:px-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="Rozwiń panel właściwości"
          title="Rozwiń właściwości"
          className="inline-flex h-8 items-center gap-2 rounded border border-[#c8d1dc] bg-white px-3 text-sm font-semibold text-[#172033] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 lg:h-9 lg:w-9 lg:justify-center lg:px-0"
        >
          <span aria-hidden="true">›</span>
          <span className="lg:hidden">Właściwości</span>
        </button>
        <span className="text-xs text-[#667085] lg:hidden">Zwinięte</span>
      </aside>
    );
  }

  return (
    <aside className="max-h-[38vh] min-h-0 overflow-y-auto border-t border-[#c8d1dc] bg-[#f8fafc] p-4 lg:max-h-none lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Właściwości</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={true}
          aria-label="Zwiń panel właściwości"
          className="rounded border border-[#c8d1dc] bg-white px-2.5 py-1 text-xs font-medium hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
        >
          Zwiń
        </button>
      </div>

      {selectedComponent || selectedWire ? (
        <section className="mt-4 rounded border border-[#d4dce7] bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase text-[#667085]">Akcje</h3>
          {selectedComponent ? (
            <button
              onClick={() => removeComponent(selectedComponent.id)}
              className="w-full rounded border border-[#d92d20] bg-white px-3 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff4f2]"
            >
              Usuń aparat
            </button>
          ) : null}
          {selectedWire ? (
            <button
              onClick={() => removeWire(selectedWire.id)}
              className="w-full rounded border border-[#d92d20] bg-white px-3 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff4f2]"
            >
              Usuń przewód
            </button>
          ) : null}
        </section>
      ) : null}

      {!selectedComponent && !selectedWire && !selectedTerminal ? (
        <div className="mt-4 rounded border border-[#d4dce7] bg-white p-4 text-sm text-[#667085]">
          Wybierz aparat, zacisk, przewód albo pozycję walidacji.
        </div>
      ) : null}

      {selectedComponent ? (
        <div className="mt-4 space-y-4">
          <section className="rounded border border-[#d4dce7] bg-white p-4">
            <label className="block text-xs font-semibold text-[#667085]" htmlFor="component-name">
              Nazwa
            </label>
            <input
              id="component-name"
              value={selectedComponent.name}
              onChange={(event) => updateComponentName(selectedComponent.id, event.target.value)}
              className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm outline-none focus:border-[#2f80ed]"
            />
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <dt className="text-[#667085]">Typ</dt>
              <dd className="font-medium">{selectedComponent.type}</dd>
              <dt className="text-[#667085]">Moduły</dt>
              <dd className="font-medium">{selectedComponent.moduleWidth}M</dd>
              <dt className="text-[#667085]">Rząd</dt>
              <dd className="font-medium">
                {selectedComponent.layout.placementMode === "din_module" ? selectedComponent.layout.row + 1 : "wolny"}
              </dd>
              <dt className="text-[#667085]">Pozycja</dt>
              <dd className="font-medium">
                {selectedComponent.layout.placementMode === "din_module"
                  ? selectedComponent.layout.startModule
                  : `${Math.round(selectedComponent.layout.x)}, ${Math.round(selectedComponent.layout.y)}`}
              </dd>
            </dl>
          </section>

          <section className="rounded border border-[#d4dce7] bg-white p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">Parametry elektryczne</h3>
            {selectedComponent.electrical.ratingA ? (
              <div className="mb-3 flex justify-between gap-3 text-xs">
                <span className="text-[#667085]">Maksymalny prad / rating</span>
                <span className="font-medium">{selectedComponent.electrical.ratingA} A</span>
              </div>
            ) : null}
            {selectedComponent.type === "custom_load" ? (
              <label className="mb-3 block text-xs font-semibold text-[#667085]" htmlFor="component-current">
                Pobor pradu A
                <input
                  id="component-current"
                  type="number"
                  min={0}
                  step={0.1}
                  value={selectedComponent.electrical.currentA ?? 0}
                  onChange={(event) =>
                    updateComponentElectrical(selectedComponent.id, {
                      currentA: Math.max(0, Number(event.target.value) || 0)
                    })
                  }
                  className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
                />
              </label>
            ) : null}
            <dl className="space-y-1 text-xs">
              {Object.entries(selectedComponent.electrical).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-[#667085]">{key}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded border border-[#d4dce7] bg-white p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">Zaciski</h3>
            <div className="space-y-2">
              {selectedComponent.terminals.map((terminal) => (
                <div key={terminal.id} className="rounded border border-[#e3e8ef] px-2 py-1.5 text-xs">
                  <div className="font-medium">{terminal.label}</div>
                  <div className="text-[#667085]">
                    {terminal.role} · {terminal.pole} · {terminal.direction}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {selectedWire ? (
        <div className="mt-4 space-y-4">
          <section className="rounded border border-[#d4dce7] bg-white p-4 text-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase text-[#667085]">Przewód</h3>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[#667085]">Od</dt>
                <dd className="font-medium">
                  {describeEndpoint(selectedWire.from)}
                </dd>
              </div>
              <div>
                <dt className="text-[#667085]">Do</dt>
                <dd className="font-medium">
                  {describeEndpoint(selectedWire.to)}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded border border-[#d4dce7] bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-[#667085]">Parametry kabla</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-[#667085]" htmlFor="wire-type">
                Typ
                <input
                  id="wire-type"
                  value={selectedWire.cable.type}
                  onChange={(event) => updateWireCable(selectedWire.id, { type: event.target.value })}
                  className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
                />
              </label>
              <label className="block text-xs font-semibold text-[#667085]" htmlFor="wire-cross-section">
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
                  className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold text-[#667085]" htmlFor="wire-color">
              Kolor / oznaczenie
              <input
                id="wire-color"
                value={selectedWire.cable.color}
                onChange={(event) => updateWireCable(selectedWire.id, { color: event.target.value })}
                className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
              />
            </label>
          </section>
        </div>
      ) : null}

      {selectedTerminal ? (
        <section className="mt-4 rounded border border-[#d4dce7] bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase text-[#667085]">Zacisk</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#667085]">Etykieta</dt>
              <dd className="font-medium">{selectedTerminal.terminal.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#667085]">Biegun</dt>
              <dd className="font-medium">{selectedTerminal.terminal.pole}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#667085]">Rola</dt>
              <dd className="font-medium">{selectedTerminal.normalizedRole}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {selectedComponent ? (
        <section className="mt-4 rounded border border-[#d4dce7] bg-white p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">Źródło katalogowe</h3>
          <p className="text-xs">
            {findCatalogItem(selectedComponent.catalogItemId)?.manufacturer ?? "Nieznany"} ·{" "}
            {selectedComponent.catalogItemId}
          </p>
        </section>
      ) : null}

      {selectedComponent ? (
        <section className="mt-4 rounded border border-[#d4dce7] bg-white p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">Powiązane problemy</h3>
          <div className="space-y-2">
            {validationResults
              .filter((issue) => issue.relatedComponents?.includes(selectedComponent.id))
              .map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className="rounded border border-[#e3e8ef] px-2 py-1.5 text-xs"
                >
                  <div className={issue.severity === "error" ? "font-semibold text-[#b42318]" : "font-semibold text-[#946100]"}>
                    {issue.code}
                  </div>
                  <p className="text-[#475467]">{issue.message}</p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <section className="mt-4 rounded border border-[#d4dce7] bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase text-[#667085]">Rozmiar rozdzielnicy</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-[#667085]" htmlFor="board-rows">
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
              className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
            />
          </label>
          <label className="block text-xs font-semibold text-[#667085]" htmlFor="board-modules">
            Moduły / rząd
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
              className="mt-1 w-full rounded border border-[#c8d1dc] px-2 py-1.5 text-sm font-medium text-[#172033] outline-none focus:border-[#2f80ed]"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#667085]">
          <span>Pojemność</span>
          <span className="font-semibold text-[#344054]">
            {board.rows.length * board.widthModulesPerRow}M
          </span>
        </div>
      </section>
    </aside>
  );
}
