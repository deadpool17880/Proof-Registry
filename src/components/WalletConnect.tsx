"use client";

import React, { useEffect, useState } from "react";
import { formatAddress } from "@/utils/formatting";
import { SEPOLIA_CHAIN_ID } from "@/lib/blockchain/client";
import { Wallet, LogOut, Copy, Check, Activity } from "lucide-react";
import { formatEther } from "viem";
import { publicClient } from "@/lib/blockchain/client";

interface WalletConnectProps {
  userAddress: string | null;
  chainId: number | null;
  onConnect: (address: string, chainId: number) => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  userAddress,
  chainId,
  onConnect,
  onDisconnect,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load balance & latest block when connected to Sepolia
  useEffect(() => {
    let active = true;
    const fetchChainData = async () => {
      if (userAddress && chainId === SEPOLIA_CHAIN_ID) {
        try {
          const [bal, block] = await Promise.all([
            publicClient.getBalance({ address: userAddress as any }),
            publicClient.getBlockNumber(),
          ]);
          if (active) {
            setBalance(parseFloat(formatEther(bal)).toFixed(4));
            setBlockNumber(block);
          }
        } catch {
          if (active) setBalance(null);
        }
      } else {
        setBalance(null);
        setBlockNumber(null);
      }
    };

    fetchChainData();
    const interval = setInterval(fetchChainData, 12000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userAddress, chainId]);

  const connectWallet = async () => {
    setError(null);
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask or Web3 browser extension not detected.");
      return;
    }

    setConnecting(true);
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const currentChainHex: string = await (window as any).ethereum.request({
        method: "eth_chainId",
      });

      const parsedChainId = parseInt(currentChainHex, 16);
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0], parsedChainId);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected.");
      } else {
        setError(err.message || "Wallet connection error.");
      }
    } finally {
      setConnecting(false);
    }
  };

  const copyAddress = () => {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        onDisconnect();
      } else if (accounts[0] !== userAddress) {
        eth.request({ method: "eth_chainId" }).then((chainHex: string) => {
          onConnect(accounts[0], parseInt(chainHex, 16));
        });
      }
    };

    const handleChainChanged = (chainHex: string) => {
      if (userAddress) {
        onConnect(userAddress, parseInt(chainHex, 16));
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [userAddress, onConnect, onDisconnect]);

  if (!userAddress) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-500/10 transition-all active:scale-[0.98]"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
          <Wallet className="w-3.5 h-3.5 text-indigo-300" />
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
      </div>
    );
  }

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  return (
    <div className="flex items-center gap-2.5">
      {/* Network & Block Ticker */}
      <div
        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
          isSepolia
            ? "bg-slate-900/90 border-slate-800 text-slate-300"
            : "bg-rose-950/40 border-rose-800/80 text-rose-300"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isSepolia ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400"
          }`}
        />
        <span>{isSepolia ? "Sepolia" : `Chain ${chainId}`}</span>
        {blockNumber && (
          <span className="text-[10px] text-slate-500 font-mono pl-1 border-l border-slate-800">
            #{blockNumber.toString().slice(-4)}
          </span>
        )}
      </div>

      {/* Account Capsule */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-1 transition-colors shadow-sm">
        {balance !== null && (
          <div className="px-2.5 py-1 text-xs font-mono font-medium text-slate-300 hidden md:block">
            {balance} <span className="text-slate-500">ETH</span>
          </div>
        )}

        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-mono transition"
          title="Click to copy address"
        >
          <span>{formatAddress(userAddress, 6, 4)}</span>
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400" />
          )}
        </button>

        <button
          onClick={onDisconnect}
          title="Disconnect session"
          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors ml-1 rounded-lg hover:bg-slate-800/50"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
