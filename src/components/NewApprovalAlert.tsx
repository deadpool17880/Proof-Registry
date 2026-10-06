import React from "react";
import { Approval } from "@/types/approval";
import { AlertOctagon, X, ShieldAlert, ArrowRight } from "lucide-react";
import { formatAddress } from "@/utils/formatting";

interface NewApprovalAlertProps {
  newApprovals: Approval[];
  onDismiss: (id: string) => void;
  onExplainRisk: (approval: Approval) => void;
}

export const NewApprovalAlert: React.FC<NewApprovalAlertProps> = ({
  newApprovals,
  onDismiss,
  onExplainRisk,
}) => {
  if (newApprovals.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {newApprovals.map((app) => (
        <div
          key={app.id}
          className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 border border-rose-600/70 rounded-2xl p-4 text-rose-100 shadow-xl shadow-rose-950/30 relative animate-in slide-in-from-top-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-900/60 border border-rose-500/60 rounded-xl text-rose-200 shrink-0">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-600/90 text-white px-2 py-0.5 rounded">
                    UNLIMITED PERMISSION DETECTED
                  </span>
                  <span className="text-xs font-mono text-rose-300">
                    High Risk Exposure
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-200">
                  An unlimited token allowance was granted for{" "}
                  <strong className="text-white font-mono">{app.tokenSymbol}</strong> to spender{" "}
                  <code className="bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-rose-300">
                    {formatAddress(app.spenderAddress, 8, 6)}
                  </code>
                  {app.isKnownSpender ? ` (${app.spenderName})` : " (Unrecognized Spender)"}.
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  The designated contract now has permission to transfer all of your {app.tokenSymbol}. If this was unintentional, revoke this permission immediately.
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => onExplainRisk(app)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Inspect Security Analysis
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => onDismiss(app.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
