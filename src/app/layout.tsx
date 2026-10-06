import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proof Registry | Token Approval Security Manager",
  description: "Real-time ERC-20 approval audit, deterministic risk heuristic engine, and permission revocation for Ethereum Sepolia.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f17] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
