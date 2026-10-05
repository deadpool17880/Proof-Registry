import { RiskLevel } from "@/types/approval";
import { findKnownSpender } from "./knownSpenders";

// Threshold for unlimited approval: >= 2^128
const UNLIMITED_THRESHOLD = 340282366920938463463374607431768211455n;

// 30 days in seconds
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export interface RiskAnalysisResult {
  riskLevel: RiskLevel;
  riskReasons: string[];
  isUnlimited: boolean;
  isKnownSpender: boolean;
  isOld: boolean;
  spenderName?: string;
}

/**
 * Deterministic Risk Engine.
 * Evaluates token allowance characteristics according to rule priorities.
 */
export function analyzeApprovalRisk(
  spenderAddress: string,
  allowance: bigint,
  timestamp?: number
): RiskAnalysisResult {
  const isUnlimited = allowance >= UNLIMITED_THRESHOLD;
  const knownSpender = findKnownSpender(spenderAddress);
  const isKnownSpender = !!knownSpender;

  // Check age (if timestamp provided)
  const now = Math.floor(Date.now() / 1000);
  const isOld = timestamp ? now - timestamp > THIRTY_DAYS_SECONDS : false;

  const reasons: string[] = [];

  // Evaluate rules
  if (isUnlimited) {
    reasons.push("This spender has unlimited permission to use this token.");
  }

  if (!isKnownSpender) {
    reasons.push("This spender is not recognized as a known application.");
  }

  if (isOld) {
    reasons.push("This approval appears to be old. If you no longer use this application, consider revoking it.");
  }

  // Determine overall risk level
  let riskLevel: RiskLevel = "LOW";

  if (isUnlimited) {
    // Unlimited is always HIGH risk, especially if unknown
    riskLevel = "HIGH";
  } else if (!isKnownSpender) {
    // Limited, but unknown application
    riskLevel = "MEDIUM";
  } else if (isOld) {
    // Known and limited, but old
    riskLevel = "MEDIUM";
  } else {
    // Limited and recognized
    riskLevel = "LOW";
    reasons.push("This is a limited approval for a recognized spender.");
  }

  return {
    riskLevel,
    riskReasons: reasons,
    isUnlimited,
    isKnownSpender,
    isOld,
    spenderName: knownSpender?.name,
  };
}
