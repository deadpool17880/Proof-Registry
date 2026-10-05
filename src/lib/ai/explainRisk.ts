import { Approval } from "@/types/approval";
import { formatAllowance } from "@/utils/formatting";

export interface AIExplanationResult {
  explanation: string;
  isAiGenerated: boolean;
}

/**
 * Request an AI risk explanation from the Next.js API route.
 * Never exposes API keys to client-side code.
 */
export async function getRiskExplanation(approval: Approval): Promise<AIExplanationResult> {
  try {
    const formatted = formatAllowance(approval.allowance, approval.tokenDecimals, approval.tokenSymbol);
    const res = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenSymbol: approval.tokenSymbol,
        spenderAddress: approval.spenderAddress,
        spenderName: approval.spenderName,
        allowanceFormatted: formatted,
        isUnlimited: approval.isUnlimited,
        isKnownSpender: approval.isKnownSpender,
        riskLevel: approval.riskLevel,
        riskReasons: approval.riskReasons,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      explanation: data.explanation || "No explanation provided.",
      isAiGenerated: !!data.isAiGenerated,
    };
  } catch (error) {
    console.warn("Falling back to local risk explanation:", error);
    return {
      explanation: `⚠️ Risk Alert: ${approval.riskReasons.join(" ")}`,
      isAiGenerated: false,
    };
  }
}
