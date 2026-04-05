"use client";

import { CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type StatusType =
  | "verified"
  | "pending"
  | "failed"
  | "unverified"
  | "matched"
  | "mismatched"
  | "error"
  | "effective"
  | "ineffective"
  | "not_tested"
  | "in_progress"
  | "complete"
  | "not_started"
  | "blocked";

const config: Record<StatusType, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  matched: { label: "Matched", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  effective: { label: "Effective", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  complete: { label: "Complete", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Clock },
  in_progress: { label: "In Progress", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Loader2 },
  unverified: { label: "Unverified", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: AlertTriangle },
  not_tested: { label: "Not Tested", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: Clock },
  not_started: { label: "Not Started", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: Clock },
  failed: { label: "Failed", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  mismatched: { label: "Mismatched", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  ineffective: { label: "Ineffective", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  error: { label: "Error", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
  blocked: { label: "Blocked", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: AlertTriangle },
};

export default function StatusBadge({ status }: { status: StatusType }) {
  const cfg = config[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
