import React from "react";
import { RiskLevel } from "@/types/approval";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = "" }) => {
  if (level === "HIGH") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/70 border border-red-700/60 text-red-300 shadow-sm ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        HIGH RISK
      </span>
    );
  }

  if (level === "MEDIUM") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 border border-amber-700/60 text-amber-300 shadow-sm ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        MEDIUM RISK
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 shadow-sm ${className}`}
    >
      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      LOW RISK
    </span>
  );
};
