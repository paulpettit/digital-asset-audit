"use client";

import { useState, useCallback } from "react";
import Card, { MetricCard } from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { mockBalances } from "@/lib/mock-data";
import type { WalletBalance } from "@/lib/types";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatBTC(value: number): string {
  return `${value.toFixed(4)} BTC`;
}

function formatVariance(variance: number | null): string {
  if (variance === null) return "—";
  if (variance === 0) return "0.0000";
  const sign = variance > 0 ? "+" : "";
  return `${sign}${variance.toFixed(4)}`;
}

export default function BalancesPage() {
  const [balances, setBalances] = useState<WalletBalance[]>(mockBalances);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [runningAll, setRunningAll] = useState(false);

  const matchedCount = balances.filter((b) => b.status === "matched").length;
  const mismatchedCount = balances.filter((b) => b.status === "mismatched").length;
  const pendingCount = balances.filter((b) => b.status === "pending").length;

  const checkBalance = useCallback(
    (id: string): Promise<void> => {
      return new Promise((resolve) => {
        setLoadingIds((prev) => new Set(prev).add(id));

        setTimeout(() => {
          setBalances((prev) =>
            prev.map((b) => {
              if (b.id !== id) return b;
              const actual = b.expectedBalance;
              const variance = actual - b.expectedBalance;
              return {
                ...b,
                actualBalance: actual,
                variance,
                status: variance === 0 ? "matched" : "mismatched",
              } as WalletBalance;
            })
          );
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          resolve();
        }, 1500);
      });
    },
    []
  );

  const runAllChecks = useCallback(async () => {
    setRunningAll(true);
    const pending = balances.filter((b) => b.status === "pending");
    for (const b of pending) {
      await checkBalance(b.id);
    }
    setRunningAll(false);
  }, [balances, checkBalance]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Year-End Balance Testing
          </h1>
          <p className="mt-1 text-sm text-muted">
            Reconcile reported wallet balances against blockchain state
          </p>
        </div>
        <button
          onClick={runAllChecks}
          disabled={runningAll || pendingCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runningAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Run All Balance Checks
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Wallets"
          value={balances.length}
          icon={<Wallet className="h-5 w-5 text-blue-400" />}
          glow="blue"
        />
        <MetricCard
          title="Matched"
          value={matchedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          glow="green"
        />
        <MetricCard
          title="Mismatched"
          value={mismatchedCount}
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          glow="red"
        />
        <MetricCard
          title="Pending"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          glow="amber"
        />
      </div>

      {/* Balance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-muted">
                <th className="pb-3 pr-4">Wallet Address</th>
                <th className="pb-3 pr-4">Seed Label</th>
                <th className="pb-3 pr-4 text-right">Expected Balance</th>
                <th className="pb-3 pr-4 text-right">Actual Balance</th>
                <th className="pb-3 pr-4 text-right">Variance</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {balances.map((balance) => {
                const isLoading = loadingIds.has(balance.id);
                const varianceNonZero =
                  balance.variance !== null && balance.variance !== 0;

                return (
                  <tr
                    key={balance.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-4 pr-4">
                      <code className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
                        {truncateAddress(balance.address)}
                      </code>
                    </td>
                    <td className="py-4 pr-4 text-slate-300">
                      {balance.seedLabel}
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-slate-300">
                      {formatBTC(balance.expectedBalance)}
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-slate-300">
                      {balance.actualBalance !== null
                        ? formatBTC(balance.actualBalance)
                        : "—"}
                    </td>
                    <td
                      className={`py-4 pr-4 text-right font-mono ${
                        varianceNonZero ? "text-red-400" : "text-slate-500"
                      }`}
                    >
                      {formatVariance(balance.variance)}
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={balance.status} />
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => checkBalance(balance.id)}
                        disabled={isLoading || runningAll}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Check Balance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
