"use client";

import React, { useEffect, useState } from "react";
import { formatAddress } from "@/utils/formatting";
import { SEPOLIA_CHAIN_ID } from "@/lib/blockchain/client";
import { Wallet, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  // Load balance when connected to Sepolia
  useEffect(() => {
    let active = true;
    const fetchBalance = async () => {
      if (userAddress && chainId === SEPOLIA_CHAIN_ID) {
        try {
          const bal = await publicClient.getBalance({ address: userAddress as any });
          if (active) {
            setBalance(parseFloat(formatEther(bal)).toFixed(4));
          }
        } catch {
          if (active) setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };
    fetchBalance();
    return () => {
      active = false;
    };
  }, [userAddress, chainId]);

  const connectWallet = async () => {
    setError(null);
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask or compatible Web3 wallet not detected. Please install MetaMask.");
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
        setError("Connection request rejected by user.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  };

  // Listen for account and chain changes from wallet
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
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Wallet className="w-4 h-4" />
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
      </div>
    );
  }

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  return (
    <div className="flex items-center gap-3">
      {/* Network Badge */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
          isSepolia
            ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
            : "bg-red-950/60 border-red-700/60 text-red-300"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isSepolia ? "bg-emerald-400 animate-pulse" : "bg-red-400"
          }`}
        />
        {isSepolia ? "Sepolia Testnet" : `Chain ID: ${chainId || "Unknown"}`}
      </div>

      {/* Wallet info */}
      <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-xl text-sm shadow">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            Ξ
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-medium text-slate-200">
              {formatAddress(userAddress)}
            </span>
            {balance !== null && (
              <span className="text-xs text-slate-400">
                {balance} Sepolia ETH
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onDisconnect}
          title="Disconnect wallet"
          className="ml-2 text-slate-400 hover:text-red-400 transition-colors p-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
