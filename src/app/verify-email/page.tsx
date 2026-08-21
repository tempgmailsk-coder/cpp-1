import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailPanel } from "@/components/verify-email-panel";
import { ResendVerification } from "@/components/resend-verification";

export const metadata: Metadata = { title: "Verify Email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Email Verification
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {token === "resend"
              ? "Request a new verification link for your email address."
              : "Confirming your email address activates your CPP member profile."}
          </p>
          <div className="mt-8">
            {token === "resend" ? <ResendVerification /> : <VerifyEmailPanel token={token} />}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
