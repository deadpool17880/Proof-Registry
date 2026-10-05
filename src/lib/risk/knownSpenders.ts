import { KnownSpender } from "@/types/approval";

/**
 * Registry of recognized, audited, or standard contracts on Ethereum Sepolia.
 * Addresses are matched case-insensitively.
 */
export const KNOWN_SPENDERS: KnownSpender[] = [
  {
    address: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    name: "Uniswap V3: SwapRouter02",
    protocol: "Uniswap",
    verified: true,
  },
  {
    address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    name: "Uniswap V3: SwapRouter",
    protocol: "Uniswap",
    verified: true,
  },
  {
    address: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
    name: "Uniswap V2: Router02",
    protocol: "Uniswap",
    verified: true,
  },
  {
    address: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    name: "Aave V3: Pool (Sepolia)",
    protocol: "Aave",
    verified: true,
  },
  {
    address: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
    name: "OpenSea: Seaport 1.5",
    protocol: "OpenSea",
    verified: true,
  },
  {
    address: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    name: "1inch: Aggregation Router v5",
    protocol: "1inch",
    verified: true,
  },
  {
    // Our deployed test contract address from previous step for easy demo testing
    address: "0x6257897806a3825590bB75b0024dEeff7481Acaa",
    name: "InnoBlock Demo Registry",
    protocol: "GCET Hackathon",
    verified: true,
  },
];

/**
 * Find known spender by address (case-insensitive)
 */
export function findKnownSpender(address: string): KnownSpender | undefined {
  if (!address) return undefined;
  const target = address.toLowerCase();
  return KNOWN_SPENDERS.find((s) => s.address.toLowerCase() === target);
}
