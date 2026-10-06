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
  Terminal,
  Activity,
  CheckCircle2,
  Info,
  ChevronRight,
  Fingerprint,
  Zap,
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

        // Detect newly appeared unlimited allowances
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
          showToast(`Synced ${latest.length} active allowances on Sepolia`, "info");
        }
      } catch (err: any) {
        console.error("Failed to load approvals:", err);
        showToast("RPC synchronization failure.", "error");
      } finally {
        setLoading(false);
      }
    },
    [userAddress, chainId, previousApprovals]
  );

  useEffect(() => {
    if (userAddress && chainId === SEPOLIA_CHAIN_ID) {
      fetchApprovals();
    } else {
      setApprovals([]);
      setSelectedIds([]);
      setNewUnlimitedAlerts([]);
    }
  }, [userAddress, chainId]);

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

  const handleRevokeSuccess = (txHash: string) => {
    showToast("Allowance set to zero. Refreshing on-chain state...", "success");
    setTimeout(() => {
      fetchApprovals();
    }, 1500);
  };

  // Metrics
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
                ? "bg-emerald-950/90 border-emerald-700/80 text-emerald-200"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-700/80 text-rose-200"
                : "bg-slate-900 border-indigo-700/80 text-indigo-200"
            }`}
          >
            {toastMessage.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {toastMessage.type === "error" && (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            {toastMessage.type === "info" && (
              <Info className="w-4 h-4 text-indigo-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5 shadow-md shadow-indigo-600/20">
              <div className="w-full h-full bg-[#0a0f18] rounded-[10px] flex items-center justify-center text-indigo-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm md:text-base tracking-tight text-white">
                  Token Approval Security Manager
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                  Sepolia
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                On-chain allowance audit, deterministic risk heuristic engine, and permission revocation
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

        {/* Realtime Alert Banner */}
        <NewApprovalAlert
          newApprovals={newUnlimitedAlerts}
          onDismiss={(id) =>
            setNewUnlimitedAlerts((prev) => prev.filter((a) => a.id !== id))
          }
          onExplainRisk={(app) => setActiveExplainingApproval(app)}
        />

        {userAddress ? (
          <>
            {/* Metric Overview Panels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Active Allowances
                </span>
                <div className="text-2xl font-black font-mono text-white">{totalApprovals}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Live on-chain records</span>
              </div>

              <div className="bg-slate-900/60 border border-rose-950/60 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 block mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> High Risk (Unlimited)
                </span>
                <div className="text-2xl font-black font-mono text-rose-400">{highRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Requires manual audit</span>
              </div>

              <div className="bg-slate-900/60 border border-amber-950/60 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Moderate Exposure
                </span>
                <div className="text-2xl font-black font-mono text-amber-400">{mediumRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Unknown or stale spenders</span>
              </div>

              <div className="bg-slate-900/60 border border-emerald-950/60 rounded-xl p-4 shadow-sm">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bounded / Safe
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400">{lowRiskCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Verified protocol routers</span>
              </div>
            </div>

            {/* Testnet Dev Simulation Lab */}
            <DemoHelper
              userAddress={userAddress}
              onApprovalsChanged={() => fetchApprovals(true)}
            />

            {/* Main Approvals Data Table */}
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

            {/* Multi-Selection Revoke Floating Bar */}
            <BatchRevoke
              selectedApprovals={selectedApprovalsList}
              userAddress={userAddress}
              onClearSelection={handleDeselectAll}
              onBatchComplete={() => {
                showToast("Batch revocation completed. Syncing on-chain state...", "success");
                setTimeout(fetchApprovals, 1500);
              }}
            />

            {/* Security Audit Modal */}
            <RiskExplanation
              approval={activeExplainingApproval}
              userAddress={userAddress}
              onClose={() => setActiveExplainingApproval(null)}
              onRevokeSuccess={handleRevokeSuccess}
            />
          </>
        ) : (
          /* Disconnected State / Feature Walkthrough */
          <div className="space-y-8 mt-4">
            <div className="text-center py-16 px-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="inline-flex p-3 bg-indigo-950/60 border border-indigo-700/60 rounded-2xl text-indigo-400 mb-4 shadow-inner">
                <Fingerprint className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                Audit and Revoke Sepolia Token Allowances
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                Connect your Web3 wallet to inspect active smart contract permissions, flag unlimited token approvals, and revoke dangerous spenders directly on Ethereum Sepolia.
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

            {/* Core Architecture Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-slate-800/80 text-indigo-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Authoritative Log Querying</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aggregates Sepolia <code className="text-indigo-300">Approval</code> logs and directly cross-checks <code className="text-indigo-300">allowance(owner, spender)</code> state on-chain.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-slate-800/80 text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Deterministic Risk Rules</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Classifies unbounded <code className="text-amber-300">MaxUint256</code> allowances, unregistered contracts, and stale authorizations with zero guesswork.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <div className="p-2 w-fit rounded-lg bg-slate-800/80 text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Direct On-Chain Revoke</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submits zero-allowance transactions signed directly by your browser wallet. No private keys are ever stored or transmitted.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        <p>Token Approval Security Manager · Ethereum Sepolia Testnet</p>
      </footer>
    </div>
  );
}
