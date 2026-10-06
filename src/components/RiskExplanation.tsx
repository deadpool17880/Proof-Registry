"use client";

import React, { useEffect, useState } from "react";
import { Approval } from "@/types/approval";
import { getRiskExplanation, AIExplanationResult } from "@/lib/ai/explainRisk";
import { RiskBadge } from "./RiskBadge";
import { formatAddress, formatAllowance, getExplorerAddressUrl } from "@/utils/formatting";
import { ShieldAlert, ExternalLink, X, Loader2, Terminal, AlertTriangle, ShieldCheck } from "lucide-react";
import { RevokeButton } from "./RevokeButton";

interface RiskExplanationProps {
  approval: Approval | null;
  userAddress: string;
  onClose: () => void;
  onRevokeSuccess: (txHash: string) => void;
}

export const RiskExplanation: React.FC<RiskExplanationProps> = ({
  approval,
  userAddress,
  onClose,
  onRevokeSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AIExplanationResult | null>(null);

  useEffect(() => {
    if (!approval) {
      setReportData(null);
      return;
    }

    let active = true;
    setLoading(true);

    getRiskExplanation(approval)
      .then((data) => {
        if (active) {
          setReportData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [approval]);

  if (!approval) return null;

  const formattedAllowance = formatAllowance(
    approval.allowance,
    approval.tokenDecimals,
    approval.tokenSymbol
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0e1420] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Security Audit: {approval.tokenSymbol}
                </h3>
                <RiskBadge level={approval.riskLevel} />
              </div>
              <p className="text-xs text-slate-400">Deterministic heuristics & automated risk synthesis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Spec Sheet */}
        <div className="grid grid-cols-2 gap-3 my-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-mono text-[11px] block mb-0.5">TARGET TOKEN</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span>{approval.tokenName} ({approval.tokenSymbol})</span>
              <a
                href={getExplorerAddressUrl(approval.tokenAddress)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 hover:text-indigo-400"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-mono text-[11px] block mb-0.5">GRANTED ALLOWANCE</span>
            <span className={`font-mono font-bold ${approval.isUnlimited ? "text-rose-400" : "text-emerald-300"}`}>
              {formattedAllowance}
            </span>
          </div>

          <div className="col-span-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-slate-500 font-mono text-[11px] block mb-0.5">SPENDER ADDRESS</span>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-300">{formatAddress(approval.spenderAddress, 12, 10)}</span>
              {approval.isKnownSpender ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-sans font-medium">
                  ✓ {approval.spenderName || "Verified Protocol"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[10px] font-sans font-medium">
                  Unrecognized Spender
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Evaluated Risk Vectors */}
        <div className="mb-4">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            Detected Risk Vectors
          </h4>
          <div className="space-y-1.5">
            {approval.riskReasons.map((reason, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Synthesis */}
        <div className="bg-slate-900/90 border border-indigo-950/80 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Security Synthesis & Recommendation
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {reportData?.isAiGenerated ? "Context Model" : "Deterministic Engine"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Compiling security context...
            </div>
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed">
              {reportData?.explanation}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition"
          >
            Dismiss
          </button>

          <RevokeButton
            tokenAddress={approval.tokenAddress}
            spenderAddress={approval.spenderAddress}
            tokenSymbol={approval.tokenSymbol}
            userAddress={userAddress}
            onSuccess={(hash) => {
              onRevokeSuccess(hash);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
