// src/pages/MetricsView.jsx
import React from "react";
import KPICard from "../components/KPICard";
import {
  CurrencyRupeeIcon,
  AlertIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
  SparklesIcon,
} from "../components/Icons";

export default function MetricsView({ metrics, auditAttempts, transactions }) {
  // Aggregate statistics
  const totalRecovered = metrics?.total_recovered ?? 0;
  const totalAtRisk = metrics?.total_at_risk ?? 0;
  const recoveryRate = metrics?.recovery_rate_pct ?? 0;
  const successfulAttempts = metrics?.successful_recoveries ?? 0;
  const blockedAttempts = metrics?.blocked_attempts ?? 0;
  const failedAttempts = metrics?.failed_attempts ?? 0;
  const totalAttempts = metrics?.total_attempts ?? auditAttempts.length;

  // Breakdown by diagnosis category from audit attempts
  const diagnosisCounts = auditAttempts.reduce((acc, a) => {
    const diag = a.ai_diagnosis || "unknown";
    acc[diag] = (acc[diag] || 0) + 1;
    return acc;
  }, {});

  // Breakdown by policy rejection reasons
  const policyBlockReasons = auditAttempts
    .filter((a) => a.policy_decision === "blocked")
    .reduce((acc, a) => {
      const r = a.policy_reason || "Unspecified policy rule";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 tracking-tight">
          Recovery Intelligence & Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Executive recovery KPIs, algorithmic decision metrics, and policy guard effectiveness
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Recovered Capital"
          value={`₹${totalRecovered.toLocaleString("en-IN")}`}
          subtitle="Directly settled"
          icon={CurrencyRupeeIcon}
          variant="emerald"
        />

        <KPICard
          title="At-Risk Capital"
          value={`₹${totalAtRisk.toLocaleString("en-IN")}`}
          subtitle="Unresolved failures"
          icon={AlertIcon}
          variant="amber"
        />

        <KPICard
          title="Efficiency Rate"
          value={`${recoveryRate}%`}
          subtitle="Recovery yield"
          icon={CheckCircleIcon}
          variant="blue"
        />

        <KPICard
          title="Successful"
          value={successfulAttempts}
          subtitle="Paid orders"
          icon={CheckCircleIcon}
          variant="emerald"
        />

        <KPICard
          title="Policy Blocked"
          value={blockedAttempts}
          subtitle="Safeguards applied"
          icon={ShieldCheckIcon}
          variant="rose"
        />

        <KPICard
          title="Failed Attempts"
          value={failedAttempts}
          subtitle="Gateway/link errors"
          icon={XCircleIcon}
          variant="default"
        />
      </div>

      {/* Analytical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Failure Breakdown Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Payment Failure Diagnosis Distribution
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {auditAttempts.length} samples
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(diagnosisCounts).length === 0 ? (
              <p className="text-xs text-slate-400">No attempts evaluated yet.</p>
            ) : (
              Object.entries(diagnosisCounts).map(([diag, count]) => {
                const pct = Math.round((count / (auditAttempts.length || 1)) * 100);
                return (
                  <div key={diag} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {diag.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Policy Block Reasons Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Policy Engine Block Reasons
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {blockedAttempts} blocked
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(policyBlockReasons).length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-center">
                <p className="text-xs text-slate-400">
                  No policy blocks triggered yet.
                </p>
              </div>
            ) : (
              Object.entries(policyBlockReasons).map(([reason, count]) => {
                const pct = Math.round((count / (blockedAttempts || 1)) * 100);
                return (
                  <div key={reason} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[280px]" title={reason}>
                        {reason}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
