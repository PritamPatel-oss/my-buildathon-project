// src/components/TransactionDetailModal.jsx
import React, { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import { ExternalLinkIcon, RefreshIcon, ShieldCheckIcon, SparklesIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

export default function TransactionDetailModal({
  transaction,
  onClose,
  onRunRecovery,
  runningRecovery,
}) {
  const { authFetch } = useAuth();
  const [auditAttempts, setAuditAttempts] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [refreshingAttemptId, setRefreshingAttemptId] = useState(null);
  const [refreshMsg, setRefreshMsg] = useState("");

  useEffect(() => {
    if (!transaction?.id) return;
    setLoadingAudit(true);
    authFetch(`/transactions/${transaction.id}/audit-trail`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAuditAttempts(data);
      })
      .catch(() => {})
      .finally(() => setLoadingAudit(false));
  }, [transaction?.id, authFetch]);

  if (!transaction) return null;

  const latestAttempt = auditAttempts[0] || null;

  // Identify successful recovery attempt (has positive recovered amount or execution status success)
  const successfulAttempt = auditAttempts.find(
    (att) => Number(att.amount_recovered) > 0 || att.execution_status === "success"
  );

  const isRecovered = transaction.status === "recovered" || Boolean(successfulAttempt);
  const primaryAttempt = isRecovered && successfulAttempt ? successfulAttempt : latestAttempt;

  // Calculate dynamic amount recovered from database/API
  const totalAmountRecovered = auditAttempts.reduce(
    (sum, att) => sum + (Number(att.amount_recovered) || 0),
    0
  );
  const dynamicAmountRecovered =
    totalAmountRecovered > 0
      ? totalAmountRecovered
      : successfulAttempt && Number(successfulAttempt.amount_recovered) > 0
      ? Number(successfulAttempt.amount_recovered)
      : isRecovered
      ? Number(transaction.amount) || 0
      : 0;

  // Identify any later blocked attempts (e.g. duplicate retry blocks)
  const laterBlockedAttempts =
    isRecovered && successfulAttempt
      ? auditAttempts.filter(
          (att) => att.id > successfulAttempt.id && att.policy_decision === "blocked"
        )
      : [];

  const handleRefreshStatus = async (attemptId) => {
    setRefreshingAttemptId(attemptId);
    setRefreshMsg("");
    try {
      const res = await authFetch(
        `/transactions/recovery-attempts/${attemptId}/refresh-status`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.status === "paid") {
        setRefreshMsg("Payment confirmed! Transaction successfully marked as recovered.");
        transaction.status = "recovered";
      } else {
        setRefreshMsg(`Payment status: ${data.status || "unpaid"}`);
      }
      // Re-fetch audit trail
      const auditRes = await authFetch(`/transactions/${transaction.id}/audit-trail`);
      const auditData = await auditRes.json();
      if (Array.isArray(auditData)) setAuditAttempts(auditData);
    } catch (err) {
      setRefreshMsg(err.message || "Could not refresh status");
    } finally {
      setRefreshingAttemptId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-semibold text-slate-100">
                Transaction #{transaction.id}
              </h3>
              <StatusBadge status={transaction.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Customer: {transaction.customer_email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Refresh Message Feedback */}
          {refreshMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <span>{refreshMsg}</span>
              <button onClick={() => setRefreshMsg("")} className="text-emerald-400 hover:text-emerald-200">
                ✕
              </button>
            </div>
          )}

          {/* Primary Transaction Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Amount</span>
              <p className="text-base font-bold text-slate-100 mt-0.5">
                ₹{transaction.amount?.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Currency</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                {transaction.currency || "INR"}
              </p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Failure Reason</span>
              <p className="text-xs font-medium text-rose-400 mt-0.5 truncate">
                {transaction.failure_reason_raw || "None recorded"}
              </p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Created Date</span>
              <p className="text-xs text-slate-300 mt-0.5">
                {new Date(transaction.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
          </div>

          {/* Recovery Diagnostic Overview */}
          {primaryAttempt ? (
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {isRecovered && successfulAttempt ? (
                    <>
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                        Successful Recovery: Attempt #{successfulAttempt.id}
                      </span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Latest AI & Policy Diagnosis (Attempt #{primaryAttempt.id})
                      </span>
                    </>
                  )}
                </div>
                <StatusBadge
                  status={
                    isRecovered && successfulAttempt
                      ? "recovered"
                      : primaryAttempt.policy_decision
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">AI Diagnosis:</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {primaryAttempt.ai_diagnosis
                      ? primaryAttempt.ai_diagnosis.replace("_", " ")
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">AI Confidence:</span>
                  <p className="text-slate-200 font-mono mt-0.5">
                    {Math.round((primaryAttempt.ai_confidence || 0) * 100)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Recommended Action:</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {primaryAttempt.ai_recommended_action
                      ? primaryAttempt.ai_recommended_action.replace(/_/g, " ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Policy Reason:</span>
                  <p className="text-slate-300 mt-0.5">
                    {primaryAttempt.policy_reason || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Execution Status:</span>
                  <div className="mt-0.5">
                    <StatusBadge
                      status={
                        isRecovered && successfulAttempt
                          ? "success"
                          : primaryAttempt.execution_status || "None"
                      }
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Amount Recovered:</span>
                  <p className="text-emerald-400 font-semibold font-mono mt-0.5 text-sm">
                    ₹{dynamicAmountRecovered % 1 === 0
                      ? dynamicAmountRecovered.toLocaleString("en-IN")
                      : dynamicAmountRecovered.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment Link / Gateway Info */}
              {(primaryAttempt.payment_link_url || primaryAttempt.payment_link_id) && (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>Gateway Link:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {primaryAttempt.payment_link_id || "Razorpay Link"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {primaryAttempt.payment_link_url && (
                      <a
                        href={primaryAttempt.payment_link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                      >
                        <span>Open Payment Link</span>
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleRefreshStatus(primaryAttempt.id)}
                      disabled={refreshingAttemptId === primaryAttempt.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
                    >
                      <RefreshIcon
                        className={`w-3 h-3 ${
                          refreshingAttemptId === primaryAttempt.id ? "animate-spin" : ""
                        }`}
                      />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-center">
              <p className="text-xs text-slate-400">No recovery attempt executed yet.</p>
              {transaction.status !== "recovered" && onRunRecovery && (
                <button
                  onClick={() => onRunRecovery(transaction.id)}
                  disabled={runningRecovery}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>{runningRecovery ? "Diagnosing..." : "Run AI Recovery"}</span>
                </button>
              )}
            </div>
          )}

          {/* Separately display later blocked duplicate attempts */}
          {laterBlockedAttempts.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
                  <span>
                    Subsequent Policy Block ({laterBlockedAttempts.length} duplicate attempt
                    {laterBlockedAttempts.length > 1 ? "s" : ""})
                  </span>
                </div>
                <StatusBadge status="blocked" />
              </div>
              <p className="text-[11px] text-slate-400">
                The policy engine prevented duplicate recovery charges because this transaction was
                already recovered.
              </p>
              <div className="space-y-1.5 pt-0.5">
                {laterBlockedAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="text-xs bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-amber-300 font-semibold">
                        Attempt #{att.id}:{" "}
                      </span>
                      <span className="text-slate-300">
                        {att.policy_reason || "Blocked duplicate"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(att.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit History Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Recovery Audit History ({auditAttempts.length})
            </h4>

            {loadingAudit ? (
              <p className="text-xs text-slate-400 py-2">Loading audit history...</p>
            ) : auditAttempts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No past attempts.</p>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Attempt</th>
                      <th className="px-3 py-2 font-medium">Diagnosis</th>
                      <th className="px-3 py-2 font-medium">Policy</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Recovered</th>
                      <th className="px-3 py-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {auditAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-mono">#{att.id}</td>
                        <td className="px-3 py-2">{att.ai_diagnosis || "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={att.policy_decision} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            status={
                              att.execution_status ||
                              (att.policy_decision === "blocked" ? "blocked" : "skipped")
                            }
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-emerald-400">
                          {att.amount_recovered > 0
                            ? `₹${
                                att.amount_recovered % 1 === 0
                                  ? att.amount_recovered.toLocaleString("en-IN")
                                  : att.amount_recovered.toFixed(2)
                              }`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {att.payment_link_url ? (
                            <a
                              href={att.payment_link_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline"
                            >
                              Link ↗
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Policy checks verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
