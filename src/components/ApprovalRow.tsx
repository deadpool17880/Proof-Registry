import React from "react";
import { Approval } from "@/types/approval";
import { formatAddress, formatAllowance, getExplorerAddressUrl } from "@/utils/formatting";
import { RiskBadge } from "./RiskBadge";
import { RevokeButton } from "./RevokeButton";
import { ExternalLink, ShieldAlert, FileText } from "lucide-react";

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
    <tr
      className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/25 ${
        isSelected ? "bg-indigo-950/25" : ""
      }`}
    >
      {/* Selection checkbox */}
      <td className="py-4 px-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
        />
      </td>

      {/* Token */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-xs text-indigo-300 shrink-0">
            {approval.tokenSymbol.slice(0, 3)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm tracking-tight">
              {approval.tokenSymbol}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="truncate max-w-[130px]">{approval.tokenName}</span>
              <a
                href={getExplorerAddressUrl(approval.tokenAddress)}
                target="_blank"
                rel="noreferrer"
                title="View token on Sepolia Etherscan"
                className="text-slate-500 hover:text-indigo-400 inline-flex items-center"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </td>

      {/* Spender */}
      <td className="py-4 px-4 font-mono text-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-200">{formatAddress(approval.spenderAddress, 6, 4)}</span>
            <a
              href={getExplorerAddressUrl(approval.spenderAddress)}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-400"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {approval.isKnownSpender ? (
            <span className="text-[10px] text-emerald-400 font-sans font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {approval.spenderName || "Verified Protocol"}
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-sans flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unrecognized Spender
            </span>
          )}
        </div>
      </td>

      {/* Amount / Allowance */}
      <td className="py-4 px-4">
        {approval.isUnlimited ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/70 border border-rose-800/80 text-rose-300">
            UNLIMITED
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-200">{formattedAllowance}</span>
        )}
      </td>

      {/* Risk Assessment & Audit button */}
      <td className="py-4 px-4">
        <div className="flex flex-col gap-1 items-start">
          <RiskBadge level={approval.riskLevel} />
          <button
            onClick={onExplainRisk}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors mt-0.5"
          >
            <FileText className="w-3 h-3" />
            Audit Details
          </button>
        </div>
      </td>

      {/* Action: Revoke */}
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
