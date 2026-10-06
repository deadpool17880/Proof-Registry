import React from "react";
import { RiskLevel } from "@/types/approval";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = "" }) => {
  if (level === "HIGH") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold tracking-wide bg-rose-950/60 border border-rose-700/60 text-rose-300 shadow-sm ${className}`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        HIGH RISK
      </span>
    );
  }

  if (level === "MEDIUM") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold tracking-wide bg-amber-950/50 border border-amber-600/60 text-amber-300 shadow-sm ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        MEDIUM
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold tracking-wide bg-emerald-950/50 border border-emerald-600/60 text-emerald-300 shadow-sm ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      LIMITED / LOW
    </span>
  );
};
