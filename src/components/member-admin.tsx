"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TextInput, Select, TableWrap, Th, Td, StatusBadge } from "@/components/ui";
import {
  VERIFICATION_LABELS,
  MEMBERSHIP_LABELS,
  ROLE_LABELS,
  formatDateTime,
} from "@/lib/constants";

export interface MemberListItem {
  id: number;
  memberId: string;
  name: string;
  email: string;
  state: string | null;
  district: string | null;
  verificationStatus: string;
  membershipStatus: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export function MemberTable({ members }: { members: MemberListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [suspendId, setSuspendId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (q) {
        const hay = [m.name, m.memberId, m.email, m.state ?? "", m.district ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status === "pending" && m.verificationStatus !== "pending") return false;
      if (status === "verified" && m.verificationStatus !== "verified") return false;
      if (status === "suspended" && m.membershipStatus !== "suspended") return false;
      if (status === "unverified_email" && m.emailVerified) return false;
      return true;
    });
  }, [members, query, status]);

  async function act(memberId: number, action: string, extra?: Record<string, unknown>) {
    if (busyIds.has(memberId)) return;
    setBusyIds((prev) => new Set(prev).add(memberId));
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(extra ?? {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Action failed.");
      }
      router.refresh();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <TextInput
          placeholder="Search by name, member ID, email, state…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search members"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter members">
          <option value="">All members</option>
          <option value="pending">Verification pending</option>
          <option value="verified">Verified</option>
          <option value="suspended">Suspended</option>
          <option value="unverified_email">Email unverified</option>
        </Select>
      </div>

      <p className="text-xs text-neutral-500">
        {filtered.length} of {members.length} members
      </p>

      <TableWrap>
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <Th>Member</Th>
              <Th>Location</Th>
              <Th>Verification</Th>
              <Th>Status</Th>
              <Th>Role</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((m) => (
              <tr key={m.id} className="align-top transition hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="font-semibold text-neutral-900 underline underline-offset-2"
                  >
                    {m.name}
                  </Link>
                  <span className="block font-mono text-xs text-neutral-400">{m.memberId}</span>
                  <span className="block text-xs text-neutral-500">
                    {m.email}
                    {!m.emailVerified ? " · email unverified" : ""}
                  </span>
                </Td>
                <Td>
                  {m.state ?? "—"}
                  <span className="block text-xs text-neutral-400">{m.district ?? ""}</span>
                </Td>
                <Td>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      m.verificationStatus === "verified"
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-300"
                        : m.verificationStatus === "rejected"
                          ? "bg-red-50 text-red-700 ring-red-300"
                          : "bg-amber-50 text-amber-800 ring-amber-300"
                    }`}
                  >
                    {VERIFICATION_LABELS[m.verificationStatus] ?? m.verificationStatus}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      m.membershipStatus === "suspended"
                        ? "bg-red-50 text-red-700 ring-red-300"
                        : "bg-emerald-50 text-emerald-800 ring-emerald-300"
                    }`}
                  >
                    {MEMBERSHIP_LABELS[m.membershipStatus] ?? m.membershipStatus}
                  </span>
                </Td>
                <Td className="text-xs">{ROLE_LABELS[m.role] ?? m.role}</Td>
                <Td className="text-xs text-neutral-500">{formatDateTime(m.createdAt)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {m.verificationStatus !== "verified" ? (
                      <MiniBtn
                        onClick={() => act(m.id, "verify")}
                        busy={busyIds.has(m.id)}
                        label="Verify"
                        tone="dark"
                      />
                    ) : null}
                    {m.membershipStatus === "suspended" ? (
                      <MiniBtn
                        onClick={() => act(m.id, "activate")}
                        busy={busyIds.has(m.id)}
                        label="Activate"
                        tone="green"
                      />
                    ) : (
                      <MiniBtn
                        onClick={() => setSuspendId(m.id)}
                        busy={busyIds.has(m.id)}
                        label="Suspend"
                        tone="red"
                      />
                    )}
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      View
                    </Link>
                  </div>
                  {suspendId === m.id ? (
                    <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                      <p className="text-xs font-semibold text-neutral-700">
                        Reason for suspension (optional)
                      </p>
                      <input
                        id={`reason-${m.id}`}
                        className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
                        placeholder="e.g. disciplinary review"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const reason = (
                              document.getElementById(`reason-${m.id}`) as HTMLInputElement
                            )?.value;
                            void act(m.id, "suspend", { reason });
                            setSuspendId(null);
                          }}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Confirm Suspend
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspendId(null)}
                          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </Td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <Td className="py-10 text-center text-neutral-400" >No members match the filter.</Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function MiniBtn({
  onClick,
  busy,
  label,
  tone,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  tone: "dark" | "red" | "green";
}) {
  const tones = {
    dark: "bg-neutral-900 text-white hover:bg-neutral-700",
    red: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    green: "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${tones[tone]}`}
    >
      {busy ? "…" : label}
    </button>
  );
}
