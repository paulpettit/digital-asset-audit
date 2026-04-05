"use client";

import { useState } from "react";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { mockTransactions } from "@/lib/mock-data";
import { Transaction } from "@/lib/types";
import {
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Copy,
} from "lucide-react";

function truncateAddress(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [verifyingTx, setVerifyingTx] = useState<Transaction | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      searchQuery === "" ||
      tx.txid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
    }
  }

  function handleVerifySelected() {
    const count = selectedIds.size;
    setTransactions((prev) =>
      prev.map((tx) =>
        selectedIds.has(tx.id) ? { ...tx, status: "verified" as const, blockConfirmations: tx.blockConfirmations ?? 1 } : tx
      )
    );
    setSelectedIds(new Set());
    setShowVerifyConfirm(false);
    setSuccessMessage(`${count} transaction${count > 1 ? "s" : ""} verified successfully.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleVerifyOnBlockchain() {
    if (!verifyingTx) return;
    setIsVerifying(true);
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === verifyingTx.id
            ? {
                ...tx,
                status: "verified" as const,
                blockConfirmations: tx.blockConfirmations ?? 6,
              }
            : tx
        )
      );
      setVerifyingTx((prev) =>
        prev
          ? {
              ...prev,
              status: "verified" as const,
              blockConfirmations: prev.blockConfirmations ?? 6,
            }
          : null
      );
      setIsVerifying(false);
    }, 2000);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Transaction Verification
        </h1>
        <p className="mt-1 text-sm text-muted">
          Verify blockchain transactions against reported records
        </p>
      </div>

      {/* Search / Filter Bar */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by transaction ID or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-muted outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-card-border bg-white/5 py-2 pl-10 pr-8 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowVerifyConfirm(true)}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify Selected
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {selectedIds.size}
              </span>
            )}
          </button>
        </div>
      </Card>

      {/* Transaction Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-card-border text-left">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredTransactions.length > 0 &&
                      selectedIds.size === filteredTransactions.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-card-border bg-white/5 accent-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  From
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  To
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Value (BTC)
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Confirmations
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setVerifyingTx(tx)}
                  className="cursor-pointer border-b border-card-border transition-colors hover:bg-white/5"
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="h-4 w-4 rounded border-card-border bg-white/5 accent-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-white">
                      {truncateAddress(tx.txid)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-muted">
                      {truncateAddress(tx.fromAddress)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-muted">
                      {truncateAddress(tx.toAddress)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-white">
                    {tx.valueBTC.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {tx.blockConfirmations != null
                      ? tx.blockConfirmations.toLocaleString()
                      : "\u2014"}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted"
                  >
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Verify Selected Confirmation Dialog */}
      {showVerifyConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowVerifyConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-2">Confirm Verification</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to verify {selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowVerifyConfirm(false)}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySelected}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Transaction Panel / Modal */}
      {verifyingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!isVerifying) setVerifyingTx(null);
          }}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-xl border border-card-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Verify Transaction
              </h2>
              <button
                onClick={() => {
                  if (!isVerifying) setVerifyingTx(null);
                }}
                className="text-muted transition-colors hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* TXID */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Transaction ID
                </p>
                <div className="flex items-center gap-2">
                  <span className="break-all font-mono text-sm text-white">
                    {verifyingTx.txid}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(verifyingTx.txid, "txid")
                    }
                    className="shrink-0 text-muted transition-colors hover:text-white"
                    title="Copy TXID"
                  >
                    {copied === "txid" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* From / To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    From
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="break-all font-mono text-sm text-white">
                      {verifyingTx.fromAddress}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(verifyingTx.fromAddress, "from")
                      }
                      className="shrink-0 text-muted transition-colors hover:text-white"
                      title="Copy address"
                    >
                      {copied === "from" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    To
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="break-all font-mono text-sm text-white">
                      {verifyingTx.toAddress}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(verifyingTx.toAddress, "to")
                      }
                      className="shrink-0 text-muted transition-colors hover:text-white"
                      title="Copy address"
                    >
                      {copied === "to" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Value / Date / Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Value (BTC)
                  </p>
                  <p className="font-mono text-sm text-white">
                    {verifyingTx.valueBTC.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Date
                  </p>
                  <p className="text-sm text-white">
                    {formatDate(verifyingTx.date)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Type
                  </p>
                  <p className="text-sm text-white">
                    {verifyingTx.transactionType}
                  </p>
                </div>
              </div>

              {/* Status / Confirmations / Block */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Status
                  </p>
                  <StatusBadge status={verifyingTx.status} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Confirmations
                  </p>
                  <p className="text-sm text-white">
                    {verifyingTx.blockConfirmations != null
                      ? verifyingTx.blockConfirmations.toLocaleString()
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                    Block Height
                  </p>
                  <p className="text-sm text-white">
                    {verifyingTx.blockHeight != null
                      ? verifyingTx.blockHeight.toLocaleString()
                      : "\u2014"}
                  </p>
                </div>
              </div>

              {/* Wallet Source */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Wallet Source
                </p>
                <p className="text-sm text-white">
                  {verifyingTx.walletSource}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleVerifyOnBlockchain}
                disabled={isVerifying || verifyingTx.status === "verified"}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : verifyingTx.status === "verified" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Verify on Blockchain
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (!isVerifying) setVerifyingTx(null);
                }}
                disabled={isVerifying}
                className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
