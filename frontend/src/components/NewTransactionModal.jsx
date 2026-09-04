// src/components/NewTransactionModal.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function NewTransactionModal({ onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [email, setEmail] = useState("rohit.verma@example.com");
  const [amount, setAmount] = useState(1499);
  const [reason, setReason] = useState("insufficient_funds");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const failureReasons = [
    { value: "insufficient_funds", label: "Insufficient Funds (Recoverable)" },
    { value: "card_expired", label: "Card Expired (Recoverable)" },
    { value: "bank_declined", label: "Bank Declined (Recoverable)" },
    { value: "payment_timeout", label: "Payment Timeout (Recoverable)" },
    { value: "network_error", label: "Network Connectivity Error (Recoverable)" },
    { value: "invalid_otp", label: "Invalid OTP (Recoverable)" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await authFetch("/transactions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: email,
          amount: parseFloat(amount),
          failure_reason_raw: reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create transaction");
      }

      const data = await res.json();
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Create Test Failed Payment
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an incoming gateway failure to test RecoverAI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Customer Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Amount (INR)</label>
            <input
              type="number"
              required
              min="10"
              max="100000"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Amounts &gt; ₹5,000 will trigger the Policy Engine amount cap block.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Failure Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              {failureReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
