// src/components/RiskCard.jsx
import { useState } from "react";

export default function RiskCard({ transaction, apiBase }) {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const statusColor =
    transaction.status === "failed" ? "text-red-400" : "text-amber-400";

  const runRecovery = async () => {
    setRunning(true);
    const res = await fetch(`${apiBase}/transactions/${transaction.id}/process-recovery`, {
      method: "POST",
    });
    const data = await res.json();
    setResult(data);
    setRunning(false);
  };

  const outcomeColor = {
    executed: "text-green-400",
    blocked: "text-red-400",
    execution_failed: "text-red-400",
  }[result?.outcome];

  return (
    <div className="border border-slate-700 rounded px-5 py-4 bg-slate-800/50">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-200">{transaction.customer_email}</p>
          <p className="text-slate-500 text-sm mt-0.5">
            {transaction.failure_reason_raw || "no reason recorded"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg">₹{transaction.amount.toLocaleString("en-IN")}</p>
          <p className={`text-xs mt-0.5 ${statusColor}`}>{transaction.status}</p>
        </div>
      </div>

      {!result && (
        <button
          onClick={runRecovery}
          disabled={running}
          className="mt-3 text-sm border border-slate-600 rounded px-3 py-1.5 text-slate-300 hover:border-amber-400 hover:text-amber-400 transition-colors disabled:opacity-50"
        >
          {running ? "Processing..." : "Run recovery"}
        </button>
      )}

      {result && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-1.5 text-sm">
          <p>
            <span className="text-slate-500">AI diagnosis: </span>
            <span className="text-slate-200">{result.attempt.ai_diagnosis}</span>
          </p>
          <p>
            <span className="text-slate-500">Recommended action: </span>
            <span className="text-slate-200">{result.attempt.ai_recommended_action || "none"}</span>
          </p>
          <p>
            <span className="text-slate-500">Policy: </span>
            <span className={result.attempt.policy_decision === "allowed" ? "text-green-400" : "text-red-400"}>
              {result.attempt.policy_decision}
            </span>
            <span className="text-slate-500"> — {result.attempt.policy_reason}</span>
          </p>
          <p>
            <span className="text-slate-500">Outcome: </span>
            <span className={outcomeColor}>{result.outcome}</span>
          </p>
        </div>
      )}
    </div>
  );
}
