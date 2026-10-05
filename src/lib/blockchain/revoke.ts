import { Address, getAddress } from "viem";
import { getWalletClient, publicClient, ERC20_ABI } from "./client";

export interface RevokeResult {
  success: boolean;
  txHash: string;
  error?: string;
}

/**
 * Revoke an ERC-20 approval by setting allowance to 0.
 * Transaction is signed and submitted via the user's connected wallet (MetaMask).
 */
export async function revokeApproval(
  tokenAddress: string,
  spenderAddress: string,
  userAddress: string
): Promise<RevokeResult> {
  try {
    const walletClient = getWalletClient();
    const token = getAddress(tokenAddress);
    const spender = getAddress(spenderAddress);
    const account = getAddress(userAddress);

    // Call approve(spender, 0)
    const hash = await walletClient.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, 0n],
      account,
    });

    // Wait for Sepolia transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status !== "success") {
      return {
        success: false,
        txHash: hash,
        error: "Transaction reverted on chain.",
      };
    }

    return {
      success: true,
      txHash: hash,
    };
  } catch (err: any) {
    console.error("Revoke approval failed:", err);
    let message = err?.shortMessage || err?.message || "Failed to submit revoke transaction";
    if (err?.code === 4001 || err?.message?.includes("rejected")) {
      message = "User rejected the transaction in MetaMask.";
    }
    return {
      success: false,
      txHash: "",
      error: message,
    };
  }
}
