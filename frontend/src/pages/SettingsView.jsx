// src/pages/SettingsView.jsx
import React from "react";
import { ShieldCheckIcon, SparklesIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";

export default function SettingsView() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-slate-100 tracking-tight">
          System Rules & Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Autonomous safety limits, policy engine thresholds, and payment gateway bindings
        </p>
      </div>

      {/* Policy Engine Rules Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Policy Engine Hard Safeguards
              </h3>
              <p className="text-xs text-slate-400">
                Independent boundary rules evaluated before any recovery execution
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-medium">Max Recoverable Cap</span>
            <p className="text-base font-bold font-mono text-slate-100">₹5,000.00</p>
            <p className="text-[11px] text-slate-400">
              Transactions exceeding ₹5,000 are blocked automatically to protect merchant limits.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-medium">Max Retry Attempts</span>
            <p className="text-base font-bold font-mono text-slate-100">3 Attempts</p>
            <p className="text-[11px] text-slate-400">
              Prevents customer spamming and gateway abuse by capping total recovery touches per order.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-medium">Duplicate Prevention</span>
            <p className="text-sm font-semibold text-emerald-400">Active (Zero-Duplicate Rule)</p>
            <p className="text-[11px] text-slate-400">
              Orders already successfully executed or paid cannot receive duplicate recovery links.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
            <span className="text-slate-400 font-medium">Allowlisted Actions</span>
            <p className="text-sm font-semibold font-mono text-slate-200">resend_payment_link</p>
            <p className="text-[11px] text-slate-400">
              AI recommendations recommending unauthorized actions (e.g. refunds, chargebacks) are rejected.
            </p>
          </div>
        </div>
      </div>

      {/* Gateway Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Razorpay Gateway Integration
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium">
            Test Mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Environment:</span>
            <p className="text-slate-200 font-mono mt-0.5">Sandbox / Test Mode</p>
          </div>
          <div>
            <span className="text-slate-400">API Key Binding:</span>
            <p className="text-emerald-400 font-mono mt-0.5">Configured (.env)</p>
          </div>
          <div>
            <span className="text-slate-400">Currency Support:</span>
            <p className="text-slate-200 font-mono mt-0.5">INR (Paise converted)</p>
          </div>
        </div>
      </div>

      {/* Merchant Account Details */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Merchant Credentials</h3>
        <div className="text-xs space-y-1">
          <p className="text-slate-400">
            Authenticated Merchant: <span className="text-slate-200 font-medium">{user?.email}</span>
          </p>
          <p className="text-slate-400">
            Merchant ID: <span className="text-slate-200 font-mono">#{user?.id}</span>
          </p>
          <p className="text-slate-400">
            Authentication Scheme: <span className="text-slate-200 font-mono">JWT Bearer (HS256)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
