// src/components/AuditTrail.jsx
import { useEffect, useState } from "react";

const policyColor = {
  allowed: "text-green-400",
  blocked: "text-red-400",
};

const execColor = {
  success: "text-green-400",
  failed: "text-red-400",
  skipped: "text-slate-500",
};

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditTrail({ apiBase }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${apiBase}/transactions/audit/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAttempts(data);
        setLoading(false);
      });
  }, [apiBase]);

  if (loading) {
    return <p className="text-slate-500">Loading audit trail...</p>;
  }

  if (attempts.length === 0) {
    return (
      <p className="text-slate-500">
        No recovery attempts logged yet. Run a recovery from the Risk Queue to see it here.
      </p>
    );
  }

  return (
    <div className="border border-slate-700 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-slate-400 text-left">
            <th className="px-4 py-2.5 font-normal">Customer</th>
            <th className="px-4 py-2.5 font-normal">Diagnosis</th>
            <th className="px-4 py-2.5 font-normal">Action</th>
            <th className="px-4 py-2.5 font-normal">Policy</th>
            <th className="px-4 py-2.5 font-normal">Execution</th>
            <th className="px-4 py-2.5 font-normal text-right">Recovered</th>
            <th className="px-4 py-2.5 font-normal text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-t border-slate-700/60">
              <td className="px-4 py-2.5">
                <div className="text-slate-200">{a.customer_email || "—"}</div>
                <div className="text-slate-500 text-xs">
                  ₹{(a.amount ?? 0).toLocaleString("en-IN")}
                </div>
              </td>
              <td className="px-4 py-2.5 text-slate-300">{a.ai_diagnosis || "—"}</td>
              <td className="px-4 py-2.5 text-slate-300">{a.ai_recommended_action || "none"}</td>
              <td className="px-4 py-2.5">
                <span className={policyColor[a.policy_decision] || "text-slate-400"}>
                  {a.policy_decision}
                </span>
                <div className="text-slate-500 text-xs mt-0.5 max-w-[220px]">{a.policy_reason}</div>
              </td>
              <td className={`px-4 py-2.5 ${execColor[a.execution_status] || "text-slate-500"}`}>
                {a.execution_status || "—"}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-200">
                {a.amount_recovered > 0 ? `₹${a.amount_recovered.toLocaleString("en-IN")}` : "—"}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-500 text-xs">
                {formatTime(a.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
