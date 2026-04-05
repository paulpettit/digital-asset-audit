"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  GitBranch,
  ShieldCheck,
  ClipboardCheck,
  Bitcoin,
  FileUp,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaction Verification", icon: ArrowRightLeft },
  { href: "/balances", label: "Balance Testing", icon: Wallet },
  { href: "/tracing", label: "Wallet Tracing", icon: GitBranch },
  { href: "/risks", label: "Risk & Controls", icon: ShieldCheck },
  { href: "/procedures", label: "Audit Procedures", icon: ClipboardCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-card-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-card-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
          <Bitcoin className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">ChainAudit</h1>
          <p className="text-[10px] text-muted">Digital Asset Audit Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Modules
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-card-border p-4">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/20"
        >
          <FileUp className="h-4 w-4" />
          Import Data
        </Link>
      </div>
    </aside>
  );
}
