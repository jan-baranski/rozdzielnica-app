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

interface ComponentLibraryProps {
  className?: string;
  onComponentDragStart?: () => void;
}

export function ComponentLibrary({ className = "", onComponentDragStart }: ComponentLibraryProps) {
  const grouped = catalogItems.reduce<Record<string, typeof catalogItems>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <aside className={`min-h-0 overflow-y-auto border-r border-[#c8d1dc] bg-[#f8fafc] p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Biblioteka aparatów</h2>
        <p className="mt-1 text-xs text-[#667085]">Moduły z katalogu ogólnego</p>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">
              {categoryLabels[category] ?? category}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-catalog-id", item.id);
                    event.dataTransfer.effectAllowed = "copy";
                    activeDragState.catalogId = item.id;
                    activeDragState.componentId = undefined;
                    onComponentDragStart?.();
                  }}
                  className="flex w-full items-center gap-3 rounded border border-[#d4dce7] bg-white p-2 text-left shadow-sm transition hover:border-[#2f80ed] hover:bg-[#f4f9ff]"
                >
                  <img
                    src={item.visual.src}
                    alt=""
                    className="h-12 shrink-0 object-contain"
                    style={{ width: item.moduleWidth * 18 }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.displayName}</span>
                    <span className="block text-xs text-[#667085]">{item.moduleWidth}M</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
