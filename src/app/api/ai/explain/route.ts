import { NextRequest, NextResponse } from "next/server";

interface AIExplainRequest {
  tokenSymbol: string;
  spenderAddress: string;
  spenderName?: string;
  allowanceFormatted: string;
  isUnlimited: boolean;
  isKnownSpender: boolean;
  riskLevel: string;
  riskReasons: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIExplainRequest;
    const {
      tokenSymbol,
      spenderAddress,
      spenderName,
      allowanceFormatted,
      isUnlimited,
      isKnownSpender,
      riskLevel,
      riskReasons,
    } = body;

    // Check if AI API key is configured
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai";
    const model = process.env.AI_MODEL || "gemini-2.5-flash";

    // Fallback deterministic explanation if no API key is provided
    if (!apiKey) {
      return NextResponse.json({
        explanation: generateFallbackExplanation(body),
        isAiGenerated: false,
      });
    }

    const systemPrompt = `You are an expert blockchain security auditor for Token Approval Security Manager on Ethereum Sepolia.
Your job is to explain the risks of active ERC-20 token approvals to users in plain, concise English (2-3 sentences).
Rules:
1. Only explain the facts provided. Never invent or hallucinate blockchain history.
2. If the allowance is UNLIMITED, explain that the contract has permission to transfer all of the user's ${tokenSymbol} at any time.
3. If the spender is UNKNOWN, warn that it is not recognized in the application's verified spender registry.
4. Conclude with actionable advice (e.g. recommend revoking if not actively trading or interacting with the contract).
5. Start with a relevant icon (⚠️ for HIGH, ⚡ for MEDIUM, ℹ️ for LOW).`;

    const userPrompt = `Analyze this active ERC-20 token approval:
- Token: ${tokenSymbol}
- Spender Address: ${spenderAddress}
- Known Spender: ${isKnownSpender ? `Yes (${spenderName || "Verified Protocol"})` : "No (Unknown / Unrecognized Contract)"}
- Allowance: ${allowanceFormatted} ${isUnlimited ? "(UNLIMITED / Max uint256)" : ""}
- Evaluated Risk Level: ${riskLevel}
- Deterministic Flag Reasons: ${riskReasons.join("; ")}

Explain why this approval deserves attention and what action the user should take.`;

    // Call OpenAI-compatible / Gemini chat completions endpoint
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.warn(`AI Provider returned error status ${response.status}. Using fallback explanation.`);
      return NextResponse.json({
        explanation: generateFallbackExplanation(body),
        isAiGenerated: false,
      });
    }

    const data = await response.json();
    const explanation = data?.choices?.[0]?.message?.content?.trim();

    if (!explanation) {
      return NextResponse.json({
        explanation: generateFallbackExplanation(body),
        isAiGenerated: false,
      });
    }

    return NextResponse.json({
      explanation,
      isAiGenerated: true,
    });
  } catch (error: any) {
    console.error("AI Explanation error:", error);
    return NextResponse.json({
      explanation: "⚠️ Unable to generate dynamic AI explanation. Please rely on the deterministic risk indicators and consider revoking if the contract is unfamiliar.",
      isAiGenerated: false,
    });
  }
}

/**
 * Deterministic fallback generator when AI API key is not present or offline
 */
function generateFallbackExplanation(data: AIExplainRequest): string {
  const parts: string[] = [];

  if (data.riskLevel === "HIGH") {
    parts.push("⚠️ High Risk Approval:");
  } else if (data.riskLevel === "MEDIUM") {
    parts.push("⚡ Moderate Risk Approval:");
  } else {
    parts.push("ℹ️ Safe / Limited Approval:");
  }

  if (data.isUnlimited) {
    parts.push(
      `This approval grants the spender unlimited access to your ${data.tokenSymbol}. If the spender contract has vulnerabilities or acts maliciously, it can transfer all your ${data.tokenSymbol} without asking for additional signatures.`
    );
  } else {
    parts.push(
      `This approval allows the spender to transfer up to ${data.allowanceFormatted}.`
    );
  }

  if (!data.isKnownSpender) {
    parts.push(
      `The spender (${data.spenderAddress.slice(0, 8)}...) is NOT recognized by the trusted protocol registry.`
    );
  } else {
    parts.push(
      `The spender is recognized as ${data.spenderName || "a verified protocol"}.`
    );
  }

  parts.push("If you are no longer actively using this service, revoking this approval is the safest practice.");

  return parts.join(" ");
}
