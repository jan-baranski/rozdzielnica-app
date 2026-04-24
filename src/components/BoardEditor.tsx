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
