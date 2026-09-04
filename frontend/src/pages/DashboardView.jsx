// src/pages/DashboardView.jsx
import React from "react";
import KPICard from "../components/KPICard";
import StatusBadge from "../components/StatusBadge";
import {
  CurrencyRupeeIcon,
  AlertIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  TransactionsIcon,
  SparklesIcon,
  XCircleIcon,
} from "../components/Icons";

export default function DashboardView({
  metrics,
  transactions,
  atRiskTransactions,
  recentAttempts,
  onSelectTxn,
  onRunRecovery,
  runningTxnId,
  setView,
}) {
  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Transactions"
          value={metrics?.total_transactions ?? transactions.length}
          subtitle="All recorded merchant orders"
          icon={TransactionsIcon}
          variant="default"
        />

        <KPICard
          title="At-Risk Revenue"
          value={`₹${(metrics?.total_at_risk ?? 0).toLocaleString("en-IN")}`}
          subtitle="Failed & pending orders"
          icon={AlertIcon}
          variant="amber"
        />

        <KPICard
          title="Recovered Revenue"
          value={`₹${(metrics?.total_recovered ?? 0).toLocaleString("en-IN")}`}
          subtitle="Paid via recovery links"
          icon={CurrencyRupeeIcon}
          variant="emerald"
        />

        <KPICard
          title="Recovery Rate"
          value={`${metrics?.recovery_rate_pct ?? 0}%`}
          subtitle="Recovered / At-Risk"
          icon={CheckCircleIcon}
          variant="blue"
        />

        <KPICard
          title="Recovered Txns"
          value={metrics?.successful_recoveries ?? 0}
          subtitle="Successfully restored"
          icon={CheckCircleIcon}
          variant="emerald"
        />

        <KPICard
          title="Blocked Attempts"
          value={metrics?.blocked_attempts ?? 0}
          subtitle="Stopped by policy engine"
          icon={XCircleIcon}
          variant="rose"
        />
      </div>

      {/* Main Grid: At-Risk Queue & Recent Recoveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* At-Risk Transactions (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                High-Priority At-Risk Orders
              </h2>
              <p className="text-xs text-slate-400">
                Failed or interrupted payments requiring autonomous AI intervention
              </p>
            </div>
            <button
              onClick={() => setView("at-risk")}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              View all ({atRiskTransactions.length}) →
            </button>
          </div>

          {atRiskTransactions.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-200">Zero Revenue at Risk</p>
              <p className="text-xs text-slate-400 mt-1">
                All customer payments are settled or successfully recovered.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Failure Reason</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {atRiskTransactions.slice(0, 5).map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => onSelectTxn(txn)}
                    >
                      <td className="px-4 py-3 font-medium">
                        <div>{txn.customer_email}</div>
                        <div className="text-[10px] text-slate-400">ID #{txn.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        ₹{txn.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                          {txn.failure_reason_raw || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onRunRecovery(txn.id)}
                          disabled={runningTxnId === txn.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
                        >
                          <SparklesIcon className="w-3.5 h-3.5" />
                          <span>{runningTxnId === txn.id ? "Diagnosing..." : "Recover"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Performance Strip */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Autonomous Policy Guard active
                </h4>
                <p className="text-[11px] text-slate-400">
                  Enforcing amount cap (₹5,000), 3-retry limit & duplicate execution prevention
                </p>
              </div>
            </div>
            <button
              onClick={() => setView("settings")}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
            >
              Configure Policy Rules
            </button>
          </div>
        </div>

        {/* Recent Recovery Activity (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              Recent Recoveries
            </h2>
            <button
              onClick={() => setView("audit")}
              className="text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Full Log →
            </button>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 divide-y divide-slate-800/60">
            {recentAttempts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No recovery attempts logged yet.
              </div>
            ) : (
              recentAttempts.slice(0, 6).map((att) => (
                <div key={att.id} className="p-3.5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                      {att.customer_email || `Txn #${att.transaction_id}`}
                    </span>
                    <StatusBadge
                      status={
                        att.amount_recovered > 0
                          ? "recovered"
                          : att.policy_decision === "blocked"
                          ? "blocked"
                          : att.execution_status || "processing"
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{att.ai_diagnosis ? att.ai_diagnosis.replace("_", " ") : "diagnosis pending"}</span>
                    <span className="font-mono text-slate-300">
                      {att.amount ? `₹${att.amount.toLocaleString("en-IN")}` : "—"}
                    </span>
                  </div>
                  {att.policy_reason && att.policy_decision === "blocked" && (
                    <div className="text-[10px] text-rose-400/90 mt-1 truncate">
                      {att.policy_reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
