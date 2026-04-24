"use client";

import { useEffect, useState } from "react";
import { BoardView } from "./BoardView";
import { ComponentLibrary } from "./ComponentLibrary";
import { PropertiesPanel } from "./PropertiesPanel";
import { ProjectJsonPanel } from "./ProjectJsonPanel";
import { TechnicalSchemaPanel } from "./TechnicalSchemaPanel";
import { ValidationPanel } from "./ValidationPanel";
import { APP_VERSION } from "@/domain/constants";
import { useBoardStore } from "@/store/useBoardStore";

export function BoardEditor() {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const selectedItem = useBoardStore((state) => state.selectedItem);

  const closeLeftPanel = () => setIsLeftPanelOpen(false);

  useEffect(() => {
    if (!isLeftPanelOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLeftPanel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLeftPanelOpen]);

  useEffect(() => {
    if (selectedItem?.kind === "component" || selectedItem?.kind === "wire") {
      setIsPropertiesOpen(true);
    }
  }, [selectedItem]);

  const editorGridClass = [
    "relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-rows-1",
    isPropertiesOpen
      ? "grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[280px_minmax(0,1fr)_320px]"
      : "grid-rows-[minmax(0,1fr)_48px] lg:grid-cols-[280px_minmax(0,1fr)_48px]"
  ].join(" ");

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#edf1f4] text-[#172033]">
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#c8d1dc] bg-white px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Otwórz menu komponentów"
            onClick={() => setIsLeftPanelOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded border border-[#c8d1dc] bg-white px-3 text-sm font-semibold text-[#172033] transition hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 lg:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ☰
            </span>
            <span>Menu</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-normal">Projektant rozdzielnicy DIN</h1>
            <p className="hidden text-xs text-[#667085] sm:block">MVP do projektowania domowych rozdzielnic</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <TechnicalSchemaPanel />
          <ProjectJsonPanel />
        </div>
      </header>
      <section className="border-b border-[#7f1d1d] bg-[#b91c1c] px-5 py-3 text-white">
        <p className="text-sm font-bold uppercase tracking-normal">
          Uwaga: ta aplikacja nie moze byc uzywana do jakichkolwiek wnioskow, decyzji ani prac elektrycznych.
        </p>
        <p className="mt-1 text-xs font-medium">
          Projekt, walidacja i schematy nie sa certyfikowane ani zweryfikowane technicznie. Wyniki moga byc bledne,
          niekompletne i zawierac halucynacje AI.
        </p>
      </section>

      {isLeftPanelOpen ? (
        <div className="fixed inset-0 z-[60] bg-[#101828]/40 lg:hidden" onClick={closeLeftPanel}>
          <aside
            className="flex h-full w-[min(86vw,320px)] flex-col border-r border-[#c8d1dc] bg-[#f8fafc] shadow-panel"
            aria-label="Menu komponentów"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#d4dce7] px-4">
              <h2 className="text-sm font-semibold">Biblioteka</h2>
              <button
                type="button"
                onClick={closeLeftPanel}
                className="rounded border border-[#c8d1dc] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
              >
                Zamknij
              </button>
            </div>
            <ComponentLibrary
              className="flex-1 border-r-0"
              onComponentDragStart={() => window.setTimeout(closeLeftPanel, 0)}
            />
          </aside>
        </div>
      ) : null}

      <div className={editorGridClass}>
        <ComponentLibrary className="hidden h-full lg:block" />
        <BoardView />
        <PropertiesPanel open={isPropertiesOpen} onToggle={() => setIsPropertiesOpen((value) => !value)} />
      </div>

      <ValidationPanel />
      <div className="fixed bottom-2 right-3 z-50 flex items-center gap-2 text-[10px] font-medium text-[#667085] sm:right-4">
        <a
          href="https://github.com/jan-baranski/rozdzielnica-app"
          target="_blank"
          rel="noreferrer"
          aria-label="Otwórz repozytorium GitHub"
          title="GitHub"
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#c8d1dc] bg-white/90 text-[#172033] shadow-sm transition hover:border-[#98a2b3] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.37 9.37 0 0 1 12 6.94c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
            />
          </svg>
        </a>
        <span className="pointer-events-none select-none">v{APP_VERSION}</span>
      </div>
    </main>
  );
}
