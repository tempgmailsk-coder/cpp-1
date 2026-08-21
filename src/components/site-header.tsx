import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/session";
import { Wordmark, Flag } from "@/components/branding";
import { btnPrimary, btnSecondary } from "@/components/ui";

export async function SiteHeader() {
  const session = await getSession();
  const home = session
    ? isAdminRole(session.role)
      ? "/admin"
      : "/dashboard"
    : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
          <Link href="/positions" className="transition hover:text-neutral-900">
            Positions
          </Link>
          <Link href="/constitution" className="transition hover:text-neutral-900">
            Constitution
          </Link>
          {session ? (
            <Link href={home} className="transition hover:text-neutral-900">
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Flag className="hidden h-2.5 w-14 sm:inline-block" />
          {session ? (
            <Link href={home} className={btnPrimary}>
              {isAdminRole(session.role) ? "Admin Panel" : "My Dashboard"}
            </Link>
          ) : (
            <>
              <Link href="/login" className={btnSecondary}>
                Login
              </Link>
              <Link href="/register" className={btnPrimary}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
