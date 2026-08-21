"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PositionRow } from "@/db/types";
import {
  Card,
  MethodBadge,
  LevelBadge,
  StatusBadge,
  EmptyState,
  TextInput,
  Select,
} from "@/components/ui";
import { formatDate, METHOD_LABELS } from "@/lib/constants";
import type { AppointmentMethod } from "@/db/schema";

export function PositionsList({
  positions,
  isLoggedIn,
}: {
  positions: PositionRow[];
  isLoggedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [method, setMethod] = useState("");
  const [vacancy, setVacancy] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return positions.filter((p) => {
      if (q) {
        const haystack = [
          p.positionName,
          p.wing,
          p.description ?? "",
          (p.responsibilities ?? []).join(" "),
          (p.eligibility ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (level && p.level !== level) return false;
      if (method && p.appointmentMethod !== method) return false;
      if (vacancy === "open" && p.vacancyStatus !== "open") return false;
      if (vacancy === "closed" && p.vacancyStatus !== "closed") return false;
      return true;
    });
  }, [positions, query, level, method, vacancy]);

  return (
    <div className="space-y-5">
      {/* Search & filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <TextInput
            placeholder="Search by position, wing, responsibility…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search positions"
          />
          <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level">
            <option value="">All levels</option>
            <option value="national">National</option>
            <option value="state">State</option>
          </Select>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Filter by appointment method">
            <option value="">All methods</option>
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={vacancy} onChange={(e) => setVacancy(e.target.value)} aria-label="Filter by vacancy">
            <option value="">All vacancies</option>
            <option value="open">Open only</option>
            <option value="closed">Closed only</option>
          </Select>
        </div>
      </Card>

      <p className="text-xs text-neutral-500">
        Showing {filtered.length} of {positions.length} positions
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No positions match your search"
          message="Try different keywords or clear the filters."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <PositionCard key={p.id} position={p} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </div>
  );
}

function PositionCard({
  position,
  isLoggedIn,
}: {
  position: PositionRow;
  isLoggedIn: boolean;
}) {
  const open = position.vacancyStatus === "open";
  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={position.level} />
        <MethodBadge method={position.appointmentMethod} />
        {open ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
            Open
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 ring-1 ring-inset ring-neutral-300">
            Closed
          </span>
        )}
      </div>

      <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-900">
        {position.positionName}
        {position.state ? (
          <span className="ml-2 text-sm font-medium text-neutral-500">— {position.state}</span>
        ) : null}
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {position.wing}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">
        {position.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-xs">
        <div>
          <p className="font-semibold uppercase tracking-wider text-neutral-400">Method</p>
          <p className="mt-0.5 font-medium text-neutral-800">
            {METHOD_LABELS[position.appointmentMethod as AppointmentMethod]}
          </p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider text-neutral-400">Vacancies</p>
          <p className="mt-0.5 font-medium text-neutral-800">{position.vacancies}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider text-neutral-400">Deadline</p>
          <p className="mt-0.5 font-medium text-neutral-800">
            {formatDate(position.applicationDeadline)}
          </p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider text-neutral-400">Status</p>
          <p className="mt-0.5 font-medium text-neutral-800">
            {position.vacancyStatus === "open" ? "Accepting applications" : "Not accepting"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 pt-1">
        <Link
          href={`/positions/${position.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          View Details
        </Link>
        {open ? (
          <Link
            href={
              isLoggedIn
                ? `/dashboard/apply/${position.id}`
                : `/login?next=/dashboard/apply/${position.id}`
            }
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Apply
          </Link>
        ) : (
          <span
            aria-disabled
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            Applications Closed
          </span>
        )}
      </div>
    </Card>
  );
}
