"use client";

import React, { useState } from "react";
import { revokeApproval } from "@/lib/blockchain/revoke";
import { Loader2, ShieldX, CheckCircle, AlertTriangle } from "lucide-react";
import { getExplorerTxUrl } from "@/utils/formatting";

interface RevokeButtonProps {
  tokenAddress: string;
  spenderAddress: string;
  tokenSymbol: string;
  userAddress: string;
  onSuccess: (txHash: string) => void;
  disabled?: boolean;
}

export const RevokeButton: React.FC<RevokeButtonProps> = ({
  tokenAddress,
  spenderAddress,
  tokenSymbol,
  userAddress,
  onSuccess,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const handleConfirmRevoke = async () => {
    setLoading(true);
    setError(null);

    const result = await revokeApproval(tokenAddress, spenderAddress, userAddress);

    if (result.success) {
      setSuccessTx(result.txHash);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessTx(null);
        onSuccess(result.txHash);
      }, 2000);
    } else {
      setError(result.error || "Revocation failed.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled || loading}
        className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-red-500/20 active:scale-95 flex items-center gap-1.5"
      >
        <ShieldX className="w-3.5 h-3.5" />
        Revoke
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-red-400">
                <ShieldX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Revoke Token Approval</h3>
                <p className="text-xs text-slate-400">Target token: {tokenSymbol}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-300 space-y-2 mb-4">
              <p>
                This action will send an on-chain <code className="text-blue-400 font-mono">approve(spender, 0)</code> transaction on <strong>Ethereum Sepolia</strong>.
              </p>
              <div className="pt-2 border-t border-slate-700/60 font-mono text-[11px] text-slate-400 break-all space-y-1">
                <div><span className="text-slate-500">Token:</span> {tokenAddress}</div>
                <div><span className="text-slate-500">Spender:</span> {spenderAddress}</div>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/70 border border-red-800 text-red-200 text-xs p-3 rounded-lg flex items-start gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successTx && (
              <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold">Approval revoked on Sepolia!</span>
                  <div className="mt-1">
                    <a
                      href={getExplorerTxUrl(successTx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-emerald-300 hover:text-white"
                    >
                      View transaction on Sepolia Etherscan ↗
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmRevoke}
                disabled={loading || !!successTx}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirming in MetaMask...
                  </>
                ) : (
                  <>
                    <ShieldX className="w-4 h-4" />
                    Sign & Revoke
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
