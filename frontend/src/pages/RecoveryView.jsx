// src/pages/RecoveryView.jsx
import React, { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import RecoveryStepper from "../components/RecoveryStepper";
import { SparklesIcon, AlertIcon, ShieldCheckIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";

export default function RecoveryView({
  transactions,
  onRefreshAll,
}) {
  const { authFetch } = useAuth();
  const [selectedTxnId, setSelectedTxnId] = useState(() => {
    const failed = transactions.find((t) => t.status === "failed");
    return failed ? failed.id : transactions[0]?.id || "";
  });

  const [simulateAiFailure, setSimulateAiFailure] = useState(false);
  const [simulateInvalidAction, setSimulateInvalidAction] = useState(false);
  const [running, setRunning] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const currentTxn = transactions.find((t) => t.id === Number(selectedTxnId));

  const handleRunRecovery = async () => {
    if (!currentTxn) return;
    setRunning(true);
    setError("");
    setRecoveryResult(null);

    try {
      const queryParams = new URLSearchParams();
      if (simulateAiFailure) queryParams.append("simulate_ai_failure", "true");
      if (simulateInvalidAction) queryParams.append("simulate_invalid_action", "true");

      const url = `/transactions/${currentTxn.id}/process-recovery?${queryParams.toString()}`;
      const res = await authFetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Recovery failed to execute");
      }

      const data = await res.json();
      setRecoveryResult(data);
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setError(err.message || "Failed to run recovery");
    } finally {
      setRunning(false);
    }
  };

  const handleRefreshStatus = async (attemptId) => {
    if (!attemptId) return;
    setRefreshing(true);
    try {
      const res = await authFetch(`/transactions/recovery-attempts/${attemptId}/refresh-status`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.status === "paid") {
        if (currentTxn) currentTxn.status = "recovered";
        if (recoveryResult?.attempt) {
          recoveryResult.attempt.amount_recovered = data.amount_recovered || currentTxn?.amount || 0;
        }
      }
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setError(err.message || "Could not refresh status");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Autonomous Recovery Orchestrator
          </h2>
          <p className="text-xs text-slate-400">
            Execute and audit the multi-stage payment recovery pipeline with live Razorpay link generation
          </p>
        </div>
      </div>

      {/* Control Deck */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Transaction Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Target Transaction
            </label>
            <select
              value={selectedTxnId}
              onChange={(e) => {
                setSelectedTxnId(e.target.value);
                setRecoveryResult(null);
                setError("");
              }}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {transactions.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.customer_email} (₹{t.amount} • {t.status})
                </option>
              ))}
            </select>
            {currentTxn && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400">Reason:</span>
                <span className="font-mono text-rose-300">
                  {currentTxn.failure_reason_raw || "none"}
                </span>
                <span>•</span>
                <StatusBadge status={currentTxn.status} />
              </div>
            )}
          </div>

          {/* Fail-Safe Simulation Toggles */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
              <span>Fail-Safe Sandbox Simulation Modes</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={simulateAiFailure}
                  onChange={(e) => setSimulateAiFailure(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">Simulate AI Outage</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tests fail-safe fallback: blocks recovery if diagnosis classification encounters error.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-slate-700 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={simulateInvalidAction}
                  onChange={(e) => setSimulateInvalidAction(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">Simulate Invalid Action</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tests policy engine: blocks execution if recommendation outputs an off-allowlist action.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Target: Transaction #{selectedTxnId} • ₹{currentTxn?.amount || 0}</span>
          </div>

          <button
            onClick={handleRunRecovery}
            disabled={running || !currentTxn}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>{running ? "Orchestrating Pipeline..." : "Execute Recovery Pipeline"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pipeline Stepper Visualization */}
      {recoveryResult && (
        <RecoveryStepper
          attempt={recoveryResult.attempt}
          transaction={currentTxn}
          paymentUrl={recoveryResult.payment_link_url}
          onRefreshStatus={handleRefreshStatus}
          refreshing={refreshing}
        />
      )}
    </div>
  );
}
