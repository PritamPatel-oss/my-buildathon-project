// src/components/RecoveryStepper.jsx
import React from "react";
import { CheckCircleIcon, XCircleIcon, ExternalLinkIcon, RefreshIcon } from "./Icons";

export default function RecoveryStepper({
  attempt,
  transaction,
  paymentUrl,
  onRefreshStatus,
  refreshing,
}) {
  if (!attempt && !transaction) return null;

  // Determine stage outcomes from attempt
  const isAiDiagPassed = attempt?.ai_diagnosis && attempt?.ai_diagnosis !== "unknown";
  const isAiRecPassed = Boolean(attempt?.ai_recommended_action);
  const isPolicyAllowed = attempt?.policy_decision === "allowed";
  const isExecSuccess = attempt?.execution_status === "success";
  const isPaid = transaction?.status === "recovered" || (attempt?.amount_recovered || 0) > 0;

  const stages = [
    {
      name: "AI Diagnosis",
      status: !attempt
        ? "pending"
        : isAiDiagPassed
        ? "success"
        : "failed",
      result: attempt?.ai_diagnosis
        ? `${attempt.ai_diagnosis.replace("_", " ")} (${Math.round((attempt.ai_confidence || 0.95) * 100)}% conf)`
        : "Failed to classify gateway error",
      detail: attempt?.ai_diagnosis ? "Classified from gateway error signature" : "Fail-safe block triggered",
    },
    {
      name: "AI Recommendation",
      status: !attempt
        ? "pending"
        : isAiRecPassed
        ? "success"
        : "failed",
      result: attempt?.ai_recommended_action
        ? attempt.ai_recommended_action.replace(/_/g, " ")
        : "No safe action recommended",
      detail: attempt?.ai_recommended_action ? "Strategy determined by recovery policy" : "Blocked automatically",
    },
    {
      name: "Policy Check",
      status: !attempt
        ? "pending"
        : isPolicyAllowed
        ? "success"
        : "failed",
      result: isPolicyAllowed ? "Allowed" : "Blocked",
      detail: attempt?.policy_reason || "Evaluated by 5-rule safety engine",
    },
    {
      name: "Razorpay Execution",
      status: !attempt || !isPolicyAllowed
        ? "pending"
        : isExecSuccess
        ? "success"
        : "failed",
      result: isExecSuccess
        ? "Payment Link Generated"
        : attempt?.execution_status === "failed"
        ? "Execution Failed"
        : "Skipped (Policy Blocked)",
      detail: isExecSuccess ? "Test Mode payment link created" : "Razorpay call prevented",
    },
    {
      name: "Payment",
      status: isPaid ? "success" : isExecSuccess ? "active" : "pending",
      result: isPaid ? "Payment Received" : isExecSuccess ? "Waiting for Customer" : "Not Started",
      detail: isPaid ? "Verified via Razorpay API" : isExecSuccess ? "Link dispatched to customer" : "Awaiting execution",
    },
    {
      name: "Recovery",
      status: isPaid ? "success" : "pending",
      result: isPaid ? "Transaction Recovered" : "Incomplete",
      detail: isPaid
        ? `₹${(attempt?.amount_recovered || transaction?.amount || 0).toLocaleString("en-IN")} restored to balance`
        : "Awaiting final settlement",
    },
  ];

  const resolvedPaymentUrl = paymentUrl || (attempt?.payment_link_url) || (() => {
    if (attempt?.razorpay_response_raw) {
      try {
        const parsed = JSON.parse(attempt.razorpay_response_raw);
        return parsed.short_url;
      } catch (e) {
        return null;
      }
    }
    return null;
  })();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            Automated Recovery Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step diagnostic and execution trace for Transaction #{transaction?.id}
          </p>
        </div>

        {isPaid && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Payment Recovered</span>
          </div>
        )}
      </div>

      {/* Success banner if paid */}
      {isPaid && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-300">
                Payment Recovered Successfully
              </h4>
              <p className="text-xs text-emerald-400/80">
                ₹{(attempt?.amount_recovered || transaction?.amount || 0).toLocaleString("en-IN")} recovered successfully via Razorpay Test Mode.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded border border-emerald-500/30">
            COMPLETED
          </span>
        </div>
      )}

      {/* 6-Stage Stepper Progression */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
        {stages.map((stage, idx) => {
          let statusStyle = "bg-slate-800/60 border-slate-700/60 text-slate-400";
          let badge = "text-slate-500";
          let icon = <span className="w-2 h-2 rounded-full bg-slate-600" />;

          if (stage.status === "success") {
            statusStyle = "bg-emerald-950/20 border-emerald-500/30 text-slate-200";
            badge = "text-emerald-400";
            icon = <CheckCircleIcon className="w-4 h-4 text-emerald-400" />;
          } else if (stage.status === "failed") {
            statusStyle = "bg-rose-950/20 border-rose-500/30 text-slate-200";
            badge = "text-rose-400";
            icon = <XCircleIcon className="w-4 h-4 text-rose-400" />;
          } else if (stage.status === "active") {
            statusStyle = "bg-amber-950/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30";
            badge = "text-amber-400";
            icon = <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />;
          }

          return (
            <div
              key={stage.name}
              className={`p-3.5 rounded-lg border ${statusStyle} flex flex-col justify-between transition-all`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    0{idx + 1}
                  </span>
                  {icon}
                </div>
                <h4 className="text-xs font-semibold text-slate-200">
                  {stage.name}
                </h4>
                <p className={`text-[11px] font-medium mt-1 leading-snug ${badge}`}>
                  {stage.result}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                {stage.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Payment Link & Live Status Action Bar */}
      {isExecSuccess && (
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Payment Gateway Link:</span>
            {resolvedPaymentUrl ? (
              <a
                href={resolvedPaymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Open Payment Link</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400">
                (Link created in test mode)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefreshStatus && onRefreshStatus(attempt.id)}
              disabled={refreshing || isPaid}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isPaid
                  ? "bg-slate-800/40 text-slate-500 border-slate-700/40 cursor-not-allowed"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-750 border-slate-700 hover:border-slate-600"
              }`}
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{isPaid ? "Payment Confirmed" : refreshing ? "Checking..." : "Refresh Payment Status"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
