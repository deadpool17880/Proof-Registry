import React from "react";
import { Approval } from "@/types/approval";
import { AlertOctagon, X, ShieldAlert, Sparkles } from "lucide-react";
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
          className="bg-gradient-to-r from-red-950/90 to-rose-950/80 border-2 border-red-600/80 rounded-2xl p-4 text-red-100 shadow-xl shadow-red-950/40 relative animate-in slide-in-from-top-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-900/80 border border-red-500/80 rounded-xl text-red-200 shrink-0">
                <AlertOctagon className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                    🚨 New Unlimited Approval
                  </span>
                  <span className="text-xs font-bold text-red-300">
                    High Risk Detected
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-200">
                  A new unlimited allowance was just granted for{" "}
                  <strong className="text-white font-mono">{app.tokenSymbol}</strong> to spender{" "}
                  <code className="bg-red-900/50 px-1.5 py-0.5 rounded font-mono text-xs text-red-200">
                    {formatAddress(app.spenderAddress, 8, 6)}
                  </code>
                  {app.isKnownSpender ? ` (${app.spenderName})` : " (Unknown Spender)"}.
                </div>

                <p className="text-xs text-red-300 mt-1">
                  This spender now has permission to transfer all of your {app.tokenSymbol}. If you did not intend this, revoke immediately.
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => onExplainRisk(app)}
                    className="px-3.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Explain Risk with AI
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => onDismiss(app.id)}
              className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-900/60 transition"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
