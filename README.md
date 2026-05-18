# FlightShield — Parametric Flight Insurance on Stellar

Buy flight-delay coverage with USDC. If your flight is delayed beyond the threshold, the smart contract pays you automatically — no forms, no adjusters, no waiting.

Built on Stellar / Soroban for the hackathon MVP.

---

## How it works

1. Search for your flight and get an instant premium quote
2. Pay the premium in USDC via your Freighter wallet
3. A policy NFT is minted as your on-chain proof of coverage
4. An oracle backend monitors flight APIs in real time
5. If delay > threshold (default 2 hours), the contract releases your payout instantly

**Example:** pay 15 USDC → flight delayed 4 hours → receive 120 USDC automatically.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Blockchain | Stellar Soroban (`@stellar/stellar-sdk`) |
| State | Zustand |
| Network | Stellar Testnet |

---

## Pages

- `/` — landing page: how it works, premium tiers, supported airlines
- `/buy` — flight search, premium quote, policy purchase
- `/dashboard` — active policies, payout history, NFT receipts

---

## Getting started

### Prerequisites

- Node.js 18+
- [Freighter wallet](https://freighter.app) browser extension (testnet mode)
- Testnet USDC — get some from the [Stellar Laboratory](https://laboratory.stellar.org)

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local` and fill in your contract addresses:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_POOL_CONTRACT_ID=<insurance pool contract>
NEXT_PUBLIC_ORACLE_CONTRACT_ID=<oracle verifier contract>
NEXT_PUBLIC_NFT_CONTRACT_ID=<policy NFT contract>
NEXT_PUBLIC_USDC_ADDRESS=<USDC asset contract>
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

## Smart contracts

| Contract | Purpose |
|---|---|
| Insurance Pool | Holds USDC liquidity, creates policies, triggers payouts |
| Oracle Verifier | Validates signed flight-delay proofs (3-of-5 quorum) |
| Policy NFT | Mints transferable NFT receipt per policy |
| Governance *(future)* | DAO voting over pricing and oracle parameters |

Contracts are written in Rust using the Soroban SDK. Source lives in `../contracts/`.

---

## Oracle architecture

Smart contracts can't call external APIs directly. An off-chain oracle service bridges flight data to the chain:

```
Flight APIs → Oracle Backend → Sign delay data → Submit to Soroban → Contract verifies → Payout
```

Supported data providers: AviationStack, FlightAware, AeroDataBox, OpenSky.

Security: signed payloads + 3-of-5 quorum consensus + stake slashing for malicious oracles.

---

## Project structure

```
frontend/
├── app/
│   ├── page.tsx          # Landing page
│   ├── buy/page.tsx      # Buy insurance flow
│   └── dashboard/page.tsx
├── components/
│   ├── FlightSearch.tsx
│   ├── PremiumQuote.tsx
│   ├── PolicyCard.tsx
│   └── WalletConnect.tsx
├── hooks/
│   ├── useWallet.ts
│   ├── usePolicy.ts
│   └── usePool.ts
└── lib/
    ├── soroban.ts        # Contract interaction helpers
    ├── api.ts            # Oracle backend client
    └── store.ts          # Zustand store
```

---

## Roadmap

| Phase | Scope |
|---|---|
| MVP (now) | Single airline, fixed premium, USDC payouts, basic dashboard |
| Phase 2 | Dynamic pricing, airline risk scoring, LP vaults |
| Phase 3 | DAO governance, decentralized oracle network, NFT marketplace |
