// src/pages/AtRiskView.jsx
import React from "react";
import StatusBadge from "../components/StatusBadge";
import { AlertIcon, SparklesIcon, ShieldCheckIcon } from "../components/Icons";

export default function AtRiskView({
  transactions,
  totalAtRisk,
  onSelectTxn,
  onRunRecovery,
  runningTxnId,
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
            <AlertIcon className="w-3.5 h-3.5" />
            <span>Action Required</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            At-Risk Payment Queue
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            These transactions encountered gateway failures (declines, timeouts, insufficient funds)
            and are currently leaking revenue. Trigger RecoverAI to diagnose and dispatch dynamic Razorpay links.
          </p>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-right shrink-0">
          <span className="text-xs font-medium text-slate-400">Total Unrecovered Capital</span>
          <div className="text-3xl font-bold font-mono text-amber-400 mt-0.5">
            ₹{(totalAtRisk || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {transactions.length} failed customer orders
          </span>
        </div>
      </div>

      {/* Transactions Queue */}
      {transactions.length === 0 ? (
        <div className="p-12 rounded-xl border border-slate-800 bg-slate-900/40 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">No At-Risk Payments</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no failed or pending transactions. You can inject a test failed order using "New Test Txn" in the top bar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    #{txn.id}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">
                    {txn.customer_email}
                  </span>
                  <StatusBadge status={txn.status} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Gateway Reason:{" "}
                    <strong className="text-rose-400 font-mono">
                      {txn.failure_reason_raw || "None"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Failed{" "}
                    {new Date(txn.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right">
                  <span className="text-xs text-slate-400">Amount</span>
                  <p className="font-mono text-xl font-bold text-slate-100">
                    ₹{txn.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTxn(txn)}
                    className="px-3.5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => onRunRecovery(txn.id)}
                    disabled={runningTxnId === txn.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>{runningTxnId === txn.id ? "Diagnosing..." : "Run Recovery"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
