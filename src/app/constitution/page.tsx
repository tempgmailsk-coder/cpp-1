import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConstitutionView } from "@/components/constitution-view";
import { db } from "@/db";
import { constitutionArticles } from "@/db/schema";
import { asc } from "drizzle-orm";
import {
  CONSTITUTION_TITLE,
  CONSTITUTION_VERSION,
  CONSTITUTION_PDF_PATH,
} from "@/lib/constants";

export const metadata: Metadata = { title: "Constitution" };
export const dynamic = "force-dynamic";

export default async function ConstitutionPage() {
  const articles = await db
    .select()
    .from(constitutionArticles)
    .orderBy(asc(constitutionArticles.sortOrder), asc(constitutionArticles.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Common People&apos;s Party (CPP)
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            CPP Constitution
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{CONSTITUTION_TITLE}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-600">
              {CONSTITUTION_VERSION}
            </span>
            <span className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-600">
              {articles.length} articles
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-neutral-600">
            The Absolute Constitution of the Common People&apos;s Party is the comprehensive
            operational and governance framework of the party. It defines the organizational
            structure, the constitutional positions at the national and state levels, the
            appointment and electoral methods, and the accountability obligations of every
            office holder. Every position on this portal is derived from its provisions.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={CONSTITUTION_PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Open PDF
            </a>
            <a
              href={CONSTITUTION_PDF_PATH}
              download="CPP-Constitution.pdf"
              className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              Download PDF
            </a>
          </div>

          <div className="mt-10">
            <ConstitutionView articles={articles} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
