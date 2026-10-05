import { Address, getAddress, parseAbiItem } from "viem";
import { publicClient, ERC20_ABI } from "./client";
import { Approval } from "@/types/approval";
import { analyzeApprovalRisk } from "../risk/analyzer";
import { KNOWN_SPENDERS } from "../risk/knownSpenders";

// Standard Sepolia test tokens to check for active allowances
export const POPULAR_SEPOLIA_TOKENS = [
  {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
    name: "USD Coin (Sepolia)",
    symbol: "USDC",
    decimals: 6,
  },
  {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789" as Address,
    name: "ChainLink Token",
    symbol: "LINK",
    decimals: 18,
  },
  {
    address: "0x3e622317f8C93f7328350cF0B56318C81852228e" as Address,
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
  },
  {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0" as Address,
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
  },
  {
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as Address,
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
  },
];

const APPROVAL_EVENT = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
);

interface DiscoveredPair {
  tokenAddress: Address;
  spenderAddress: Address;
  timestamp?: number;
}

/**
 * Scan Sepolia logs for Approval events originating from the user's address.
 */
async function scanApprovalLogs(ownerAddress: Address): Promise<DiscoveredPair[]> {
  const pairs: Map<string, DiscoveredPair> = new Map();

  try {
    const currentBlock = await publicClient.getBlockNumber();
    // Scan recent 25,000 blocks (~3.5 days of activity on Sepolia) to prevent RPC range limits
    const fromBlock = currentBlock > 25000n ? currentBlock - 25000n : 0n;

    const logs = await publicClient.getLogs({
      event: APPROVAL_EVENT,
      args: {
        owner: ownerAddress,
      },
      fromBlock,
      toBlock: "latest",
    });

    for (const log of logs) {
      if (log.address && log.args.spender) {
        const key = `${log.address.toLowerCase()}-${log.args.spender.toLowerCase()}`;
        pairs.set(key, {
          tokenAddress: getAddress(log.address),
          spenderAddress: getAddress(log.args.spender),
        });
      }
    }
  } catch (err) {
    console.warn("Log event scanning encountered RPC range or rate limit, falling back to targeted scan:", err);
  }

  // Also query Blockscout Sepolia public API for historical approval logs if available
  try {
    const blockscoutUrl = `https://eth-sepolia.blockscout.com/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&topic0=0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925&topic1=0x000000000000000000000000${ownerAddress.slice(2).toLowerCase()}`;
    const res = await fetch(blockscoutUrl, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.result)) {
        for (const item of data.result) {
          if (item.address && item.topics && item.topics[2]) {
            const rawSpender = "0x" + item.topics[2].slice(26);
            const tokenAddr = getAddress(item.address);
            const spenderAddr = getAddress(rawSpender);
            const key = `${tokenAddr.toLowerCase()}-${spenderAddr.toLowerCase()}`;
            const time = item.timeStamp ? parseInt(item.timeStamp, 16) || parseInt(item.timeStamp) : undefined;
            pairs.set(key, {
              tokenAddress: tokenAddr,
              spenderAddress: spenderAddr,
              timestamp: time,
            });
          }
        }
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // Check custom tracked tokens saved in localStorage or demo helper
  if (typeof window !== "undefined") {
    try {
      const customPairs = JSON.parse(localStorage.getItem("tracked_approvals") || "[]");
      for (const p of customPairs) {
        if (p.tokenAddress && p.spenderAddress) {
          const key = `${p.tokenAddress.toLowerCase()}-${p.spenderAddress.toLowerCase()}`;
          if (!pairs.has(key)) {
            pairs.set(key, {
              tokenAddress: getAddress(p.tokenAddress),
              spenderAddress: getAddress(p.spenderAddress),
              timestamp: p.timestamp,
            });
          }
        }
      }
    } catch {
      // Ignore localStorage parse error
    }
  }

  // Also cross-reference known spenders against popular Sepolia tokens
  for (const token of POPULAR_SEPOLIA_TOKENS) {
    for (const spender of KNOWN_SPENDERS) {
      const key = `${token.address.toLowerCase()}-${spender.address.toLowerCase()}`;
      if (!pairs.has(key)) {
        pairs.set(key, {
          tokenAddress: token.address,
          spenderAddress: spender.address as Address,
        });
      }
    }
  }

  return Array.from(pairs.values());
}

/**
 * Retrieve all currently ACTIVE token approvals for a connected Sepolia wallet.
 * Reads live on-chain allowance and filters out 0 allowance.
 */
export async function getActiveApprovals(ownerAddress: string): Promise<Approval[]> {
  const checksumOwner = getAddress(ownerAddress);
  const candidatePairs = await scanApprovalLogs(checksumOwner);
  const activeApprovals: Approval[] = [];

  // Batch query live allowance for candidate pairs
  for (const pair of candidatePairs) {
    try {
      const allowance = await publicClient.readContract({
        address: pair.tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [checksumOwner, pair.spenderAddress],
      });

      // Filter out zero / inactive allowances
      if (allowance <= 0n) {
        continue;
      }

      // Fetch token metadata
      let tokenName = "Unknown Token";
      let tokenSymbol = "TOKEN";
      let tokenDecimals = 18;

      const knownToken = POPULAR_SEPOLIA_TOKENS.find(
        (t) => t.address.toLowerCase() === pair.tokenAddress.toLowerCase()
      );

      if (knownToken) {
        tokenName = knownToken.name;
        tokenSymbol = knownToken.symbol;
        tokenDecimals = knownToken.decimals;
      } else {
        try {
          const [name, symbol, decimals] = await Promise.all([
            publicClient.readContract({
              address: pair.tokenAddress,
              abi: ERC20_ABI,
              functionName: "name",
            }),
            publicClient.readContract({
              address: pair.tokenAddress,
              abi: ERC20_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: pair.tokenAddress,
              abi: ERC20_ABI,
              functionName: "decimals",
            }),
          ]);
          tokenName = name;
          tokenSymbol = symbol;
          tokenDecimals = decimals;
        } catch {
          // Fallback to address formatting
          tokenSymbol = pair.tokenAddress.slice(0, 6);
        }
      }

      // Run deterministic risk engine
      const risk = analyzeApprovalRisk(pair.spenderAddress, allowance, pair.timestamp);

      activeApprovals.push({
        id: `${pair.tokenAddress.toLowerCase()}-${pair.spenderAddress.toLowerCase()}`,
        tokenName,
        tokenSymbol,
        tokenAddress: pair.tokenAddress,
        tokenDecimals,
        spenderAddress: pair.spenderAddress,
        spenderName: risk.spenderName,
        allowance,
        isUnlimited: risk.isUnlimited,
        isKnownSpender: risk.isKnownSpender,
        isOld: risk.isOld,
        timestamp: pair.timestamp,
        riskLevel: risk.riskLevel,
        riskReasons: risk.riskReasons,
      });
    } catch {
      // Contract might not implement ERC-20 interface or was self-destructed
      continue;
    }
  }

  // Sort by risk priority: HIGH first, then MEDIUM, then LOW
  const riskPriority: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  activeApprovals.sort((a, b) => riskPriority[b.riskLevel] - riskPriority[a.riskLevel]);

  return activeApprovals;
}
