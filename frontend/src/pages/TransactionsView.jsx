// src/pages/TransactionsView.jsx
import React, { useState, useMemo } from "react";
import StatusBadge from "../components/StatusBadge";
import { SparklesIcon } from "../components/Icons";

export default function TransactionsView({
  transactions,
  onSelectTxn,
  onRunRecovery,
  runningTxnId,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(t.id).includes(searchTerm) ||
        (t.failure_reason_raw || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "at_risk") return t.status === "failed" || t.status === "pending";
      return t.status === statusFilter;
    });
  }, [transactions, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Transaction Ledger ({transactions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ledger of all orders, failure diagnostics and recovery dispositions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, ID or reason..."
            className="bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-slate-800 text-xs font-medium">
        {[
          { id: "all", label: "All Transactions" },
          { id: "at_risk", label: "At Risk" },
          { id: "failed", label: "Failed" },
          { id: "recovered", label: "Recovered" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 border-b-2 transition-all ${
              statusFilter === tab.id
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Transaction ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Failure Reason</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created At</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                  No transactions match your search or filter.
                </td>
              </tr>
            ) : (
              filtered.map((txn) => {
                const isAtRisk = txn.status === "failed" || txn.status === "pending";
                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTxn(txn)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-300">
                      #{txn.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {txn.customer_email}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-100">
                      ₹{txn.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {txn.failure_reason_raw ? (
                        <span className="font-mono text-[11px] text-rose-300">
                          {txn.failure_reason_raw}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isAtRisk ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          High
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(txn.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectTxn(txn)}
                          className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-colors"
                        >
                          Details
                        </button>
                        {isAtRisk && (
                          <button
                            onClick={() => onRunRecovery(txn.id)}
                            disabled={runningTxnId === txn.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors disabled:opacity-50"
                          >
                            <SparklesIcon className="w-3 h-3" />
                            <span>{runningTxnId === txn.id ? "..." : "Recover"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
