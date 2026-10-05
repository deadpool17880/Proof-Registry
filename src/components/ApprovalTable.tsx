"use client";

import React, { useState } from "react";
import { Approval } from "@/types/approval";
import { ApprovalRow } from "./ApprovalRow";
import { RefreshCw, Search, ShieldCheck, Filter, ShieldAlert } from "lucide-react";

interface ApprovalTableProps {
  approvals: Approval[];
  userAddress: string;
  loading: boolean;
  onRefresh: () => void;
  onRevokeSuccess: (txHash: string) => void;
  onExplainRisk: (approval: Approval) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({
  approvals,
  userAddress,
  loading,
  onRefresh,
  onRevokeSuccess,
  onExplainRisk,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}) => {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  // Filter approvals based on search query and risk level
  const filteredApprovals = approvals.filter((app) => {
    const matchesSearch =
      app.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
      app.tokenName.toLowerCase().includes(search.toLowerCase()) ||
      app.spenderAddress.toLowerCase().includes(search.toLowerCase()) ||
      (app.spenderName && app.spenderName.toLowerCase().includes(search.toLowerCase()));

    const matchesRisk =
      riskFilter === "ALL" || app.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const highRiskCount = approvals.filter((a) => a.riskLevel === "HIGH").length;
  const allFilteredSelected =
    filteredApprovals.length > 0 &&
    filteredApprovals.every((app) => selectedIds.includes(app.id));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Top Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white">Active Token Approvals</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {approvals.length} Found
          </span>

          {highRiskCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 border border-red-800 text-red-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {highRiskCount} High Risk
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token or spender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk Only</option>
            <option value="LOW">Low Risk Only</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 flex items-center gap-1.5 text-xs font-medium"
            title="Refresh on-chain approvals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={() => {
                    if (allFilteredSelected) {
                      onDeselectAll();
                    } else {
                      onSelectAll();
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Token</th>
              <th className="py-3 px-4">Spender</th>
              <th className="py-3 px-4">Approved Amount</th>
              <th className="py-3 px-4">Risk Evaluation</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && approvals.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-sm font-medium">Scanning Ethereum Sepolia for token approvals...</span>
                    <span className="text-xs text-slate-500">Querying on-chain allowances via Sepolia RPC</span>
                  </div>
                </td>
              </tr>
            ) : filteredApprovals.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-base font-semibold text-slate-200">
                      {search || riskFilter !== "ALL"
                        ? "No approvals match your filter criteria."
                        : "No active token approvals found on Sepolia."}
                    </span>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {search || riskFilter !== "ALL"
                        ? "Try clearing your search query or reset the risk filter."
                        : "Your wallet has no outstanding ERC-20 allowances. Use the Demo Playground above to mint test tokens and test revoking!"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApprovals.map((app) => (
                <ApprovalRow
                  key={app.id}
                  approval={app}
                  userAddress={userAddress}
                  isSelected={selectedIds.includes(app.id)}
                  onToggleSelect={() => onToggleSelect(app.id)}
                  onExplainRisk={() => onExplainRisk(app)}
                  onRevokeSuccess={onRevokeSuccess}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
