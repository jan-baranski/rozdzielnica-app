"use client";

import { useState } from "react";
import { useBoardStore } from "@/store/useBoardStore";

export function ProjectJsonPanel() {
  const exportProject = useBoardStore((state) => state.exportProject);
  const importProject = useBoardStore((state) => state.importProject);
  const loadEmptyProject = useBoardStore((state) => state.loadEmptyProject);
  const loadDemo = useBoardStore((state) => state.loadDemo);
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          title="Rozpocznij pusty projekt"
          onClick={() => {
            loadEmptyProject();
            setMessage("Pusty projekt");
          }}
          className="rounded border border-[#c8d1dc] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
        >
          Pusty
        </button>
        <button
          title="Wczytaj projekt demo"
          onClick={() => {
            loadDemo();
            setMessage("Demo wczytane");
          }}
          className="rounded border border-[#c8d1dc] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
        >
          Demo
        </button>
        <button
          title="Otwórz panel JSON projektu"
          onClick={() => {
            setJson(exportProject());
            setOpen((value) => !value);
          }}
          className="rounded border border-[#2f80ed] bg-[#2f80ed] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#1769d1]"
        >
          JSON
        </button>
      </div>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[calc(100vw-24px)] max-w-[520px] rounded border border-[#b9c4d2] bg-white p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">JSON projektu</h2>
            {message ? <span className="text-xs text-[#667085]">{message}</span> : null}
          </div>
          <textarea
            value={json}
            onChange={(event) => {
              setJson(event.target.value);
              setMessage("");
            }}
            className="h-72 w-full resize-none rounded border border-[#c8d1dc] bg-[#f8fafc] p-2 font-mono text-xs outline-none focus:border-[#2f80ed]"
            spellCheck={false}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setJson(exportProject());
                setMessage("Eksport odświeżony");
              }}
              className="rounded border border-[#c8d1dc] px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
            >
              Eksportuj
            </button>
            <button
              onClick={() => {
                const result = importProject(json);
                setMessage(result.ok ? "Zaimportowano" : result.error);
              }}
              className="rounded border border-[#157347] bg-[#157347] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#12633d]"
            >
              Importuj
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
