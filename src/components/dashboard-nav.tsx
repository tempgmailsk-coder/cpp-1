"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

const MEMBER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "My Profile" },
  { href: "/positions", label: "Available Positions" },
  { href: "/dashboard/applications", label: "My Applications" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/constitution", label: "Constitution" },
];

export function DashboardNav({
  unread,
  name,
  memberId,
  role,
  photoDocumentId,
}: {
  unread: number;
  name: string;
  memberId: string;
  role: string;
  photoDocumentId: number | null;
}) {
  const pathname = usePathname();
  const isAdmin = role !== "member";

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 md:w-60">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {photoDocumentId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/files/${photoDocumentId}`}
              alt=""
              className="h-10 w-10 rounded-full border border-neutral-200 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900">{name}</p>
            <p className="truncate text-xs text-neutral-500">{memberId}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-row flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-2 md:flex-col md:flex-nowrap">
        {MEMBER_LINKS.map((l) => {
          const active =
            l.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(l.href);
          return (
            <NavLink key={l.href} href={l.href} active={active}>
              {l.label}
              {l.href === "/dashboard/notifications" && unread > 0 ? (
                <span className="ml-auto rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </NavLink>
          );
        })}
        <div className="my-1 border-t border-neutral-200" />
        {isAdmin ? (
          <NavLink href="/admin" active={pathname.startsWith("/admin")}>
            Admin Panel →
          </NavLink>
        ) : null}
        <LogoutButton />
      </nav>

      <Link
        href="/cpp-constitution.pdf"
        target="_blank"
        className="hidden rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-500 transition hover:border-neutral-300 md:block"
      >
        <span className="font-semibold text-neutral-800">Constitution PDF</span>
        <br />
        Open the Absolute Constitution of the CPP.
      </Link>
    </aside>
  );
}
