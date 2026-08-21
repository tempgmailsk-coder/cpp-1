import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { members } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MemberTable, type MemberListItem } from "@/components/member-admin";

export const metadata: Metadata = { title: "Member Management" };
export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  await requireAdmin();

  const rows = await db.select().from(members).orderBy(desc(members.createdAt));

  const items: MemberListItem[] = rows.map((m) => ({
    id: m.id,
    memberId: m.memberId,
    name: m.name,
    email: m.email,
    state: m.state,
    district: m.district,
    verificationStatus: m.verificationStatus,
    membershipStatus: m.membershipStatus,
    role: m.role,
    emailVerified: m.emailVerified,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Member Management
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Search members, review profiles, and manage verification and membership status.
        </p>
      </div>
      <MemberTable members={items} />
    </main>
  );
}
