import { createPublicClient, createWalletClient, custom, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const DEFAULT_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

// Standard ERC-20 ABI with necessary functions and events
export const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);

/**
 * Public client for querying Sepolia blockchain state
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(DEFAULT_SEPOLIA_RPC, {
    retryCount: 3,
    retryDelay: 1000,
  }),
});

/**
 * Get a WalletClient connected to the user's injected wallet (e.g. MetaMask)
 */
export function getWalletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
  return createWalletClient({
    chain: sepolia,
    transport: custom((window as any).ethereum),
  });
}
