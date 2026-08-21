import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Member Login" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Login</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sign in with your email address or Member ID.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <div className="mt-8">
            <Card className="border-dashed bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
              <p className="font-semibold text-neutral-800">Demo accounts</p>
              <p className="mt-1">
                Super Admin — <code className="rounded bg-white px-1 py-0.5">admin@cpp.org</code> /{" "}
                <code className="rounded bg-white px-1 py-0.5">Admin@2026</code>
              </p>
              <p className="mt-1">
                Member — <code className="rounded bg-white px-1 py-0.5">member@cpp.org</code> /{" "}
                <code className="rounded bg-white px-1 py-0.5">Member@2026</code>
              </p>
              <p className="mt-1">
                Appointment Authority —{" "}
                <code className="rounded bg-white px-1 py-0.5">authority@cpp.org</code> /{" "}
                <code className="rounded bg-white px-1 py-0.5">Admin@2026</code>
              </p>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
