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
import { Loader2, PlusCircle, CheckCircle2, AlertTriangle, FlaskConical, Terminal, ArrowUpRight } from "lucide-react";
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
        text: `SecurityTestToken contract deployed on Sepolia at ${deployedAddr}`,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Contract deployment failed.",
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
        text: "Minted 1,000 STK test tokens to your Sepolia wallet.",
        txHash: hash,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Faucet transaction failed.",
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
        text: `Sepolia ${isUnlimited ? "Unlimited" : "Limited"} approval confirmed on-chain.`,
        txHash: hash,
      });
      onApprovalsChanged();
    } catch (err: any) {
      setStatusMessage({
        text: err?.shortMessage || err?.message || "Approval transaction failed.",
        isError: true,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Sepolia Testnet Simulation Fixtures
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Devtools
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate real on-chain Sepolia allowances to test the audit and revoke pipeline.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          {isOpen ? "Close Fixtures" : "Open Simulation Fixtures"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-4 animate-in fade-in">
          {/* Active test token selector */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block mb-0.5 font-mono text-[11px]">ACTIVE TEST TOKEN:</span>
              <a
                href={getExplorerAddressUrl(tokenAddress)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-indigo-300 hover:underline flex items-center gap-1"
              >
                {tokenAddress}
                <ArrowUpRight className="w-3 h-3" />
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
                Deploy New Token
              </button>

              <button
                onClick={handleClaimFaucet}
                disabled={!!loadingAction}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
              >
                {loadingAction === "faucet" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Terminal className="w-3.5 h-3.5" />
                )}
                Mint 1,000 STK
              </button>
            </div>
          </div>

          {/* Quick Create Approval Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Unlimited Risk Approval */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-rose-300 block font-mono">FIXTURE 1: UNLIMITED PERMISSION</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Grants an <strong>UNLIMITED</strong> (<code className="text-rose-300 font-mono">MaxUint256</code>) allowance to an unverified contract address.
                </p>
              </div>

              <button
                onClick={() => handleCreateApproval(true, false)}
                disabled={!!loadingAction}
                className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow"
              >
                {loadingAction === "unlimited" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Confirming in MetaMask...
                  </>
                ) : (
                  "Create Unlimited Allowance (High Risk)"
                )}
              </button>
            </div>

            {/* 2. Normal Limited Approval */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-300 block font-mono">FIXTURE 2: LIMITED PERMISSION</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Grants a bounded <strong>100 STK</strong> allowance to a verified protocol router (Uniswap V3).
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
                  "Create Limited Allowance (100 STK)"
                )}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.isError
                  ? "bg-rose-950/80 border-rose-800 text-rose-200"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              }`}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
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
