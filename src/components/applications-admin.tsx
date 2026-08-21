"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TextInput, Select, TableWrap, Th, Td, StatusBadge } from "@/components/ui";
import { STATUS_LABELS, formatDateTime } from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";

export interface AdminApplicationItem {
  id: number;
  applicationId: string;
  status: string;
  submittedAt: string;
  memberName: string;
  memberId: string;
  memberState: string | null;
  positionName: string;
  positionLevel: string;
  positionId: number;
}

export function ApplicationsAdminTable({ items }: { items: AdminApplicationItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (q) {
        const hay = [a.applicationId, a.memberName, a.memberId, a.positionName]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status && a.status !== status) return false;
      if (state && (a.memberState ?? "").toLowerCase() !== state.toLowerCase()) return false;
      return true;
    });
  }, [items, query, status, state]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <TextInput
          placeholder="Search application, member, position…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search applications"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <TextInput
          placeholder="Filter by state…"
          value={state}
          onChange={(e) => setState(e.target.value)}
          aria-label="Filter by member state"
        />
      </div>
      <p className="text-xs text-neutral-500">
        {filtered.length} of {items.length} applications
      </p>
      <TableWrap>
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <Th>Application</Th>
              <Th>Member</Th>
              <Th>Position</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((a) => (
              <tr key={a.id} className="transition hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/applications/${a.id}`}
                    className="font-mono font-semibold text-neutral-900 underline underline-offset-2"
                  >
                    {a.applicationId}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={`/admin/members/${a.id}`}
                    className="font-semibold text-neutral-800 underline underline-offset-2"
                  >
                    {a.memberName}
                  </Link>
                  <span className="block text-xs text-neutral-400">
                    {a.memberId} · {a.memberState ?? "—"}
                  </span>
                </Td>
                <Td>{a.positionName}</Td>
                <Td>
                  <StatusBadge status={a.status} />
                </Td>
                <Td className="text-neutral-500">{formatDateTime(a.submittedAt)}</Td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <Td className="py-10 text-center text-neutral-400" >No applications match.</Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export type { ApplicationStatus };
