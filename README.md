# 🛡️ Token Approval Security Manager

> **A real-time Web3 security dApp that audits active ERC-20 token approvals on Ethereum Sepolia, identifies risky & unlimited permissions with deterministic rules, explains risks using AI, and enables one-click or batch revocation directly from your browser wallet.**

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![viem](https://img.shields.io/badge/viem-2.21-indigo)
![Network](https://img.shields.io/badge/Network-Ethereum_Sepolia_(11155111)-purple)

---

## 🌟 Overview

When interacting with decentralized applications (DEXes, NFT marketplaces, staking protocols), users grant **ERC-20 token approvals** via `approve(spender, amount)`. Most dApps request **unlimited allowances** (`2^256 - 1`) for UX convenience so users don't need to sign every trade. 

However, if a spender contract is exploited, has malicious upgradeability, or is an unknown phishing contract, **any approved tokens can be drained directly from your wallet without additional confirmation**.

**Token Approval Security Manager** solves this problem on the **Ethereum Sepolia testnet**:
1. **Discovers all active token approvals** for any connected MetaMask/injected wallet.
2. **Deterministic Risk Engine**: Automatically categorizes approvals as **HIGH**, **MEDIUM**, or **LOW** risk based on allowance size, known protocol registries, and approval age.
3. **AI Risk Explanations**: Uses an AI engine to translate complex blockchain permissions into plain, actionable advice.
4. **On-Chain Revocation**: Submits real `approve(spender, 0)` transactions to Sepolia, verified on block explorers.
5. **Batch Revocation**: Sequentially revokes multiple risky allowances in one organized flow.
6. **New Unlimited Approval Detection**: Alerts you whenever a new unlimited allowance appears on your wallet.
7. **Testnet Demo Playground**: Built-in test token faucet and approval creator so judges and developers can test the full lifecycle in seconds.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │    User with MetaMask   │
                    └────────────┬────────────┘
                                 │
                     Connects & Signs Tx
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│               Frontend (Next.js 14 + Tailwind CSS)              │
│                                                                 │
│  ┌───────────────────────┐             ┌─────────────────────┐  │
│  │ WalletConnect & State │             │ ApprovalTable (UI)  │  │
│  └───────────┬───────────┘             └──────────┬──────────┘  │
│              │                                    │             │
│              ▼                                    ▼             │
│  ┌───────────────────────┐             ┌─────────────────────┐  │
│  │    Network Enforcer   │             │ RiskBadge / Revoke  │  │
│  │  (Sepolia: 11155111)  │             │ / BatchRevoke UI    │  │
│  └───────────────────────┘             └──────────┬──────────┘  │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                                                    ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│   Server-Side AI API    │             │   viem Blockchain Layer │
│   /api/ai/explain       │             │   (Sepolia RPC)         │
│   (Secures AI_API_KEY)  │             │   - eth_getLogs         │
└─────────────────────────┘             │   - allowance(o, s)     │
                                        │   - approve(spender, 0) │
                                        └───────────┬─────────────┘
                                                    │
                                                    ▼
                                        ┌─────────────────────────┐
                                        │  Ethereum Sepolia Chain │
                                        │  - Real ERC-20 Tokens   │
                                        │  - Verified Explorers   │
                                        └─────────────────────────┘
```

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org) v18+ or v20+ or v22+
- A Web3 Browser Wallet ([MetaMask](https://metamask.io))
- A little free Sepolia test ETH ([Sepolia Faucets](#-getting-sepolia-test-tokens))

### 1. Clone & Install
```bash
git clone https://github.com/deadpool17880/Proof-Registry.git
cd Proof-Registry
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```ini
# Ethereum Sepolia RPC URL (public node or your Alchemy/Infura endpoint)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# AI API Key for risk explanations (Gemini or OpenAI-compatible)
AI_API_KEY=your_gemini_or_openai_api_key_here
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.5-flash
```
*(Note: If `AI_API_KEY` is left blank, the app will gracefully fall back to deterministic explanations without crashing!)*

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⛽ Getting Sepolia Test Tokens
Sepolia test ETH is 100% free and has no monetary value. You only need a few cents' worth of test ETH (~0.01 ETH) to pay gas for revoke transactions:
- **[Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)** (Instant with Google login)
- **[QuickNode Sepolia Faucet](https://faucet.quicknode.com/ethereum/sepolia)**
- **[Sepolia PoW Faucet](https://sepolia-faucet.pk910.de)** (Mines in browser tab)

---

## 🔍 How It Works

### 1. Approval Discovery
- Scans Sepolia event logs for `Approval(address indexed owner, address indexed spender, uint256 value)` emitted by ERC-20 tokens where `owner == userAddress`.
- Enriches discovery with popular Sepolia tokens (USDC, USDT, DAI, LINK, WETH) and Blockscout logs.
- Queries the live, authoritative `allowance(owner, spender)` on the token smart contract.
- Any allowance of `0` is treated as inactive/revoked and filtered out.

### 2. Deterministic Risk Engine (`src/lib/risk/analyzer.ts`)
The risk level is **never** left to AI guesswork; it is computed by explicit rules:
- **Rule A (UNLIMITED)**: If allowance $\ge 2^{128}$ or equals `MaxUint256` $\rightarrow$ **HIGH RISK** (`"This spender has unlimited permission to use this token."`).
- **Rule B (UNKNOWN SPENDER)**: If the spender is not in the verified spender registry $\rightarrow$ **HIGH / MEDIUM RISK** (`"This spender is not recognized as a known application."`).
- **Rule C (OLD APPROVAL)**: If granted $> 30$ days ago $\rightarrow$ **MEDIUM RISK** (`"This approval appears to be old. Consider revoking if no longer in use."`).
- **Rule D (NORMAL LIMITED)**: If limited and known $\rightarrow$ **LOW RISK** (`"This is a limited approval for a recognized spender."`).

### 3. Known Spenders Registry (`src/lib/risk/knownSpenders.ts`)
Verified Sepolia protocol contracts:
- **Uniswap V3 SwapRouter02**: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- **Uniswap V3 SwapRouter**: `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- **Uniswap V2 Router02**: `0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008`
- **Aave V3 Pool (Sepolia)**: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- **OpenSea Seaport 1.5**: `0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC`
- **1inch Router v5**: `0x1111111254EEB25477B68fb85Ed929f73A960582`

### 4. Revocation Engine
- Submits an ERC-20 `approve(spender, 0)` transaction directly from the user's wallet via `viem`.
- Waits for 1 block confirmation on Sepolia.
- Re-reads `allowance(owner, spender)` to verify it dropped to 0 and removes the row.

---

## 🧪 Testing & Demo Walkthrough

Don't have active approvals on your Sepolia wallet? We included a built-in **Testnet Demo Playground**:

1. Click **Connect Wallet** in the top right.
2. In the **Testnet Demonstration Helper** section, click **Open Demo Playground**.
3. Click **Mint 1,000 STK** to get test tokens from the contract's public faucet.
4. Click **Create Unlimited Approval** (approves an unknown contract with max allowance).
5. Watch the dashboard instantly update:
   - 🚨 The **New Unlimited Approval Alert** pops up.
   - The token appears in the table marked with a red **HIGH RISK** badge.
6. Click **Explain Risk with AI** to view the AI analysis.
7. Click **Revoke**:
   - Confirm the transaction in MetaMask.
   - The confirmation link will appear with a direct link to Sepolia Etherscan!
   - The allowance drops to 0 and the approval is removed.

---

## 🔒 Security Principles

- **Zero Private Keys Stored**: The application never touches or requests private keys or seed phrases.
- **Explicit User Signing**: Every revoke transaction must be explicitly reviewed and confirmed in the user's wallet.
- **Server-Side AI Secrets**: The `AI_API_KEY` lives strictly in server-side Next.js route handlers (`/api/ai/explain`) and is never exposed in browser bundles.
- **Fail-Safe Operation**: If the AI service is unavailable, the application continues to function 100% using deterministic rules.

---

## 📦 Project Structure

```
├── contracts/
│   ├── RecordRegistry.sol          # Hackathon proof registry contract
│   └── TestToken.sol               # ERC-20 testnet token with public faucet
├── src/
│   ├── app/
│   │   ├── api/ai/explain/route.ts # Server-side AI risk explanation endpoint
│   │   ├── globals.css             # Tailwind base & theme
│   │   ├── layout.tsx              # Root HTML & metadata
│   │   └── page.tsx                # Main Security Dashboard
│   ├── components/
│   │   ├── ApprovalRow.tsx         # Individual approval table row
│   │   ├── ApprovalTable.tsx       # Approval list, search & filters
│   │   ├── BatchRevoke.tsx         # Multi-approval sequential revocation
│   │   ├── DemoHelper.tsx          # Faucet & test approval playground
│   │   ├── NetworkWarning.tsx      # Wrong network detection banner
│   │   ├── NewApprovalAlert.tsx    # Real-time monitoring alert
│   │   ├── RevokeButton.tsx        # Revoke action with confirmation modal
│   │   ├── RiskBadge.tsx           # HIGH / MEDIUM / LOW status pill
│   │   ├── RiskExplanation.tsx     # AI & deterministic risk explanation modal
│   │   └── WalletConnect.tsx       # MetaMask connection & Sepolia detection
│   ├── lib/
│   │   ├── ai/explainRisk.ts       # Client wrapper for AI API
│   │   ├── blockchain/
│   │   │   ├── client.ts           # Viem public & wallet clients
│   │   │   ├── approvals.ts        # Approval discovery & allowance querying
│   │   │   ├── revoke.ts           # Revocation transaction handler
│   │   │   └── testToken.ts        # TestToken deploy & approval helper
│   │   └── risk/
│   │       ├── analyzer.ts         # Deterministic rule engine
│   │       └── knownSpenders.ts    # Verified protocol address registry
│   ├── types/
│   │   └── approval.ts             # TypeScript definitions
│   └── utils/
│       └── formatting.ts           # Formatting for addresses, tokens & explorers
├── .env.example                    # Sample environment template
├── .gitignore                      # Git ignore protecting secrets & builds
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Dependencies & build scripts
├── postcss.config.js               # PostCSS config
├── tailwind.config.js              # Tailwind styling config
└── tsconfig.json                   # TypeScript configuration
```

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New → Project**.
3. Select your repository: `Proof-Registry`.
4. Under **Environment Variables**, add:
   - `SEPOLIA_RPC_URL` = `https://ethereum-sepolia-rpc.publicnode.com`
   - `AI_API_KEY` = your AI API key
   - `AI_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta/openai`
   - `AI_MODEL` = `gemini-2.5-flash`
5. Click **Deploy**. Your dApp will be live on an HTTPS domain within minutes!

---

## 📜 License
MIT License. Built for the INNOBLOCK 2.0 Blockchain Hackathon.
