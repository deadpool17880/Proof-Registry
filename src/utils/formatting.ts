import { formatUnits } from "viem";

/**
 * Shorten an Ethereum address (e.g. 0x1234...5678)
 */
export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length < start + end) return address || "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format allowance into human readable text with symbol
 */
export function formatAllowance(allowance: bigint, decimals: number, symbol: string): string {
  // If allowance >= 2^128 or near max uint256, it's unlimited
  const MAX_UINT128 = 340282366920938463463374607431768211455n;
  if (allowance >= MAX_UINT128) {
    return "UNLIMITED";
  }

  try {
    const formatted = formatUnits(allowance, decimals);
    const num = parseFloat(formatted);
    if (isNaN(num)) return formatted;
    
    // Format nicely with up to 4 decimal places
    const displayNum = num > 10000 
      ? num.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : num.toLocaleString(undefined, { maximumFractionDigits: 4 });
      
    return `${displayNum} ${symbol}`;
  } catch {
    return `${allowance.toString()} (raw)`;
  }
}

/**
 * Return Sepolia Etherscan URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}

/**
 * Return Sepolia Etherscan URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
