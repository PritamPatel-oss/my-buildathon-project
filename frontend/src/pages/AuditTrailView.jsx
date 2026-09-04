// src/pages/AuditTrailView.jsx
import React, { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { ExternalLinkIcon } from "../components/Icons";

export default function AuditTrailView({ auditAttempts, loading, onSelectTxnId }) {
  const [filterPolicy, setFilterPolicy] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = auditAttempts.filter((a) => {
    const matchesSearch =
      (a.customer_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(a.transaction_id).includes(searchTerm) ||
      (a.ai_diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.policy_reason || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterPolicy === "all") return true;
    return a.policy_decision === filterPolicy;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Immutable Audit Trail ({auditAttempts.length})
          </h2>
          <p className="text-xs text-slate-400">
            End-to-end regulatory and algorithmic audit log for every payment recovery attempt
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email, txn ID, diagnosis..."
            className="bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-slate-800 text-xs font-medium">
        {[
          { id: "all", label: `All Attempts (${auditAttempts.length})` },
          { id: "allowed", label: "Allowed by Policy" },
          { id: "blocked", label: "Blocked by Policy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterPolicy(tab.id)}
            className={`px-4 py-2 border-b-2 transition-all ${
              filterPolicy === tab.id
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Attempt ID</th>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">AI Diagnosis</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Recommended Action</th>
              <th className="px-4 py-3 font-medium">Policy Decision</th>
              <th className="px-4 py-3 font-medium">Execution</th>
              <th className="px-4 py-3 font-medium">Recovered</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium text-right">Gateway Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-slate-400">
                  Loading audit trail...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-slate-400">
                  No recovery attempts recorded matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-400">
                    #{a.id}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSelectTxnId && onSelectTxnId(a.transaction_id)}
                      className="text-slate-200 hover:text-amber-400 font-medium transition-colors text-left"
                    >
                      <div>{a.customer_email || `Txn #${a.transaction_id}`}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ₹{(a.amount || 0).toLocaleString("en-IN")}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="font-mono text-[11px]">
                      {a.ai_diagnosis || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {a.ai_confidence ? `${Math.round(a.ai_confidence * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-[11px]">
                    {a.ai_recommended_action ? a.ai_recommended_action.replace(/_/g, " ") : "None"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.policy_decision} />
                    {a.policy_reason && (
                      <div className="text-[10px] text-slate-400 mt-1 max-w-[180px] truncate" title={a.policy_reason}>
                        {a.policy_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.execution_status || "skipped"} />
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                    {a.amount_recovered > 0 ? `₹${a.amount_recovered.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {new Date(a.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.payment_link_url ? (
                      <a
                        href={a.payment_link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
                      >
                        <span>Open Link</span>
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
