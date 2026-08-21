import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Member Registration" };
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Member Registration
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Join the Common People&apos;s Party. After registration you will receive a
            Member ID, verify your email, and gain access to the member dashboard.
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
