import { db } from "@/db";
import { applications, positions } from "@/db/schema";
import type { MemberRow, PositionRow } from "@/db/types";
import { and, eq } from "drizzle-orm";
import { computeAge } from "@/lib/auth";

export interface EligibilityResult {
  ok: boolean;
  reasons: string[];
  passed: string[];
}

/**
 * Constitutional eligibility check for a position application.
 * Never overrides the configured appointment method; it only gates
 * whether a member may submit an application.
 */
export async function checkEligibility(
  member: MemberRow,
  position: PositionRow
): Promise<EligibilityResult> {
  const reasons: string[] = [];
  const passed: string[] = [];

  // Membership status
  if (member.membershipStatus !== "active") {
    reasons.push("Your membership is not active (suspended or inactive).");
  } else {
    passed.push("Membership is active.");
  }

  // Email verification
  if (!member.emailVerified) {
    reasons.push("Your email address has not been verified yet.");
  } else {
    passed.push("Email address is verified.");
  }

  // Identity verification
  const rules = position.eligibilityRules ?? {};
  if (rules.requireVerification !== false) {
    if (member.verificationStatus !== "verified") {
      reasons.push("Your identity documents have not been verified by the administrator yet.");
    } else {
      passed.push("Identity documents are verified.");
    }
  }

  // Age
  const minAge = rules.minAgeYears ?? 18;
  const age = member.dateOfBirth ? computeAge(member.dateOfBirth) : 0;
  if (age < minAge) {
    reasons.push(`Minimum age requirement of ${minAge} years is not met.`);
  } else {
    passed.push(`Age requirement met (${age} years).`);
  }

  // State match (state-specific positions)
  if (rules.stateMatch && position.state) {
    if (
      member.state &&
      member.state.trim().toLowerCase() === position.state.trim().toLowerCase()
    ) {
      passed.push(`State requirement met (${position.state}).`);
    } else {
      reasons.push(`This position is open only to members from ${position.state}.`);
    }
  } else if (position.state) {
    if (
      member.state &&
      member.state.trim().toLowerCase() === position.state.trim().toLowerCase()
    ) {
      passed.push(`State requirement met (${position.state}).`);
    }
  }

  // Vacancy
  if (position.vacancyStatus !== "open") {
    reasons.push("This position is not currently accepting applications.");
  } else {
    passed.push("Vacancy is open.");
  }

  // Deadline
  if (
    position.applicationDeadline &&
    new Date(position.applicationDeadline).getTime() < Date.now()
  ) {
    reasons.push("The application deadline for this position has passed.");
  } else {
    passed.push("Application window is open.");
  }

  // Duplicate active application
  const existing = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.memberId, member.id),
        eq(applications.positionId, position.id)
      )
    );
  const active = existing.filter(
    (a) =>
      a.status !== "rejected" && a.status !== "withdrawn" && a.status !== "appointed"
  );
  if (active.length > 0) {
    reasons.push("You already have an active application for this position.");
  } else {
    passed.push("No duplicate active application.");
  }

  return {
    ok: reasons.length === 0,
    reasons,
    passed,
  };
}

export async function getPositionOrThrow(id: number): Promise<PositionRow> {
  const rows = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
  if (!rows[0]) throw new Error("Position not found");
  return rows[0];
}
