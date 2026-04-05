"use client";

import { useState, useCallback } from "react";
import Card, { MetricCard } from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { mockRiskControls } from "@/lib/mock-data";
import type { RiskControl } from "@/lib/types";
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  Loader2,
} from "lucide-react";

interface RiskGroup {
  riskId: string;
  riskDescription: string;
  controls: RiskControl[];
}

function groupByRisk(controls: RiskControl[]): RiskGroup[] {
  const map = new Map<string, RiskGroup>();
  for (const c of controls) {
    if (!map.has(c.riskId)) {
      map.set(c.riskId, {
        riskId: c.riskId,
        riskDescription: c.riskDescription,
        controls: [],
      });
    }
    map.get(c.riskId)!.controls.push(c);
  }
  return Array.from(map.values());
}

function getRiskBorderColor(controls: RiskControl[]): string {
  const statuses = controls.map((c) => c.status);
  if (statuses.some((s) => s === "ineffective")) return "border-l-red-500";
  if (statuses.every((s) => s === "effective")) return "border-l-emerald-500";
  return "border-l-amber-500";
}

export default function RisksPage() {
  const [controls, setControls] = useState<RiskControl[]>(mockRiskControls);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [testingControls, setTestingControls] = useState<Set<string>>(
    new Set()
  );

  const riskGroups = groupByRisk(controls);

  const totalRisks = riskGroups.length;
  const totalControls = controls.length;
  const effective = controls.filter((c) => c.status === "effective").length;
  const needsAttention = controls.filter(
    (c) => c.status !== "effective"
  ).length;

  const toggleRisk = useCallback((riskId: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(riskId)) {
        next.delete(riskId);
      } else {
        next.add(riskId);
      }
      return next;
    });
  }, []);

  const runControlTest = useCallback((controlId: string) => {
    setTestingControls((prev) => new Set(prev).add(controlId));
    setTimeout(() => {
      setControls((prev) =>
        prev.map((c) =>
          c.controlId === controlId
            ? {
                ...c,
                status: "effective" as const,
                lastTested: new Date().toISOString().split("T")[0],
              }
            : c
        )
      );
      setTestingControls((prev) => {
        const next = new Set(prev);
        next.delete(controlId);
        return next;
      });
    }, 2000);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Risk &amp; Controls Matrix
        </h1>
        <p className="mt-1 text-sm text-muted">
          Blockchain risk assessment and control effectiveness evaluation
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Risks"
          value={totalRisks}
          icon={<ShieldCheck className="h-5 w-5 text-blue-400" />}
          glow="blue"
        />
        <MetricCard
          title="Controls Tested"
          value={totalControls}
          icon={<CheckCircle2 className="h-5 w-5 text-purple-400" />}
          glow="purple"
        />
        <MetricCard
          title="Effective"
          value={effective}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          glow="green"
        />
        <MetricCard
          title="Needs Attention"
          value={needsAttention}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
          glow="amber"
        />
      </div>

      {/* Risk Accordion */}
      <div className="space-y-3">
        {riskGroups.map((group) => {
          const isExpanded = expandedRisks.has(group.riskId);
          const borderColor = getRiskBorderColor(group.controls);

          return (
            <Card key={group.riskId} className={`border-l-4 ${borderColor} !p-0`}>
              {/* Risk Header */}
              <button
                onClick={() => toggleRisk(group.riskId)}
                className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className={`shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {group.riskId}
                    </span>
                    <span className="text-xs text-muted">
                      {group.controls.length} control
                      {group.controls.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {group.riskDescription}
                  </p>
                </div>
              </button>

              {/* Controls (expanded) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-card-border">
                  {group.controls.map((control, idx) => {
                    const isTesting = testingControls.has(control.controlId);

                    return (
                      <div
                        key={control.id}
                        className={`px-6 py-5 ${
                          idx !== group.controls.length - 1
                            ? "border-b border-card-border"
                            : ""
                        }`}
                      >
                        {/* Control header row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="shrink-0 font-mono text-xs font-semibold text-accent">
                                {control.controlId}
                              </span>
                              <StatusBadge
                                status={
                                  isTesting ? "in_progress" : control.status
                                }
                              />
                            </div>
                            <p className="mt-2 text-sm text-slate-300">
                              {control.controlDescription}
                            </p>
                          </div>
                          <button
                            onClick={() => runControlTest(control.controlId)}
                            disabled={isTesting}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-card-border bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isTesting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            {isTesting ? "Testing..." : "Run Control Test"}
                          </button>
                        </div>

                        {/* Procedure */}
                        <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Test Procedure
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {control.procedureDescription}
                          </p>
                        </div>

                        {/* Meta row */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                          {control.lastTested && (
                            <span>
                              Last tested:{" "}
                              <span className="text-slate-300">
                                {control.lastTested}
                              </span>
                            </span>
                          )}
                          {control.notes && (
                            <span>
                              Notes:{" "}
                              <span className="text-amber-400/80">
                                {control.notes}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
