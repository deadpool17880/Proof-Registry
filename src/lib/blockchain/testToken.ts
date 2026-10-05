import { Address, getAddress, maxUint256, parseUnits } from "viem";
import { getWalletClient, publicClient } from "./client";
import compiled from "./TestTokenCompiled.json";

export const TEST_TOKEN_ABI = compiled.abi;
export const TEST_TOKEN_BYTECODE = ("0x" + compiled.bytecode) as `0x${string}`;

// Fallback deployed test token address if one has already been deployed
export const DEFAULT_TEST_TOKEN: Address = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC

// Random unknown spender address for testing risk detection
export const TEST_UNKNOWN_SPENDER: Address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
// Known spender for testing (Uniswap V3 SwapRouter02)
export const TEST_KNOWN_SPENDER: Address = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

/**
 * Deploy a fresh SecurityTestToken contract to Sepolia via user wallet
 */
export async function deployTestToken(userAddress: string): Promise<Address> {
  const walletClient = getWalletClient();
  const account = getAddress(userAddress);

  const hash = await walletClient.deployContract({
    abi: TEST_TOKEN_ABI,
    bytecode: TEST_TOKEN_BYTECODE,
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) {
    throw new Error("Failed to deploy test token: no contract address in receipt");
  }

  // Save in localStorage as active custom token
  if (typeof window !== "undefined") {
    localStorage.setItem("custom_test_token", receipt.contractAddress);
  }

  return receipt.contractAddress;
}

/**
 * Mint 1,000 test tokens using the faucet() method
 */
export async function claimTestFaucet(tokenAddress: string, userAddress: string): Promise<string> {
  const walletClient = getWalletClient();
  const account = getAddress(userAddress);
  const token = getAddress(tokenAddress);

  const hash = await walletClient.writeContract({
    address: token,
    abi: TEST_TOKEN_ABI,
    functionName: "faucet",
    account,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Create a test approval (Unlimited or Limited)
 */
export async function createTestApproval(
  tokenAddress: string,
  spenderAddress: string,
  userAddress: string,
  isUnlimited = true
): Promise<string> {
  const walletClient = getWalletClient();
  const account = getAddress(userAddress);
  const token = getAddress(tokenAddress);
  const spender = getAddress(spenderAddress);

  const amount = isUnlimited ? maxUint256 : parseUnits("100", 18);

  const hash = await walletClient.writeContract({
    address: token,
    abi: TEST_TOKEN_ABI,
    functionName: "approve",
    args: [spender, amount],
    account,
  });

  await publicClient.waitForTransactionReceipt({ hash });

  // Store in tracked approvals for immediate local discovery
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(localStorage.getItem("tracked_approvals") || "[]");
      const key = `${token.toLowerCase()}-${spender.toLowerCase()}`;
      const filtered = existing.filter(
        (p: any) => `${p.tokenAddress?.toLowerCase()}-${p.spenderAddress?.toLowerCase()}` !== key
      );
      filtered.push({
        tokenAddress: token,
        spenderAddress: spender,
        timestamp: Math.floor(Date.now() / 1000),
      });
      localStorage.setItem("tracked_approvals", JSON.stringify(filtered));
    } catch {
      // Ignore localStorage error
    }
  }

  return hash;
}
