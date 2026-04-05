"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import ImportModal from "./ImportModal";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaction Verification", icon: ArrowRightLeft },
  { href: "/balances", label: "Balance Testing", icon: Wallet },
  { href: "/tracing", label: "Wallet Tracing", icon: GitBranch },
  { href: "/risks", label: "Risk & Controls", icon: ShieldCheck },
  { href: "/procedures", label: "Audit Procedures", icon: ClipboardCheck },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-card-border bg-sidebar/95 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-card-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-accent/15">
              <Bitcoin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">ChainAudit</h1>
              <p className="text-[10px] text-muted">Digital Asset Audit Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "border-accent/35 bg-accent/10 text-accent"
                    : "border-transparent text-slate-400 hover:border-card-border hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-card-border p-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/18"
          >
            <FileUp className="h-4 w-4" />
            Import Data
          </button>
        </div>
      </aside>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(data) => {
          console.log("Imported data:", data);
          setShowImportModal(false);
        }}
        title="Import Data"
        expectedColumns={["txid", "from", "to", "value", "date", "type"]}
      />
    </>
  );
}
