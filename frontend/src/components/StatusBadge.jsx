// src/components/StatusBadge.jsx
import React from "react";

export default function StatusBadge({ status }) {
  const norm = (status || "").toLowerCase().trim();

  let bg = "bg-slate-800 text-slate-300 border-slate-700";
  let dot = "bg-slate-400";
  let label = status || "Unknown";

  if (norm === "recovered" || norm === "paid" || norm === "allowed" || norm === "success") {
    bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    dot = "bg-emerald-400";
    label = norm === "paid" ? "Paid" : norm === "recovered" ? "Recovered" : norm === "allowed" ? "Allowed" : "Success";
  } else if (norm === "failed" || norm === "blocked" || norm === "execution_failed") {
    bg = "bg-rose-500/10 text-rose-400 border-rose-500/30";
    dot = "bg-rose-400";
    label = norm === "failed" ? "Failed" : norm === "blocked" ? "Blocked" : "Execution Failed";
  } else if (norm === "pending" || norm === "at_risk" || norm === "at risk" || norm === "created") {
    bg = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    dot = "bg-amber-400";
    label = norm === "created" ? "Pending" : "At Risk";
  } else if (norm === "processing" || norm === "running") {
    bg = "bg-blue-500/10 text-blue-400 border-blue-500/30";
    dot = "bg-blue-400 animate-pulse";
    label = "Processing";
  } else if (norm === "skipped") {
    bg = "bg-slate-700/50 text-slate-400 border-slate-600";
    dot = "bg-slate-400";
    label = "Skipped";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
