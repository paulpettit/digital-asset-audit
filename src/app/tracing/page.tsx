"use client";

import { useState, useMemo } from "react";
import Card from "@/components/Card";
import { GitBranch, ArrowRight, Search, Wallet } from "lucide-react";
import { mockTraces } from "@/lib/mock-data";

const DEPTH_COLORS: Record<number, { bg: string; border: string; text: string; line: string }> = {
  0: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", line: "bg-blue-500/50" },
  1: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", line: "bg-purple-500/50" },
  2: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", line: "bg-amber-500/50" },
};

function getDepthColor(depth: number) {
  return DEPTH_COLORS[depth] ?? DEPTH_COLORS[2];
}

export default function TracingPage() {
  const [searchAddress, setSearchAddress] = useState("");

  // Collect unique wallets and group traces by depth
  const { walletsByDepth, uniqueWallets } = useMemo(() => {
    const wallets = new Map<string, { depths: Set<number>; minDepth: number }>();

    for (const trace of mockTraces) {
      if (!wallets.has(trace.fromWallet)) {
        wallets.set(trace.fromWallet, { depths: new Set(), minDepth: Infinity });
      }
      if (!wallets.has(trace.toWallet)) {
        wallets.set(trace.toWallet, { depths: new Set(), minDepth: Infinity });
      }

      const fromEntry = wallets.get(trace.fromWallet)!;
      fromEntry.depths.add(trace.traceDepth);
      fromEntry.minDepth = Math.min(fromEntry.minDepth, trace.traceDepth);

      const toEntry = wallets.get(trace.toWallet)!;
      toEntry.depths.add(trace.traceDepth);
      toEntry.minDepth = Math.min(toEntry.minDepth, trace.traceDepth + 1);
    }

    // Assign wallets to depth columns based on their role in traces
    const depthMap = new Map<number, string[]>();
    const assigned = new Set<string>();

    // Sort traces by depth to assign wallets layer by layer
    const sortedTraces = [...mockTraces].sort((a, b) => a.traceDepth - b.traceDepth);

    for (const trace of sortedTraces) {
      const fromDepth = trace.traceDepth;
      const toDepth = trace.traceDepth + 1;

      if (!assigned.has(trace.fromWallet)) {
        if (!depthMap.has(fromDepth)) depthMap.set(fromDepth, []);
        depthMap.get(fromDepth)!.push(trace.fromWallet);
        assigned.add(trace.fromWallet);
      }

      if (!assigned.has(trace.toWallet)) {
        if (!depthMap.has(toDepth)) depthMap.set(toDepth, []);
        depthMap.get(toDepth)!.push(trace.toWallet);
        assigned.add(trace.toWallet);
      }
    }

    return { walletsByDepth: depthMap, uniqueWallets: wallets };
  }, []);

  // Filter traces based on search
  const isHighlighted = (wallet: string) => {
    if (!searchAddress.trim()) return false;
    return wallet.toLowerCase().includes(searchAddress.toLowerCase());
  };

  const isTraceHighlighted = (fromWallet: string, toWallet: string) => {
    if (!searchAddress.trim()) return true;
    return isHighlighted(fromWallet) || isHighlighted(toWallet);
  };

  // Build connections for the flow diagram
  const connections = useMemo(() => {
    const conns: { from: string; to: string; amount: number; depth: number }[] = [];
    const seen = new Set<string>();
    for (const trace of mockTraces) {
      const key = `${trace.fromWallet}->${trace.toWallet}`;
      if (seen.has(key)) {
        // Aggregate amount
        const existing = conns.find((c) => c.from === trace.fromWallet && c.to === trace.toWallet);
        if (existing) existing.amount += trace.amount;
      } else {
        seen.add(key);
        conns.push({
          from: trace.fromWallet,
          to: trace.toWallet,
          amount: trace.amount,
          depth: trace.traceDepth,
        });
      }
    }
    return conns;
  }, []);

  const depthLevels = [...walletsByDepth.keys()].sort((a, b) => a - b);

  // Summary stats
  const totalTraces = mockTraces.length;
  const totalVolume = mockTraces.reduce((sum, t) => sum + t.amount, 0);
  const maxDepth = Math.max(...mockTraces.map((t) => t.traceDepth));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Wallet &amp; Transaction Tracing
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Trace transaction flows between entity-controlled wallets
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <GitBranch className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Traces</p>
              <p className="text-xl font-bold text-white">{totalTraces}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Wallet className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Unique Wallets</p>
              <p className="text-xl font-bold text-white">{uniqueWallets.size}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <ArrowRight className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Volume</p>
              <p className="text-xl font-bold text-white">
                {totalVolume.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })} BTC
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Trace Wallet</h2>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Enter wallet name or address to highlight related traces..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
          />
          {searchAddress.trim() && (
            <p className="mt-2 text-xs text-slate-400">
              Showing traces related to &ldquo;{searchAddress}&rdquo; &mdash;{" "}
              {mockTraces.filter((t) => isTraceHighlighted(t.fromWallet, t.toWallet)).length} of {totalTraces} traces match
            </p>
          )}
        </div>
      </Card>

      {/* Visual Flow Diagram */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Transaction Flow</h2>
          <div className="ml-auto flex items-center gap-4">
            {[0, 1, 2].map((depth) => {
              const colors = getDepthColor(depth);
              return (
                <div key={depth} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${colors.bg} border ${colors.border}`} />
                  <span className="text-xs text-slate-500">Depth {depth}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-[700px] items-start gap-6 py-4">
            {depthLevels.map((depth, levelIdx) => {
              const walletsAtDepth = walletsByDepth.get(depth) ?? [];
              const depthColor = getDepthColor(Math.min(depth, 2));

              return (
                <div key={depth} className="flex items-start gap-6">
                  {/* Wallet Nodes Column */}
                  <div className="flex flex-col gap-4">
                    <div className="mb-2 text-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${depthColor.text}`}>
                        Depth {depth}
                      </span>
                    </div>
                    {walletsAtDepth.map((wallet) => {
                      const highlighted = isHighlighted(wallet);
                      const dimmed = searchAddress.trim() && !highlighted;

                      return (
                        <div
                          key={wallet}
                          className={`relative rounded-lg border px-4 py-3 transition-all ${
                            highlighted
                              ? `${depthColor.bg} ${depthColor.border} ring-1 ring-blue-400/30`
                              : dimmed
                                ? "border-slate-700/30 bg-slate-800/20 opacity-40"
                                : `${depthColor.bg} ${depthColor.border}`
                          }`}
                          style={{ minWidth: 140 }}
                        >
                          <div className="flex items-center gap-2">
                            <Wallet className={`h-3.5 w-3.5 ${depthColor.text}`} />
                            <span className="text-xs font-semibold text-white">{wallet}</span>
                          </div>
                          {/* Show outgoing connections */}
                          {connections
                            .filter((c) => c.from === wallet)
                            .map((conn, i) => (
                              <div key={i} className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                                <ArrowRight className="h-2.5 w-2.5" />
                                <span>{conn.to}</span>
                                <span className="ml-auto font-mono text-slate-500">
                                  {conn.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                                </span>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Arrow connector between depth levels */}
                  {levelIdx < depthLevels.length - 1 && (
                    <div className="flex flex-col items-center justify-center self-center gap-2">
                      <div className={`h-0.5 w-10 ${depthColor.line}`} />
                      <ArrowRight className={`h-4 w-4 ${depthColor.text}`} />
                      <div className={`h-0.5 w-10 ${depthColor.line}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Detailed Trace Table */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-white">
          Trace Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  From Wallet
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  To Wallet
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  Transaction ID
                </th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-slate-500">
                  Amount (BTC)
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  Date
                </th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-slate-500">
                  Trace Depth
                </th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500">
                  Change Address
                </th>
              </tr>
            </thead>
            <tbody>
              {mockTraces.map((trace) => {
                const colors = getDepthColor(trace.traceDepth);
                const visible = isTraceHighlighted(trace.fromWallet, trace.toWallet);
                const highlighted =
                  searchAddress.trim() &&
                  (isHighlighted(trace.fromWallet) || isHighlighted(trace.toWallet));

                return (
                  <tr
                    key={trace.id}
                    className={`border-b border-slate-800/50 last:border-0 transition-opacity ${
                      searchAddress.trim() && !visible ? "opacity-20" : ""
                    } ${highlighted ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-medium text-slate-300"
                          style={{ paddingLeft: trace.traceDepth * 12 }}
                        >
                          {trace.fromWallet}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className={`h-3 w-3 ${colors.text}`} />
                        <span className="text-xs font-medium text-slate-300">
                          {trace.toWallet}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-slate-400">
                        {trace.txid}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-xs font-medium text-white">
                        {trace.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 4,
                        })}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-slate-400">{trace.date}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {/* Depth indicator dots */}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: trace.traceDepth + 1 }).map((_, i) => (
                            <span
                              key={i}
                              className={`inline-block h-1.5 w-1.5 rounded-full ${getDepthColor(i).bg} border ${getDepthColor(i).border}`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {trace.traceDepth}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {trace.changeAddress ? (
                        <span className="font-mono text-xs text-slate-500">
                          {trace.changeAddress}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Max depth note */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-700/50 pt-4">
          <GitBranch className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">
            Maximum trace depth: {maxDepth} &mdash; {totalTraces} traces across {uniqueWallets.size} wallets
          </span>
        </div>
      </Card>
    </div>
  );
}
