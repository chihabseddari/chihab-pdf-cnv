"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import { Logo } from "./logo";

const LINKS = [
  { href: "/studio", label: "المكتب" },
  { href: "/studio/images", label: "صور إلى PDF" },
  { href: "/studio/merge", label: "دمج PDF" },
  { href: "/studio/split", label: "تقسيم PDF" },
  { href: "/studio/lottery", label: "فحص اليانصيب" },
  { href: "/studio/history", label: "السجل" },
  { href: "/studio/account", label: "الحساب" },
];

export function StudioShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-full lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-line bg-[#0a1524]/95 text-[#e7eef8] backdrop-blur-md lg:min-h-screen lg:border-l">
        <div className="flex items-center justify-between gap-4 px-4 py-5 lg:block lg:px-5 lg:py-7">
          <Logo />
          <p className="mt-0 text-sm text-[#e7eef8]/70 lg:mt-5">مرحبًا {name}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-3">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 px-3 py-2 text-sm ${active ? "bg-stamp text-[#1a120b]" : "text-[#e7eef8]/80 hover:bg-white/10"}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="px-4 pb-5 lg:px-5 lg:pt-8">
          <button className="text-sm text-[#e7eef8]/70 underline-offset-4 hover:underline">خروج</button>
        </form>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
