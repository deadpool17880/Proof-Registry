import React from "react";
import { Approval } from "@/types/approval";
import { formatAddress, formatAllowance, getExplorerAddressUrl } from "@/utils/formatting";
import { RiskBadge } from "./RiskBadge";
import { RevokeButton } from "./RevokeButton";
import { ExternalLink, Sparkles } from "lucide-react";

interface ApprovalRowProps {
  approval: Approval;
  userAddress: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onExplainRisk: () => void;
  onRevokeSuccess: (txHash: string) => void;
}

export const ApprovalRow: React.FC<ApprovalRowProps> = ({
  approval,
  userAddress,
  isSelected,
  onToggleSelect,
  onExplainRisk,
  onRevokeSuccess,
}) => {
  const formattedAllowance = formatAllowance(
    approval.allowance,
    approval.tokenDecimals,
    approval.tokenSymbol
  );

  return (
    <tr className={`border-b border-slate-800/80 transition-colors hover:bg-slate-800/30 ${isSelected ? "bg-indigo-950/20" : ""}`}>
      {/* Selection checkbox */}
      <td className="py-4 px-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
        />
      </td>

      {/* Token */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
            {approval.tokenSymbol.slice(0, 3)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">{approval.tokenSymbol}</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{approval.tokenName}</span>
              <a
                href={getExplorerAddressUrl(approval.tokenAddress)}
                target="_blank"
                rel="noreferrer"
                title="View token on Sepolia Etherscan"
                className="hover:text-blue-400 inline-flex items-center"
              >
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        </div>
      </td>

      {/* Spender */}
      <td className="py-4 px-4 font-mono text-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{formatAddress(approval.spenderAddress, 6, 4)}</span>
            <a
              href={getExplorerAddressUrl(approval.spenderAddress)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-400"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {approval.isKnownSpender ? (
            <span className="text-[10px] text-emerald-400 font-sans font-medium">
              ✓ {approval.spenderName || "Verified Spender"}
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-sans">
              ⚠️ Unknown spender
            </span>
          )}
        </div>
      </td>

      {/* Amount / Allowance */}
      <td className="py-4 px-4">
        {approval.isUnlimited ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-950/80 border border-red-800 text-red-300">
            UNLIMITED
          </span>
        ) : (
          <span className="text-sm font-mono text-slate-200">{formattedAllowance}</span>
        )}
      </td>

      {/* Risk Badge & Summary */}
      <td className="py-4 px-4">
        <div className="flex flex-col gap-1 items-start">
          <RiskBadge level={approval.riskLevel} />
          <button
            onClick={onExplainRisk}
            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            <Sparkles className="w-3 h-3" />
            Explain Risk
          </button>
        </div>
      </td>

      {/* Action: Single Revoke */}
      <td className="py-4 px-4 text-right">
        <RevokeButton
          tokenAddress={approval.tokenAddress}
          spenderAddress={approval.spenderAddress}
          tokenSymbol={approval.tokenSymbol}
          userAddress={userAddress}
          onSuccess={onRevokeSuccess}
        />
      </td>
    </tr>
  );
};
