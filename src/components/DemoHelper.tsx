"use client";

import React, { useState } from "react";
import {
  deployTestToken,
  claimTestFaucet,
  createTestApproval,
  TEST_UNKNOWN_SPENDER,
  TEST_KNOWN_SPENDER,
  DEFAULT_TEST_TOKEN,
} from "@/lib/blockchain/testToken";
import { Loader2, PlusCircle, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getExplorerAddressUrl, getExplorerTxUrl } from "@/utils/formatting";

interface DemoHelperProps {
  userAddress: string;
  onApprovalsChanged: () => void;
}

export const DemoHelper: React.FC<DemoHelperProps> = ({
  userAddress,
  onApprovalsChanged,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("custom_test_token") || DEFAULT_TEST_TOKEN;
    }
    return DEFAULT_TEST_TOKEN;
  });

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean; txHash?: string } | null>(null);

  const handleDeployContract = async () => {
    setLoadingAction("deploy");
    setStatusMessage(null);
    try {
      const deployedAddr = await deployTestToken(userAddress);
      setTokenAddress(deployedAddr);
      setStatusMessage({
        text: `New SecurityTestToken deployed at ${deployedAddr}!`,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Failed to deploy test token.",
        isError: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClaimFaucet = async () => {
    setLoadingAction("faucet");
    setStatusMessage(null);
    try {
      const hash = await claimTestFaucet(tokenAddress, userAddress);
      setStatusMessage({
        text: "Successfully minted 1,000 STK tokens to your wallet!",
        txHash: hash,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Faucet claim failed.",
        isError: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateApproval = async (isUnlimited: boolean, isKnown: boolean) => {
    const actionKey = isUnlimited ? "unlimited" : "limited";
    setLoadingAction(actionKey);
    setStatusMessage(null);

    const spender = isKnown ? TEST_KNOWN_SPENDER : TEST_UNKNOWN_SPENDER;

    try {
      const hash = await createTestApproval(tokenAddress, spender, userAddress, isUnlimited);
      setStatusMessage({
        text: `Created ${isUnlimited ? "UNLIMITED" : "LIMITED"} test approval on Sepolia!`,
        txHash: hash,
      });
      // Trigger approval list refresh
      onApprovalsChanged();
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Failed to create approval.",
        isError: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Testnet Demonstration Helper</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Need real approvals to test revoking? Generate real on-chain Sepolia approvals in 1 click.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          {isOpen ? "Hide Demo Helper" : "Open Demo Playground"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-4 animate-in fade-in">
          {/* Active test token selector */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block mb-0.5">Active Test Token:</span>
              <a
                href={getExplorerAddressUrl(tokenAddress)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-indigo-300 hover:underline"
              >
                {tokenAddress}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDeployContract}
                disabled={!!loadingAction}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                {loadingAction === "deploy" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                Deploy New Test Token
              </button>

              <button
                onClick={handleClaimFaucet}
                disabled={!!loadingAction}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                {loadingAction === "faucet" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Mint 1,000 STK
              </button>
            </div>
          </div>

          {/* Quick Create Approval Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Unlimited Risk Approval */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-red-300 block">Create High-Risk Test Approval</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Grants an <strong>UNLIMITED</strong> allowance to an unknown/unrecognized spender address.
                </p>
              </div>

              <button
                onClick={() => handleCreateApproval(true, false)}
                disabled={!!loadingAction}
                className="px-4 py-2 bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow"
              >
                {loadingAction === "unlimited" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Confirming in MetaMask...
                  </>
                ) : (
                  "Create Unlimited Approval"
                )}
              </button>
            </div>

            {/* 2. Normal Limited Approval */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-300 block">Create Safe / Limited Test Approval</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Grants a limited <strong>100 STK</strong> allowance to a verified spender (Uniswap V3 Router).
                </p>
              </div>

              <button
                onClick={() => handleCreateApproval(false, true)}
                disabled={!!loadingAction}
                className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow"
              >
                {loadingAction === "limited" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Confirming in MetaMask...
                  </>
                ) : (
                  "Create Limited Approval (100 STK)"
                )}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.isError
                  ? "bg-red-950/80 border-red-800 text-red-200"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              }`}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="flex-1">
                <span>{statusMessage.text}</span>
                {statusMessage.txHash && (
                  <div className="mt-1">
                    <a
                      href={getExplorerTxUrl(statusMessage.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-emerald-300 hover:text-white"
                    >
                      View on Sepolia Etherscan ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
