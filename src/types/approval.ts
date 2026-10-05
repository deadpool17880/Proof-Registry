export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type Approval = {
  id: string; // unique key e.g. tokenAddress-spenderAddress
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  spenderAddress: string;
  spenderName?: string;
  allowance: bigint;
  isUnlimited: boolean;
  isKnownSpender: boolean;
  isOld?: boolean;
  timestamp?: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
};

export type KnownSpender = {
  address: string;
  name: string;
  protocol?: string;
  verified: boolean;
};

export type RevokeProgress = {
  current: number;
  total: number;
  status: "idle" | "in_progress" | "success" | "error";
  activeTokenSymbol?: string;
  errorMessage?: string;
};
