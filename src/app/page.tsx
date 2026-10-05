"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Approval } from "@/types/approval";
import { getActiveApprovals } from "@/lib/blockchain/approvals";
import { SEPOLIA_CHAIN_ID } from "@/lib/blockchain/client";
import { WalletConnect } from "@/components/WalletConnect";
import { NetworkWarning } from "@/components/NetworkWarning";
import { ApprovalTable } from "@/components/ApprovalTable";
import { RiskExplanation } from "@/components/RiskExplanation";
import { BatchRevoke } from "@/components/BatchRevoke";
import { NewApprovalAlert } from "@/components/NewApprovalAlert";
import { DemoHelper } from "@/components/DemoHelper";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [previousApprovals, setPreviousApprovals] = useState<Approval[]>([]);
  const [newUnlimitedAlerts, setNewUnlimitedAlerts] = useState<Approval[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeExplainingApproval, setActiveExplainingApproval] = useState<Approval | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Fetch approvals for connected address
  const fetchApprovals = useCallback(
    async (isManualRefresh = false) => {
      if (!userAddress || chainId !== SEPOLIA_CHAIN_ID) {
        setApprovals([]);
        return;
      }

      setLoading(true);
      try {
        const latest = await getActiveApprovals(userAddress);

        // Check for newly appeared unlimited approvals if this isn't the initial load
        if (previousApprovals.length > 0) {
          const prevMap = new Set(previousApprovals.map((a) => a.id));
          const newUnlimited = latest.filter(
            (a) => a.isUnlimited && !prevMap.has(a.id)
          );
          if (newUnlimited.length > 0) {
            setNewUnlimitedAlerts((prev) => [...newUnlimited, ...prev]);
          }
        }

        setPreviousApprovals(latest);
        setApprovals(latest);
        if (isManualRefresh) {
          showToast(`Synced ${latest.length} active approvals from Sepolia!`, "info");
        }
      } catch (err: any) {
        console.error("Failed to load approvals:", err);
        showToast("Error reading Sepolia blockchain data.", "error");
      } finally {
        setLoading(false);
      }
    },
    [userAddress, chainId, previousApprovals]
  );

  // Initial load on wallet connect or chain change
  useEffect(() => {
    if (userAddress && chainId === SEPOLIA_CHAIN_ID) {
      fetchApprovals();
    } else {
      setApprovals([]);
      setSelectedIds([]);
      setNewUnlimitedAlerts([]);
    }
  }, [userAddress, chainId]);

  // Handle wallet connect
  const handleConnect = (address: string, newChainId: number) => {
    setUserAddress(address);
    setChainId(newChainId);
  };

  const handleDisconnect = () => {
    setUserAddress(null);
    setChainId(null);
    setApprovals([]);
    setSelectedIds([]);
  };

  // Selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(approvals.map((a) => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Revoke completion handler
  const handleRevokeSuccess = (txHash: string) => {
    showToast("Approval revoked on Sepolia! Refreshing allowances...", "success");
    // Refresh list
    setTimeout(() => {
      fetchApprovals();
    }, 1500);
  };

  // Quick stats
  const totalApprovals = approvals.length;
  const highRiskCount = approvals.filter((a) => a.riskLevel === "HIGH").length;
  const mediumRiskCount = approvals.filter((a) => a.riskLevel === "MEDIUM").length;
  const lowRiskCount = approvals.filter((a) => a.riskLevel === "LOW").length;

  const selectedApprovalsList = approvals.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="min-h-screen pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2.5 ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-700 text-emerald-200"
                : toastMessage.type === "error"
                ? "bg-red-950/90 border-red-700 text-red-200"
                : "bg-indigo-950/90 border-indigo-700 text-indigo-200"
            }`}
          >
            {toastMessage.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {toastMessage.type === "error" && (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            {toastMessage.type === "info" && (
              <Info className="w-4 h-4 text-indigo-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation / Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-2">
                Token Approval Security Manager
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  Sepolia
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Audit active ERC-20 allowances, analyze risks with AI, and revoke permissions.
              </p>
            </div>
          </div>

          <WalletConnect
            userAddress={userAddress}
            chainId={chainId}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Network Mismatch Warning */}
        <NetworkWarning
          currentChainId={chainId}
          onSwitchSuccess={() => {
            if (userAddress) handleConnect(userAddress, SEPOLIA_CHAIN_ID);
          }}
        />

        {/* New Unlimited Approval Alert Banner */}
        <NewApprovalAlert
          newApprovals={newUnlimitedAlerts}
          onDismiss={(id) =>
            setNewUnlimitedAlerts((prev) => prev.filter((a) => a.id !== id))
          }
          onExplainRisk={(app) => setActiveExplainingApproval(app)}
        />

        {userAddress ? (
          <>
            {/* Security Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow">
                <span className="text-xs text-slate-400 font-medium block mb-1">Total Active Approvals</span>
                <div className="text-2xl font-black text-white">{totalApprovals}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Live Sepolia allowances</span>
              </div>

              <div className="bg-slate-900/60 border border-red-950/60 rounded-2xl p-4 shadow">
                <span className="text-xs text-red-400 font-medium block mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> High Risk (Unlimited)
                </span>
                <div className="text-2xl font-black text-red-400">{highRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Require immediate review</span>
              </div>

              <div className="bg-slate-900/60 border border-amber-950/60 rounded-2xl p-4 shadow">
                <span className="text-xs text-amber-400 font-medium block mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Moderate Risk
                </span>
                <div className="text-2xl font-black text-amber-400">{mediumRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Unknown or old spenders</span>
              </div>

              <div className="bg-slate-900/60 border border-emerald-950/60 rounded-2xl p-4 shadow">
                <span className="text-xs text-emerald-400 font-medium block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Low Risk
                </span>
                <div className="text-2xl font-black text-emerald-400">{lowRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Verified limited spenders</span>
              </div>
            </div>

            {/* Testnet Demonstration Playground Helper */}
            <DemoHelper
              userAddress={userAddress}
              onApprovalsChanged={() => fetchApprovals(true)}
            />

            {/* Approvals Table */}
            <ApprovalTable
              approvals={approvals}
              userAddress={userAddress}
              loading={loading}
              onRefresh={() => fetchApprovals(true)}
              onRevokeSuccess={handleRevokeSuccess}
              onExplainRisk={(app) => setActiveExplainingApproval(app)}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            {/* Batch Revoke Action Floating Bar */}
            <BatchRevoke
              selectedApprovals={selectedApprovalsList}
              userAddress={userAddress}
              onClearSelection={handleDeselectAll}
              onBatchComplete={() => {
                showToast("Batch revocation finished! Syncing approvals...", "success");
                setTimeout(fetchApprovals, 1500);
              }}
            />

            {/* AI Risk Explanation Modal */}
            <RiskExplanation
              approval={activeExplainingApproval}
              userAddress={userAddress}
              onClose={() => setActiveExplainingApproval(null)}
              onRevokeSuccess={handleRevokeSuccess}
            />
          </>
        ) : (
          /* Empty / Unconnected State */
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl mt-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">
              Connect Wallet to Inspect Token Approvals
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Connect your MetaMask wallet on Ethereum Sepolia testnet to scan active ERC-20 allowances, identify unlimited permissions, and revoke risky spenders.
            </p>
            <div className="inline-block">
              <WalletConnect
                userAddress={userAddress}
                chainId={chainId}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>Token Approval Security Manager · Built for INNOBLOCK 2.0 Hackathon on Ethereum Sepolia Testnet</p>
        <p className="mt-1">All revoke transactions are executed directly by your connected wallet. No private keys stored.</p>
      </footer>
    </div>
  );
}
