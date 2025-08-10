# AquaNode

Turn on-chain data into explained, automated actions in minutes.

AquaNode is a no‑code workflow builder on top of The Graph Token API. Compose data blocks (Balances, Transfers, Swaps, Token Metadata), add logic (Conditional), generate AI explanations, and deliver reports (Email/Cron) – all in a Next.js app.

# Overview

AquaNode helps ops/growth/treasury teams turn raw on‑chain events into readable, actionable updates. It hides API plumbing, adds human‑friendly condition presets, and uses AI to summarize signals before sending to email or other channels.

## Features

- Visual workflows (drag‑and‑drop) with server‑side integrations
- Crypto‑native data blocks using The Graph Token API
- Conditional presets and time‑window helpers
- AI Explanation block (Gemini) for narratives/recommendations
- Email delivery (Resend) and scheduling (Cron)
- Template library (Whale Transfer Alert, Swap Activity Monitor, Daily Wallet Digest)

## Architecture

High‑level components:

- Client (Next.js/React)
  - Workflow Builder UI and Runner (`frontend/src/app/services/workflowEngine.js`)
  - Local workflow storage (`frontend/src/app/services/localWorkflowService.js`)
  - Auth/Embedded Wallet via `PrivyProvider`
- Server (Next.js App Routes)
  - `/api/graph/token` – proxy to Token API (server‑side auth)
  - `/api/email` – relay to Resend
  - `/api/ai` (optional) – Gemini wrapper
- External services
  - The Graph Token API (`https://token-api.thegraph.com`)
  - Resend Email API
  - Gemini (AI)

Data flow:

1) UI defines a workflow → saves locally
2) Runner executes blocks → calls `/api/graph/token`
3) Applies Conditional presets → requests AI summary → sends via `/api/email`
4) Results are shown in UI and delivered to inbox

## Tech Stack

- App: Next.js (App Router), React
- Styling: Tailwind (existing project setup)
- On-chain Data: The Graph Token API, Uniswap Subgraph (optional)
- AI: Gemini AI
- Email Provider: Resend

## Quick start

Prerequisites: Node 18+, pnpm/npm, API keys (see below)

```bash
# from project root
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

## Environment variables

Create `.env` (in `frontend/`) with the following:

```
# Privy API Key
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_APP_SCRET=

# The Graph Token API (prefer server var)
THE_GRAPH_API_KEY=your_token_api_key
# Client fallback for dev helpers
NEXT_PUBLIC_THE_GRAPH_API_KEY=your_token_api_key

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev  # or a verified domain sender

# Gemini (optional)
GEMINI_API_KEY=your_gemini_key
```

Notes:

- `/api/graph/token` prefers `THE_GRAPH_API_KEY` (server‑side) and falls back to `NEXT_PUBLIC_*` for local development.
- `/api/email` requires `RESEND_API_KEY`. With `dryRun` enabled in the Send Email block, emails simulate without sending.

## Run the app

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. Use “Create Workflow” or pick a Template.

## Using the Workflow Builder

1) Drag blocks from the left palette onto the canvas
2) Configure each block on the right sidebar
3) Click Save → Run (or open the workflow detail page and Run Once)

Tips:

- Time range presets (Last 1h/24h/7d/30d/All) auto‑fill start/end for event blocks
- Network IDs follow Token API: `mainnet`, `arbitrum-one`, `avalanche`, `base`, `bsc`, `matic`, `optimism`, `unichain`
- Conditional block: Quick Presets appear based on the previous block type
- AI + Email: place AI before Email or use `{{AI.response.*}}` aliases in email body

## Built‑in Blocks

### Data

- Balances by Address – GET `/balances/evm/{address}`
- Transfer Events – GET `/transfers/evm`
- Swap Events – GET `/swaps/evm`
- Token Metadata – GET `/tokens/evm/{contract}`
- Token Price Info Data -

### Logic & Actions

- Conditional (IF): presets (e.g., amount > X), time windows, user‑friendly paths
- AI Explanation: summarizes into narratives & recommendations
- Send Email: Resend delivery (supports templating)
- Cronjob: schedule runs (e.g., daily digest)

### Email Placeholder Cheatsheet

- Workflow meta: `{{WORKFLOW.name}}`, `{{WORKFLOW.id}}`
- Latest AI block: `{{AI.response.explanation}}`, `{{AI.response.insights}}`, `{{AI.response.recommendations}}`
- Previous block leaf (when Email follows the target): `{{previous.data.data.0.value}}`

Default subject/body include workflow name and AI content out of the box.

## API routes

- `/api/graph/token`
  - Proxy to Token API with Bearer auth
  - Actions: `balancesByAddress`, `transferEvents`, `tokenHolders`, `tokenMetadata`, `liquidityPools`, `swapEvents`, `nftActivities`, `nftCollection`
- `/api/email`
  - Sends via Resend; supports `dryRun`
- `/api/ai` (optional)
  - Wraps Gemini for AI Explanation

## Security & keys

- Keys never leave server routes
- The Graph: use `THE_GRAPH_API_KEY` (server); client `NEXT_PUBLIC_*` for dev only
- Email: `RESEND_API_KEY` server‑side; use `dryRun` while testing

## Templates

Included example workflows:

- Whale Transfer Alert – filter large transfers → AI → email
- Swap Activity Monitor – watch pool activity → AI → email
- Daily Portfolio Digest – balances + metadata → AI digest → email (cron)

## Roadmap

- Field tree picker + aggregates (count/sum) in Conditional
- Slack/Discord/Webhooks outbound channels
- Team workspaces & versioning
- Template marketplace & premium integrations
