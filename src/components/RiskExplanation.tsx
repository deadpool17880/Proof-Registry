"use client";

import React, { useEffect, useState } from "react";
import { Approval } from "@/types/approval";
import { getRiskExplanation, AIExplanationResult } from "@/lib/ai/explainRisk";
import { RiskBadge } from "./RiskBadge";
import { formatAddress, formatAllowance, getExplorerAddressUrl } from "@/utils/formatting";
import { Bot, Shield, ExternalLink, X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
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
  const [aiData, setAiData] = useState<AIExplanationResult | null>(null);

  useEffect(() => {
    if (!approval) {
      setAiData(null);
      return;
    }

    let active = true;
    setLoading(true);

    getRiskExplanation(approval)
      .then((data) => {
        if (active) {
          setAiData(data);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Risk Analysis: {approval.tokenSymbol}
                <RiskBadge level={approval.riskLevel} />
              </h3>
              <p className="text-xs text-slate-400">Detailed security assessment & recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facts Summary */}
        <div className="grid grid-cols-2 gap-3 my-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Token</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span>{approval.tokenName} ({approval.tokenSymbol})</span>
              <a
                href={getExplorerAddressUrl(approval.tokenAddress)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-blue-400"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Approved Allowance</span>
            <span className={`font-mono font-semibold ${approval.isUnlimited ? "text-red-400" : "text-emerald-300"}`}>
              {formattedAllowance}
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Spender Contract</span>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-300">{formatAddress(approval.spenderAddress, 10, 8)}</span>
              {approval.isKnownSpender ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px]">
                  {approval.spenderName || "Verified Spender"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[10px]">
                  Unknown Spender
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deterministic Rules Flags */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Deterministic Rule Triggers
          </h4>
          <ul className="space-y-1.5">
            {approval.riskReasons.map((reason, idx) => (
              <li
                key={idx}
                className="text-xs bg-slate-800/50 border border-slate-700/50 px-3 py-2 rounded-lg text-slate-200 flex items-start gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Explanation Box */}
        <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-700/40 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Security Explanation</span>
            </div>
            {aiData?.isAiGenerated ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">
                AI Engine
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Standard Engine
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-4 text-xs text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Generating security context...
            </div>
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {aiData?.explanation}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition"
          >
            Close
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
