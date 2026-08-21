import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Reset the password for your CPP member account.
          </p>
          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
