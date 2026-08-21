"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/ui";

const ROLES = [
  { value: "member", label: "Member" },
  { value: "state_admin", label: "State Administrator" },
  { value: "national_admin", label: "National Administrator" },
  { value: "appointment_authority", label: "Appointment Authority" },
  { value: "super_admin", label: "Super Administrator" },
];

export function MemberDetailActions({
  memberId,
  verificationStatus,
  membershipStatus,
  role,
  canManageRoles,
}: {
  memberId: number;
  verificationStatus: string;
  membershipStatus: string;
  role: string;
  canManageRoles: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [roleValue, setRoleValue] = useState(role);
  const [message, setMessage] = useState<string | null>(null);

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(extra ?? {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Action failed.");
        return;
      }
      setMessage(`Action completed: ${action.replaceAll("_", " ")}.`);
      setShowSuspend(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {verificationStatus !== "verified" ? (
          <button type="button" disabled={busy} onClick={() => act("verify")} className={btnPrimary}>
            ✓ Verify Member
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("reject_verification")}
            className={btnSecondary}
          >
            Reject Verification
          </button>
        )}
        {membershipStatus === "suspended" ? (
          <button type="button" disabled={busy} onClick={() => act("activate")} className={btnPrimary}>
            Activate Membership
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => setShowSuspend((v) => !v)} className={btnDanger}>
            Suspend Member
          </button>
        )}
      </div>

      {showSuspend ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void act("suspend", { reason: String(fd.get("reason") ?? "") });
          }}
          className="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <label className="text-xs font-semibold text-red-800">
            Reason for suspension
            <input
              name="reason"
              className="mt-1 w-full rounded-md border border-red-200 bg-white px-2 py-1.5 text-sm"
              placeholder="e.g. disciplinary review"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              Confirm Suspension
            </button>
            <button
              type="button"
              onClick={() => setShowSuspend(false)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {canManageRoles ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3">
          <label className="text-xs font-semibold text-neutral-700">Role:</label>
          <select
            value={roleValue}
            onChange={(e) => setRoleValue(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || roleValue === role}
            onClick={() => act("set_role", { role: roleValue })}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            Update Role
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
