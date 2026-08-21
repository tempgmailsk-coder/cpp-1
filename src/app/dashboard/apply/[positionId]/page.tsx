import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkEligibility } from "@/lib/eligibility";
import { ApplyForm } from "@/components/apply-form";
import { Card, MethodBadge, LevelBadge, Alert, btnSecondary } from "@/components/ui";
import { METHOD_LABELS } from "@/lib/constants";
import type { AppointmentMethod } from "@/db/schema";

export const metadata: Metadata = { title: "Apply for Position" };
export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const member = await requireMember();
  const { positionId } = await params;
  const id = Number(positionId);
  if (!Number.isInteger(id)) notFound();

  const rows = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
  const position = rows[0];
  if (!position) notFound();

  const eligibility = await checkEligibility(member, position);

  return (
    <main>
      <Link
        href={`/positions/${position.id}`}
        className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
      >
        ← Back to Position
      </Link>
      <div className="mt-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={position.level} />
          <MethodBadge method={position.appointmentMethod} />
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Apply — {position.positionName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Selection method: {METHOD_LABELS[position.appointmentMethod as AppointmentMethod]}
          {position.constitutionalReference ? ` · ${position.constitutionalReference}` : ""}
        </p>
      </div>

      {/* Eligibility check */}
      <Card className="mb-8 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Eligibility Check
        </h2>
        {eligibility.ok ? (
          <div className="mt-3">
            <Alert kind="success">
              <p className="font-semibold">You are eligible to apply for this position.</p>
            </Alert>
            <ul className="mt-3 grid gap-1.5 text-xs text-neutral-600 sm:grid-cols-2">
              {eligibility.passed.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-3">
            <Alert kind="error">
              <p className="font-semibold">You are not currently eligible to apply.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {eligibility.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Alert>
            <div className="mt-4">
              <Link href="/positions" className={btnSecondary}>
                Browse Other Positions
              </Link>
            </div>
          </div>
        )}
      </Card>

      {eligibility.ok ? (
        <ApplyForm
          positionId={position.id}
          positionName={position.positionName}
          member={{
            name: member.name,
            memberId: member.memberId,
            state: member.state ?? "",
            district: member.district ?? "",
            education: member.education ?? "",
            profession: member.profession ?? "",
            skills: member.skills ?? "",
            previousExperience: member.previousExperience,
          }}
        />
      ) : null}
    </main>
  );
}
