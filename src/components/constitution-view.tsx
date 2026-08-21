"use client";

import { useMemo, useState } from "react";
import type { ConstitutionArticleRow } from "@/db/types";
import { Card, TextInput } from "@/components/ui";

export function ConstitutionView({ articles }: { articles: ConstitutionArticleRow[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<number>>(new Set(articles.slice(0, 1).map((a) => a.id)));

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter((a) =>
          [a.title, a.content, a.chapterTitle, a.articleNo]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : articles;

    const map = new Map<number, { title: string; items: ConstitutionArticleRow[] }>();
    for (const a of filtered) {
      const entry = map.get(a.chapterNo) ?? { title: a.chapterTitle, items: [] };
      entry.items.push(a);
      map.set(a.chapterNo, entry);
    }
    return [...map.entries()];
  }, [articles, query]);

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <TextInput
        placeholder="Search the Constitution — articles, chapters, keywords…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the Constitution"
        className="py-3"
      />

      {chapters.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          No articles match “{query}”.
        </Card>
      ) : (
        chapters.map(([chapterNo, chapter]) => (
          <Card key={chapterNo} className="overflow-hidden">
            <div className="border-b border-neutral-200 bg-neutral-900 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Chapter {chapterNo}
              </p>
              <p className="text-sm font-bold text-white">{chapter.title}</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {chapter.items.map((article) => {
                const isOpen = open.has(article.id);
                return (
                  <div key={article.id}>
                    <button
                      type="button"
                      onClick={() => toggle(article.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-neutral-50"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-neutral-900">
                        <span className="mr-2 font-mono text-xs text-neutral-400">
                          {article.articleNo}
                        </span>
                        {article.title}
                      </span>
                      <span
                        className={`text-neutral-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        aria-hidden
                      >
                        ›
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="bg-neutral-50/60 px-5 pb-5 pt-1">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                          {article.content}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
