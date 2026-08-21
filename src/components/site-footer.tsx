import Link from "next/link";
import { Flag, Wordmark } from "@/components/branding";
import { ORG_NAME, TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Wordmark size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">{TAGLINE}</p>
            <div className="mt-3">
              <Flag />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Portal
              </p>
              <ul className="space-y-2 text-neutral-600">
                <li>
                  <Link href="/positions" className="hover:text-neutral-900">
                    View Positions
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-neutral-900">
                    Member Registration
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-neutral-900">
                    Member Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Governance
              </p>
              <ul className="space-y-2 text-neutral-600">
                <li>
                  <Link href="/constitution" className="hover:text-neutral-900">
                    Constitution
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-neutral-900">
                    Member Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-neutral-900">
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} {ORG_NAME}. All rights reserved. Governed by the
          Constitution of the Common People&apos;s Party.
        </div>
      </div>
    </footer>
  );
}
