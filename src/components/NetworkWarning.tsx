import React from "react";
import { AlertOctagon, ArrowRight } from "lucide-react";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "@/lib/blockchain/client";

interface NetworkWarningProps {
  currentChainId: number | null;
  onSwitchSuccess: () => void;
}

export const NetworkWarning: React.FC<NetworkWarningProps> = ({
  currentChainId,
  onSwitchSuccess,
}) => {
  const [switching, setSwitching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (currentChainId === null || currentChainId === SEPOLIA_CHAIN_ID) {
    return null;
  }

  const handleSwitch = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    setSwitching(true);
    setError(null);

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      onSwitchSuccess();
    } catch (err: any) {
      // 4902 = chain has not been added to MetaMask
      if (err.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: "Ethereum Sepolia",
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          onSwitchSuccess();
        } catch (addErr: any) {
          setError(addErr?.message || "Failed to add Sepolia network.");
        }
      } else {
        setError(err?.message || "Failed to switch network.");
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-red-950/80 border border-red-700/80 rounded-xl p-4 text-red-200 shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertOctagon className="w-6 h-6 text-red-400 shrink-0" />
        <div>
          <h4 className="font-semibold text-white">Wrong Network Detected</h4>
          <p className="text-sm text-red-200">
            This security manager runs strictly on the <span className="font-bold underline">Ethereum Sepolia Testnet</span>.
            Your wallet is currently connected to Chain ID <code className="bg-red-900/60 px-1.5 py-0.5 rounded text-xs">{currentChainId}</code>.
          </p>
          {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleSwitch}
        disabled={switching}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shrink-0 shadow"
      >
        {switching ? "Switching..." : "Switch to Sepolia"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
