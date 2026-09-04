// src/components/Topbar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { PlusIcon, RefreshIcon } from "./Icons";

export default function Topbar({
  title,
  subtitle,
  onRefresh,
  onNewTransaction,
  refreshing,
}) {
  const { user } = useAuth();

  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 select-none">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Policy Engine Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Razorpay Test Mode</span>
          </div>
        </div>

        {/* Action buttons */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh Data"
            className="p-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-slate-100 hover:bg-slate-750 transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        )}

        {onNewTransaction && (
          <button
            onClick={onNewTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>New Test Txn</span>
          </button>
        )}

        {/* User Badge */}
        <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-amber-400">
            {user?.email ? user.email.slice(0, 1).toUpperCase() : "U"}
          </div>
          <span className="text-xs text-slate-300 font-medium hidden lg:inline max-w-[140px] truncate">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
