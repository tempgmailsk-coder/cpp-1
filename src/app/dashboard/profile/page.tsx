import type { Metadata } from "next";
import { requireMember } from "@/lib/session";
import { ProfileForm, ChangePasswordForm } from "@/components/profile-form";
import { Card, KV } from "@/components/ui";
import {
  VERIFICATION_LABELS,
  MEMBERSHIP_LABELS,
  ROLE_LABELS,
  formatDate,
} from "@/lib/constants";

export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const member = await requireMember();

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your member record as stored with the CPP.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          {member.photoDocumentId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/files/${member.photoDocumentId}`}
              alt="Profile"
              className="h-20 w-20 rounded-full border-2 border-neutral-200 object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-xl font-bold text-neutral-900">{member.name}</p>
            <p className="font-mono text-sm text-neutral-500">{member.memberId}</p>
            <p className="mt-1 text-sm text-neutral-600">{member.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-neutral-100 pt-6 sm:grid-cols-4">
          <KV label="Verification" value={VERIFICATION_LABELS[member.verificationStatus] ?? member.verificationStatus} />
          <KV label="Membership" value={MEMBERSHIP_LABELS[member.membershipStatus] ?? member.membershipStatus} />
          <KV label="Role" value={ROLE_LABELS[member.role] ?? member.role} />
          <KV label="Joined" value={formatDate(member.createdAt)} />
          <KV label="Date of Birth" value={formatDate(member.dateOfBirth)} />
          <KV label="Gender" value={member.gender ? member.gender[0]!.toUpperCase() + member.gender.slice(1) : "—"} />
          <KV label="Phone" value={member.phone ?? "—"} />
          <KV label="Constituency" value={member.constituency ?? "—"} />
        </dl>

        {member.suspendedReason ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            <strong>Suspension reason:</strong> {member.suspendedReason}
          </p>
        ) : null}
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-neutral-900">
          Edit Profile
        </h2>
        <ProfileForm
          data={{
            phone: member.phone ?? "",
            state: member.state ?? "",
            district: member.district ?? "",
            constituency: member.constituency ?? "",
            address: member.address ?? "",
            education: member.education ?? "",
            profession: member.profession ?? "",
            skills: member.skills ?? "",
            previousExperience: member.previousExperience ?? "",
            otpEnabled: member.otpEnabled,
          }}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-neutral-900">
          Account Security
        </h2>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
