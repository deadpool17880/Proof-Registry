import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    network: "Ethereum Sepolia",
    chainId: 11155111,
    contract: "0x6257897806a3825590bB75b0024dEeff7481Acaa",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
