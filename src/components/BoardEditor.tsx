"use client";

import { BoardView } from "./BoardView";
import { ComponentLibrary } from "./ComponentLibrary";
import { PropertiesPanel } from "./PropertiesPanel";
import { ProjectJsonPanel } from "./ProjectJsonPanel";
import { TechnicalSchemaPanel } from "./TechnicalSchemaPanel";
import { ValidationPanel } from "./ValidationPanel";
import { APP_VERSION } from "@/domain/constants";

export function BoardEditor() {
  return (
    <main className="flex h-screen min-h-[720px] flex-col bg-[#edf1f4] text-[#172033]">
      <header className="flex h-14 items-center justify-between border-b border-[#c8d1dc] bg-white px-5">
        <div>
          <h1 className="text-base font-semibold tracking-normal">Projektant rozdzielnicy DIN</h1>
          <p className="text-xs text-[#667085]">MVP do projektowania domowych rozdzielnic</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/jan-baranski/rozdzielnica-app"
            target="_blank"
            rel="noreferrer"
            aria-label="Otworz repozytorium GitHub"
            title="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#c8d1dc] bg-white text-[#172033] transition hover:border-[#98a2b3] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.37 9.37 0 0 1 12 6.94c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
              />
            </svg>
          </a>
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

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(520px,1fr)_320px] gap-0">
        <ComponentLibrary />
        <BoardView />
        <PropertiesPanel />
      </div>

      <ValidationPanel />
      <div className="fixed bottom-2 right-4 text-[10px] font-medium text-[#667085] pointer-events-none select-none z-50">
        v{APP_VERSION}
      </div>
    </main>
  );
}
