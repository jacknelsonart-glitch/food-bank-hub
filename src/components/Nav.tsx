"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PUBLIC_LINKS = [
  { href: "/", label: "Find food" },
  { href: "/calendar", label: "Calendar" },
  { href: "/join", label: "Help out" },
];

const STAFF_LINKS = [
  { href: "/intake", label: "Sort donations" },
  { href: "/parcel", label: "Pack a parcel" },
  { href: "/staff", label: "Staff" },
];

export function Nav() {
  const pathname = usePathname();
  const link = ({ href, label }: { href: string; label: string }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${active ? "bg-accent-soft font-semibold text-accent" : "hover:bg-accent-soft"}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
          <Image src="/icon.svg" alt="" width={28} height={28} />
          Food Bank Hub
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1">
          {PUBLIC_LINKS.map(link)}
        </nav>
        <nav aria-label="Staff and volunteers" className="flex flex-wrap gap-1 sm:ml-auto">
          {STAFF_LINKS.map(link)}
        </nav>
      </div>
    </header>
  );
}
