"use client";

import { BoardView } from "./BoardView";
import { ComponentLibrary } from "./ComponentLibrary";
import { PropertiesPanel } from "./PropertiesPanel";
import { ProjectJsonPanel } from "./ProjectJsonPanel";
import { TechnicalSchemaPanel } from "./TechnicalSchemaPanel";
import { ValidationPanel } from "./ValidationPanel";

export function BoardEditor() {
  return (
    <main className="flex h-screen min-h-[720px] flex-col bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <header className="relative flex h-14 items-center justify-between border-b border-white/5 bg-slate-900/40 px-6 backdrop-blur-md z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Projektant rozdzielnicy</h1>
            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 tracking-tighter">v1.0.0</span>
          </div>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Professional Engineering Tool</p>
        </div>
        <div className="flex items-center gap-3">
          <TechnicalSchemaPanel />
          <ProjectJsonPanel />
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-red-900/30 bg-red-950/20 px-6 py-2 text-red-400">
        <div className="absolute left-0 top-0 h-full w-1 bg-red-600" />
        <p className="text-[10px] font-black uppercase tracking-widest">
          Ostrzeżenie Bezpieczeństwa
        </p>
        <p className="mt-0.5 text-[10px] font-medium leading-relaxed opacity-80">
          Narzędzie poglądowe. Projekty nie są certyfikowane. Wymagana weryfikacja przez uprawnionego elektryka.
        </p>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(520px,1fr)_320px] gap-0">
        <ComponentLibrary />
        <BoardView />
        <PropertiesPanel />
      </div>

      <ValidationPanel />
    </main>
  );
}
