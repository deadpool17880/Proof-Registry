"use client";

import React, { useState } from "react";
import { Approval } from "@/types/approval";
import { revokeApproval } from "@/lib/blockchain/revoke";
import { ShieldAlert, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { getExplorerTxUrl } from "@/utils/formatting";

interface BatchRevokeProps {
  selectedApprovals: Approval[];
  userAddress: string;
  onClearSelection: () => void;
  onBatchComplete: () => void;
}

export const BatchRevoke: React.FC<BatchRevokeProps> = ({
  selectedApprovals,
  userAddress,
  onClearSelection,
  onBatchComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTxs, setCompletedTxs] = useState<{ id: string; token: string; txHash: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (selectedApprovals.length === 0) return null;

  const handleStartBatch = async () => {
    setRunning(true);
    setError(null);
    setCompletedTxs([]);

    for (let i = 0; i < selectedApprovals.length; i++) {
      setCurrentIndex(i + 1);
      const app = selectedApprovals[i];

      const res = await revokeApproval(app.tokenAddress, app.spenderAddress, userAddress);

      if (!res.success) {
        setError(`Failed while revoking ${app.tokenSymbol}: ${res.error || "Transaction cancelled"}`);
        setRunning(false);
        return;
      }

      setCompletedTxs((prev) => [
        ...prev,
        { id: app.id, token: app.tokenSymbol, txHash: res.txHash },
      ]);
    }

    setRunning(false);
    setTimeout(() => {
      onBatchComplete();
      onClearSelection();
    }, 2000);
  };

  const isDone = completedTxs.length === selectedApprovals.length && selectedApprovals.length > 0;

  return (
    <>
      {/* Floating Batch Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-indigo-500/50 shadow-2xl shadow-indigo-950/50 rounded-2xl px-6 py-3.5 flex items-center gap-6 backdrop-blur animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {selectedApprovals.length}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {selectedApprovals.length} Approval{selectedApprovals.length > 1 ? "s" : ""} Selected
            </div>
            <div className="text-[11px] text-slate-400">
              Ready for sequential on-chain revocation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClearSelection}
            disabled={running}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 transition"
          >
            Deselect All
          </button>

          <button
            onClick={() => setIsOpen(true)}
            disabled={running}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            Revoke Selected
          </button>
        </div>
      </div>

      {/* Batch Revoke Progress Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Batch Revoke Approvals
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              MetaMask will prompt you to confirm each revoke transaction sequentially.
            </p>

            {/* Progress indicator */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>Progress: {completedTxs.length} of {selectedApprovals.length} complete</span>
                {running && (
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing {currentIndex} of {selectedApprovals.length}...
                  </span>
                )}
                {isDone && <span className="text-emerald-400 font-bold">All Completed!</span>}
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                  style={{
                    width: `${(completedTxs.length / selectedApprovals.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* List of items */}
            <div className="max-h-52 overflow-y-auto space-y-2 my-4 pr-1">
              {selectedApprovals.map((app, idx) => {
                const isCompleted = completedTxs.some((c) => c.id === app.id);
                const isCurrent = running && currentIndex === idx + 1;
                const completedItem = completedTxs.find((c) => c.id === app.id);

                return (
                  <div
                    key={app.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      isCompleted
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                        : isCurrent
                        ? "bg-indigo-950/60 border-indigo-700 text-indigo-200 animate-pulse"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{app.tokenSymbol}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Spender: {app.spenderAddress.slice(0, 10)}...
                        </div>
                      </div>
                    </div>

                    {completedItem && (
                      <a
                        href={getExplorerTxUrl(completedItem.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] underline text-emerald-400 hover:text-white flex items-center gap-1"
                      >
                        View Tx <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-850 rounded-xl text-red-200 text-xs flex items-start gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (isDone) {
                    onBatchComplete();
                    onClearSelection();
                  }
                }}
                disabled={running}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium"
              >
                {isDone ? "Done" : "Cancel"}
              </button>

              {!isDone && (
                <button
                  onClick={handleStartBatch}
                  disabled={running}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
                >
                  {running ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Batch in MetaMask...
                    </>
                  ) : (
                    "Confirm & Start Revoking"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
