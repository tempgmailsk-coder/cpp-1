import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Reset Password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
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
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Choose a new password for your account.
          </p>
          <div className="mt-8">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <Alert kind="error">
                This reset link is invalid or has expired.{" "}
                <a href="/forgot-password" className="font-semibold underline underline-offset-2">
                  Request a new one
                </a>
                .
              </Alert>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
