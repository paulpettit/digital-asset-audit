"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isCaptureRoute = pathname.startsWith("/trace-capture");

  if (isCaptureRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="sticky top-0 z-20 flex h-14 items-center border-b border-card-border bg-background/95 px-4 backdrop-blur md:hidden">
        <button
          aria-label="Open modules menu"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-white/5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" />
          Modules
        </button>
        <span className="ml-3 text-sm font-semibold text-white">ChainAudit</span>
      </div>

      <main className="min-h-screen md:ml-64">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
