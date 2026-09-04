// src/components/KPICard.jsx
import React from "react";

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}) {
  const colorStyles = {
    default: {
      border: "border-slate-800",
      accent: "text-slate-400",
      bg: "bg-slate-900/60",
      iconBg: "bg-slate-800/80 text-slate-300",
    },
    amber: {
      border: "border-amber-500/20",
      accent: "text-amber-400",
      bg: "bg-amber-950/10",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      accent: "text-emerald-400",
      bg: "bg-emerald-950/10",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    blue: {
      border: "border-blue-500/20",
      accent: "text-blue-400",
      bg: "bg-blue-950/10",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    rose: {
      border: "border-rose-500/20",
      accent: "text-rose-400",
      bg: "bg-rose-950/10",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
  }[variant] || colorStyles.default;

  return (
    <div
      className={`rounded-xl p-5 border ${colorStyles.border} ${colorStyles.bg} backdrop-blur-sm transition-all duration-200 hover:border-slate-700 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorStyles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl font-semibold tracking-tight ${colorStyles.accent}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">{subtitle}</p>
      )}
    </div>
  );
}
