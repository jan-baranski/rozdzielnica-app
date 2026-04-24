"use client";

import { useState } from "react";
import { findValidationDocByIssueCode } from "@/domain/validationDocs";
import { useBoardStore } from "@/store/useBoardStore";
import { ValidationDocsPanel } from "./ValidationDocsPanel";

export function ValidationPanel() {
  const { validationResults, focusIssue } = useBoardStore();
  const [docsOpen, setDocsOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const errorCount = validationResults.filter((issue) => issue.severity === "error").length;
  const warningCount = validationResults.length - errorCount;

  const openDocs = (docId?: string) => {
    setActiveDocId(docId ?? null);
    setDocsOpen(true);
  };

  return (
    <>
      <footer className="h-44 border-t border-[#c8d1dc] bg-white">
        <div className="flex h-10 items-center justify-between border-b border-[#e3e8ef] px-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">Walidacja</h2>
            <button
              onClick={() => openDocs()}
              className="rounded border border-[#c8d1dc] px-2.5 py-1 text-xs font-medium hover:bg-[#f8fafc]"
            >
              Opis walidacji
            </button>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded border border-[#f3b2aa] bg-[#fff4f2] px-2 py-0.5 text-[#b42318]">
              {errorCount} błędów
            </span>
            <span className="rounded border border-[#f7d48b] bg-[#fffbeb] px-2 py-0.5 text-[#946100]">
              {warningCount} ostrzeżeń
            </span>
          </div>
        </div>

        <div className="grid h-[136px] grid-cols-2 gap-3 overflow-y-auto p-3">
          {validationResults.length === 0 ? (
            <div className="col-span-2 rounded border border-[#badfcc] bg-[#f0fdf4] p-3 text-sm text-[#157347]">
              Nie wykryto problemów walidacji.
            </div>
          ) : (
            validationResults.map((issue) => {
              const doc = findValidationDocByIssueCode(issue.code);

              return (
                <article
                  key={`${issue.code}-${issue.message}-${issue.relatedComponents?.join("-") ?? ""}-${issue.relatedWires?.join("-") ?? ""}`}
                  className="rounded border border-[#d4dce7] bg-[#f8fafc] p-3 text-left transition hover:border-[#2f80ed] hover:bg-white"
                >
                  <button onClick={() => focusIssue(issue)} className="w-full text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          issue.severity === "error"
                            ? "rounded bg-[#d92d20] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
                            : "rounded bg-[#fdb022] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#53380a]"
                        }
                      >
                        {issue.severity === "error" ? "błąd" : "ostrzeżenie"}
                      </span>
                      <span className="text-xs font-semibold">{issue.code}</span>
                    </div>
                    <p className="mt-1 text-sm">{issue.message}</p>
                    {issue.suggestion ? <p className="mt-1 text-xs text-[#667085]">{issue.suggestion}</p> : null}
                  </button>
                  {doc ? (
                    <button
                      onClick={() => openDocs(doc.id)}
                      className="mt-2 text-xs font-semibold text-[#2f80ed] hover:underline"
                    >
                      Zobacz jak to działa
                    </button>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </footer>

      <ValidationDocsPanel open={docsOpen} activeDocId={activeDocId} onClose={() => setDocsOpen(false)} />
    </>
  );
}
