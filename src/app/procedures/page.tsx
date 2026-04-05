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
  const [inputModal, setInputModal] = useState<{ type: "evidence" | "note"; procedureId: string } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    const proc = procedures.find((p) => p.id === id);
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
    setConfirmCompleteId(null);
    setSuccessMessage(`"${proc?.procedure}" marked as complete.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleInputSubmit() {
    if (!inputModal || !inputValue.trim()) return;
    const { type, procedureId } = inputModal;
    const value = inputValue.trim();
    setProcedures((prev) =>
      prev.map((p) => {
        if (p.id !== procedureId) return p;
        if (type === "evidence") {
          return { ...p, evidence: p.evidence ? `${p.evidence}; ${value}` : value };
        }
        return { ...p, notes: p.notes ? `${p.notes}; ${value}` : value };
      })
    );
    setInputModal(null);
    setInputValue("");
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
                          onClick={() => setConfirmCompleteId(proc.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => { setInputModal({ type: "evidence", procedureId: proc.id }); setInputValue(""); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <FileText className="h-3 w-3" />
                        Add Evidence
                      </button>
                      <button
                        onClick={() => { setInputModal({ type: "note", procedureId: proc.id }); setInputValue(""); }}
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

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Mark Complete Confirmation Dialog */}
      {confirmCompleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmCompleteId(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-2">Confirm Completion</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to mark &ldquo;{procedures.find((p) => p.id === confirmCompleteId)?.procedure}&rdquo; as complete? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmCompleteId(null)}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => markComplete(confirmCompleteId)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Evidence / Add Note Modal */}
      {inputModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setInputModal(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-card-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-4">
              {inputModal.type === "evidence" ? "Add Evidence" : "Add Note"}
            </h2>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputModal.type === "evidence" ? "Enter evidence description..." : "Enter note..."}
              rows={4}
              autoFocus
              className="w-full rounded-lg border border-card-border bg-white/5 px-4 py-3 text-sm text-white placeholder-muted outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center gap-3 justify-end mt-4">
              <button
                onClick={() => setInputModal(null)}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inputModal.type === "evidence" ? (
                  <><FileText className="h-4 w-4" />Add Evidence</>
                ) : (
                  <><MessageSquare className="h-4 w-4" />Add Note</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
