"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/members", label: "Member Management" },
  { href: "/admin/positions", label: "Position Management" },
  { href: "/admin/applications", label: "Application Management" },
  { href: "/admin/appointments", label: "Appointment Management" },
  { href: "/admin/emails", label: "Email Outbox" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export function AdminNav({ name, memberId }: { name: string; memberId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 md:w-60">
      <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Administration
        </p>
        <p className="mt-1 truncate text-sm font-bold text-white">{name}</p>
        <p className="truncate font-mono text-xs text-neutral-400">{memberId}</p>
      </div>

      <nav className="flex flex-row flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-2 md:flex-col md:flex-nowrap">
        {LINKS.map((l) => {
          const active =
            l.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(l.href);
          return (
            <NavLink key={l.href} href={l.href} active={active}>
              {l.label}
            </NavLink>
          );
        })}
        <div className="my-1 border-t border-neutral-200" />
        <NavLink href="/dashboard">Member View →</NavLink>
        <LogoutButton />
      </nav>

      <div className="hidden rounded-xl border border-neutral-200 bg-white p-4 text-xs leading-relaxed text-neutral-500 md:block">
        Every administrative action is recorded in the audit log. Official appointment
        emails can only be triggered by authorized appointment authorities.
      </div>
    </aside>
  );
}

export function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-neutral-800 underline underline-offset-2 hover:text-neutral-950">
      {children}
    </Link>
  );
}
