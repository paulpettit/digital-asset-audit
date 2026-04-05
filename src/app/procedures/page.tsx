"use client";

import { useState, useMemo } from "react";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { mockProcedures } from "@/lib/mock-data";
import type { ExistenceProcedure } from "@/lib/types";
import {
  ClipboardCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  Calendar,
  Filter,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Blockchain Verification",
  "Transaction Testing",
  "Balance Testing",
  "Wallet Tracing",
  "Existence & Control",
  "Reporting",
] as const;

const STATUS_BORDER: Record<ExistenceProcedure["status"], string> = {
  complete: "border-l-emerald-500",
  in_progress: "border-l-blue-500",
  not_started: "border-l-slate-500",
  blocked: "border-l-orange-500",
};

export default function ProceduresPage() {
  const [procedures, setProcedures] =
    useState<ExistenceProcedure[]>(mockProcedures);
  const [activeTab, setActiveTab] = useState<string>("All");

  const filtered = useMemo(
    () =>
      activeTab === "All"
        ? procedures
        : procedures.filter((p) => p.category === activeTab),
    [procedures, activeTab]
  );

  const completeCount = procedures.filter(
    (p) => p.status === "complete"
  ).length;
  const totalCount = procedures.length;
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; complete: number }> = {};
    for (const p of procedures) {
      if (!counts[p.category]) counts[p.category] = { total: 0, complete: 0 };
      counts[p.category].total++;
      if (p.status === "complete") counts[p.category].complete++;
    }
    return counts;
  }, [procedures]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExistenceProcedure[]>();
    for (const p of filtered) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [filtered]);

  function markComplete(id: string) {
    setProcedures((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "complete" as const,
              completedDate: new Date().toISOString().slice(0, 10),
            }
          : p
      )
    );
  }

  function addEvidence(id: string) {
    const value = prompt("Enter evidence description:");
    if (!value) return;
    setProcedures((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, evidence: p.evidence ? `${p.evidence}; ${value}` : value }
          : p
      )
    );
  }

  function addNote(id: string) {
    const value = prompt("Enter note:");
    if (!value) return;
    setProcedures((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, notes: p.notes ? `${p.notes}; ${value}` : value }
          : p
      )
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Procedures</h1>
        <p className="mt-1 text-sm text-muted">
          Track and manage existence &amp; control verification procedures
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">
              Overall Completion
            </span>
          </div>
          <span className="text-sm font-semibold text-white">
            {completeCount}/{totalCount} ({pct}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {/* Filter Tabs + Category Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            <Filter className="h-4 w-4 text-muted mt-1.5 mr-1" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Procedure Cards grouped by category */}
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-white">{category}</h2>

              {items.map((proc) => (
                <Card
                  key={proc.id}
                  className={`border-l-4 ${STATUS_BORDER[proc.status]} !rounded-l-md`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-white">
                          {proc.procedure}
                        </span>
                        <StatusBadge status={proc.status} />
                      </div>
                      <p className="text-sm text-slate-400">
                        {proc.description}
                      </p>

                      {proc.completedDate && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          Completed {proc.completedDate}
                        </div>
                      )}

                      {proc.evidence && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-500">
                          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            <span className="font-medium text-slate-400">
                              Evidence:
                            </span>{" "}
                            {proc.evidence}
                          </span>
                        </div>
                      )}

                      {proc.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-500">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            <span className="font-medium text-slate-400">
                              Notes:
                            </span>{" "}
                            {proc.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
                      {proc.status !== "complete" && (
                        <button
                          onClick={() => markComplete(proc.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => addEvidence(proc.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <FileText className="h-3 w-3" />
                        Add Evidence
                      </button>
                      <button
                        onClick={() => addNote(proc.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Add Note
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <Card>
              <p className="text-center text-sm text-muted py-8">
                No procedures found for this category.
              </p>
            </Card>
          )}
        </div>

        {/* Category Summary Sidebar */}
        <div className="lg:w-72 shrink-0">
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">
              Category Summary
            </h3>
            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([cat, counts]) => {
                const catPct =
                  counts.total > 0
                    ? Math.round((counts.complete / counts.total) * 100)
                    : 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      activeTab === cat
                        ? "bg-blue-600/10 border border-blue-500/20"
                        : "bg-white/[0.02] border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-300 truncate mr-2">
                        {cat}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {counts.complete}/{counts.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
