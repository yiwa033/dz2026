"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menus = [
  { href: "/dashboard", label: "仪表盘" },
  { href: "/rd-reconciliation", label: "研发对账" },
  { href: "/channel-reconciliation", label: "渠道对账" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen grid-cols-[188px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-2">
          <div className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">
            财务对账管理
          </div>
          <nav className="space-y-1">
            {menus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className={cn(
                  "block rounded-sm px-3 py-2 text-sm",
                  pathname.startsWith(menu.href)
                    ? "bg-brand text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {menu.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex min-h-screen flex-col">
          <header className="h-11 border-b border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
            财务对账管理系统
          </header>
          <section className="px-3 py-2">{children}</section>
        </main>
      </div>
    </div>
  );
}
