"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  validationDocs,
  validationGlobalLimitations,
  validationSeverityDocs
} from "@/domain/validationDocs";

interface ValidationDocsPanelProps {
  open: boolean;
  activeDocId?: string | null;
  onClose: () => void;
}

export function ValidationDocsPanel({ open, activeDocId, onClose }: ValidationDocsPanelProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const activeDoc = useMemo(
    () => validationDocs.find((doc) => doc.id === activeDocId),
    [activeDocId]
  );

  useEffect(() => {
    if (!open || !activeDocId) {
      return;
    }

    window.setTimeout(() => {
      sectionRefs.current[activeDocId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [activeDocId, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#101828]/35">
      <aside className="absolute right-0 top-0 flex h-full w-[620px] max-w-[calc(100vw-24px)] flex-col border-l border-[#b9c4d2] bg-white shadow-panel">
        <div className="border-b border-[#e3e8ef] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Opis walidacji</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Krótkie wyjaśnienie, co aplikacja sprawdza i dlaczego pojawiają się błędy lub ostrzeżenia.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded border border-[#c8d1dc] px-3 py-1.5 text-sm font-medium hover:bg-[#f8fafc]"
            >
              Zamknij
            </button>
          </div>
          {activeDoc ? (
            <div className="mt-3 rounded border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs text-[#1d4ed8]">
              Otwarta sekcja: {activeDoc.title}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-5 rounded border border-[#fecaca] bg-[#fff1f2] p-4">
            <h3 className="text-sm font-semibold text-[#991b1b]">Najważniejsze ograniczenie</h3>
            <p className="mt-2 text-sm text-[#7f1d1d]">
              To jest pomoc edukacyjna, nie projekt instalacji. Wyniki mogą być błędne, niepełne i zbyt uproszczone.
            </p>
          </section>

          <section className="mb-5">
            <h3 className="text-sm font-semibold">Typy komunikatów</h3>
            <div className="mt-2 grid gap-2">
              {validationSeverityDocs.map((item) => (
                <div key={item.label} className="rounded border border-[#d4dce7] bg-[#f8fafc] p-3">
                  <div className="text-xs font-bold">{item.label}</div>
                  <p className="mt-1 text-sm text-[#344054]">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            {validationDocs.map((doc) => (
              <section
                key={doc.id}
                ref={(element) => {
                  sectionRefs.current[doc.id] = element;
                }}
                className={
                  doc.id === activeDocId
                    ? "rounded border border-[#2f80ed] bg-[#f4f9ff] p-4"
                    : "rounded border border-[#d4dce7] bg-white p-4"
                }
              >
                <h3 className="text-sm font-semibold">{doc.title}</h3>
                <p className="mt-2 text-sm text-[#344054]">{doc.description}</p>

                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase text-[#667085]">Przykłady</h4>
                  <ul className="mt-1 space-y-1 text-sm text-[#344054]">
                    {doc.examples.map((example) => (
                      <li key={example}>- {example}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase text-[#667085]">Uproszczone zasady</h4>
                  <ul className="mt-1 space-y-1 text-sm text-[#344054]">
                    {doc.rulesSummary.map((rule) => (
                      <li key={rule}>- {rule}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 rounded border border-[#fde68a] bg-[#fffbeb] p-3">
                  <h4 className="text-xs font-semibold uppercase text-[#946100]">Ograniczenia tej reguły</h4>
                  <ul className="mt-1 space-y-1 text-sm text-[#53380a]">
                    {doc.limitations.map((limitation) => (
                      <li key={limitation}>- {limitation}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5 rounded border border-[#d4dce7] bg-[#f8fafc] p-4">
            <h3 className="text-sm font-semibold">Czego aplikacja jeszcze nie uwzględnia</h3>
            <ul className="mt-2 space-y-1 text-sm text-[#344054]">
              {validationGlobalLimitations.map((limitation) => (
                <li key={limitation}>- {limitation}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold text-[#b42318]">
              Traktuj wyniki jako pomoc, nie jako projekt instalacji.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
