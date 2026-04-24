"use client";

import { catalogItems } from "@/domain/catalog";
import { activeDragState } from "@/store/useBoardStore";

const categoryLabels: Record<string, string> = {
  Protection: "Zabezpieczenia",
  "Residual current": "Różnicowoprądowe",
  "Surge protection": "Ochrona przepięciowa",
  Switching: "Łączenie",
  Busbars: "Listwy",
  Accessories: "Akcesoria",
  Loads: "Odbiorniki"
};

export function ComponentLibrary() {
  const grouped = catalogItems.reduce<Record<string, typeof catalogItems>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <aside className="overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-5 scrollbar-thin scrollbar-thumb-slate-700">
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Biblioteka aparatów</h2>
        <div className="mt-1 h-1 w-8 rounded-full bg-blue-600" />
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-b border-slate-800 pb-2">
              {categoryLabels[category] ?? category}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-catalog-id", item.id);
                    event.dataTransfer.effectAllowed = "copy";
                    activeDragState.catalogId = item.id;
                    activeDragState.componentId = undefined;
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-800/20 p-3 text-left transition-all hover:border-blue-500/50 hover:bg-slate-800/40 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]"
                >
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 p-1 group-hover:bg-white/10 transition-colors">
                    <img
                      src={item.visual.src}
                      alt=""
                      className="h-full w-full object-contain drop-shadow-md"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.displayName}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 group-hover:text-blue-400/70 transition-colors">
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 border border-slate-700">{item.moduleWidth}M</span>
                      <span className="opacity-50">·</span>
                      <span className="truncate">{item.model}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
