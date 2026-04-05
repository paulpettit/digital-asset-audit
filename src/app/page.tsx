"use client";

import { useState, useEffect } from "react";
import Card, { MetricCard } from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import {
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  mockTransactions,
  mockBalances,
  mockRiskControls,
  mockProcedures,
} from "@/lib/mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  verified: "#34d399",
  matched: "#34d399",
  pending: "#fbbf24",
  failed: "#f87171",
  unverified: "#94a3b8",
  complete: "#34d399",
  in_progress: "#60a5fa",
  not_started: "#94a3b8",
  blocked: "#fb923c",
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-xl">
      {label && (
        <p className="mb-1 text-xs font-medium text-secondary">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Compute transaction status counts
  const txStatusCounts = mockTransactions.reduce(
    (acc, tx) => {
      acc[tx.status] = (acc[tx.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const verificationData = [
    {
      name: "Verified",
      count: txStatusCounts.verified || 0,
      fill: COLORS.verified,
    },
    {
      name: "Pending",
      count: txStatusCounts.pending || 0,
      fill: COLORS.pending,
    },
    {
      name: "Failed",
      count: txStatusCounts.failed || 0,
      fill: COLORS.failed,
    },
    {
      name: "Unverified",
      count: txStatusCounts.unverified || 0,
      fill: COLORS.unverified,
    },
  ];

  // Compute procedure status counts
  const procStatusCounts = mockProcedures.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const procedureData = [
    {
      name: "Complete",
      value: procStatusCounts.complete || 0,
      color: COLORS.complete,
    },
    {
      name: "In Progress",
      value: procStatusCounts.in_progress || 0,
      color: COLORS.in_progress,
    },
    {
      name: "Not Started",
      value: procStatusCounts.not_started || 0,
      color: COLORS.not_started,
    },
    {
      name: "Blocked",
      value: procStatusCounts.blocked || 0,
      color: COLORS.blocked,
    },
  ];

  const uniqueWallets = new Set<string>();
  mockBalances.forEach((b) => uniqueWallets.add(b.address));

  const recentTx = [...mockTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary">Engagement overview and audit progress</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-card px-3 py-2 text-xs text-secondary">
          <Activity className="h-3.5 w-3.5 text-accent" />
          Updated with latest imported activity
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Transactions"
          value={mockTransactions.length}
          subtitle="Across all wallets"
          icon={<ArrowRightLeft className="h-5 w-5 text-slate-400" />}
        />
        <MetricCard
          title="Verified"
          value={txStatusCounts.verified || 0}
          subtitle={`of ${mockTransactions.length} transactions`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          glow="green"
        />
        <MetricCard
          title="Wallets Tested"
          value={uniqueWallets.size}
          subtitle="Unique addresses"
          icon={<Wallet className="h-5 w-5 text-slate-400" />}
        />
        <MetricCard
          title="Risk Controls"
          value={mockRiskControls.length}
          subtitle={`${mockRiskControls.filter((r) => r.status === "effective").length} effective`}
          icon={<ShieldCheck className="h-5 w-5 text-slate-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
        {/* Verification Progress Bar Chart */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-white">Verification Progress</h2>
          <div className="h-64 min-w-0">
            {chartsReady && <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={verificationData}
                margin={{ top: 6, right: 8, bottom: 0, left: -12 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#b4c2d7", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#b4c2d7", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="count" name="Transactions" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {verificationData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </Card>

        {/* Audit Procedure Status Pie Chart */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-white">Audit Procedure Status</h2>
          <div className="flex h-64 min-w-0 items-center">
            <div className="w-[55%] min-w-0">
              {chartsReady && <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={procedureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {procedureData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-xl">
                          <p
                            className="text-xs"
                            style={{ color: d.payload.color }}
                          >
                            {d.name}: {d.value}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>}
            </div>
            <div className="flex w-[45%] flex-col gap-2.5 pl-2">
              {procedureData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-secondary">{entry.name}</span>
                  <span className="ml-auto text-xs font-semibold text-white">
                    {entry.value}
                  </span>
                </div>
              ))}
              <div className="mt-1 border-t border-card-border pt-2">
                <span className="text-xs text-secondary">
                  {mockProcedures.length} total procedures
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="mb-3 text-base font-semibold text-white">Recent Activity</h2>

        <div className="space-y-2 md:hidden">
          {recentTx.map((tx) => (
            <div key={tx.id} className="rounded-lg border border-card-border bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-white">{tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}</p>
                  <p className="mt-1 text-xs text-secondary">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={tx.status} />
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {tx.valueBTC.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 4,
                })} BTC
              </p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-secondary">TX ID</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-secondary">Amount (BTC)</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-secondary">Date</th>
                <th className="whitespace-nowrap pb-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => (
                <tr key={tx.id} className="border-b border-card-border/80 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                    {tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}
                  </td>
                  <td className="py-3 pr-4 text-xs font-medium text-white">
                    {tx.valueBTC.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="py-3 pr-4 text-xs text-secondary">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="whitespace-nowrap py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
