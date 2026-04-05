"use client";

import Card, { MetricCard } from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import {
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  CheckCircle2,
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
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      {label && (
        <p className="mb-1 text-xs font-medium text-slate-300">{label}</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Engagement overview and audit progress
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Verification Progress Bar Chart */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-white">
            Verification Progress
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={verificationData}
                margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="count" name="Transactions" radius={[6, 6, 0, 0]}>
                  {verificationData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Audit Procedure Status Pie Chart */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-white">
            Audit Procedure Status
          </h2>
          <div className="flex h-64 items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={220}>
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
                        <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
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
              </ResponsiveContainer>
            </div>
            <div className="flex w-1/2 flex-col gap-3 pl-2">
              {procedureData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-400">{entry.name}</span>
                  <span className="ml-auto text-xs font-semibold text-white">
                    {entry.value}
                  </span>
                </div>
              ))}
              <div className="mt-1 border-t border-slate-700 pt-2">
                <span className="text-xs text-slate-500">
                  {mockProcedures.length} total procedures
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-white">
          Recent Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  TX ID
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  Amount (BTC)
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  Date
                </th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-slate-800/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                    {tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}
                  </td>
                  <td className="py-3 pr-4 text-xs text-white">
                    {tx.valueBTC.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-400">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3">
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
