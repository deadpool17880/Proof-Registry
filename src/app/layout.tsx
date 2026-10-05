import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token Approval Security Manager | Ethereum Sepolia",
  description: "Identify, analyze with AI, and revoke risky ERC-20 token approvals on Ethereum Sepolia testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
