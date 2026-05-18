# Backend Flow & Frontend Integration Guide

---

## What's Implemented in the Backend

### Process Overview

```
Flight APIs (AviationStack)
        │
        ▼
Oracle Poller (cron every 5 min)
  └─ queries active policies from DB
  └─ enqueues each flight → BullMQ
        │
        ▼
BullMQ Worker
  └─ fetches delay minutes from Flight API
  └─ calls submitter → signs + sends tx to Soroban oracle contract
  └─ persists result to oracle_updates table
        │
        ▼
Soroban Oracle Contract
  └─ accumulates node submissions
  └─ finalizes at quorum (3-of-5)
        │
        ▼
Soroban Insurance Pool Contract
  └─ trigger_payout() → pays user if delay ≥ threshold
```

---

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/auth/token` | — | Issue JWT from wallet address |
| `POST` | `/policies/quote` | — | Calculate premium for a flight |
| `GET` | `/policies/:wallet` | — | All policies for a wallet |
| `POST` | `/policies` | JWT | Record policy after on-chain purchase |
| `GET` | `/flights/:id/status` | — | Latest oracle update for a flight |
| `GET` | `/pool/reserve` | — | Total USDC in liquidity pool |
| `GET` | `/pool/position/:wallet` | — | LP position for a wallet |
| `POST` | `/pool/deposit` | JWT | Record LP deposit after on-chain tx |

---

### POST `/policies/quote` — Request / Response

```json
// Request
{
  "flightId": "AA123",
  "airlineIata": "AA",
  "originIata": "JFK",
  "destIata": "LAX",
  "payoutAmount": 100
}

// Response
{
  "premium": 32,
  "payoutAmount": 100,
  "delayProbability": 0.28,
  "riskTier": "medium"
}
```

---

### POST `/auth/token` — Request / Response

```json
// Request
{ "wallet": "GABC...XYZ" }

// Response
{ "token": "<jwt>" }
```

JWT expires in 24h. Include as `Authorization: Bearer <token>` on protected routes.

---

### Database Tables

```
policies        — mirrors on-chain policy state (policy_id, wallet, flight, premium, payout, status)
oracle_updates  — log of every oracle submission (flight_id, delay_minutes, node_address, tx_hash)
lp_positions    — LP deposit balances per wallet
```

---

### Environment Variables Required

```
PORT, JWT_SECRET
RPC_URL, NETWORK_PASSPHRASE
ORACLE_CONTRACT_ID, POOL_CONTRACT_ID, ORACLE_SECRET_KEY
FLIGHT_API_KEY, FLIGHT_API_URL
DATABASE_URL, REDIS_URL
POLL_INTERVAL_MINUTES
```

---

## How the Frontend Should Be Implemented

### Stack (from spec)
Next.js · Tailwind CSS · Freighter wallet · Zustand · Recharts

---

### Pages & Flow

#### 1. Landing `/`
Static. Explain the product, link to `/buy`.

#### 2. Buy Insurance `/buy`

```
1. User connects Freighter wallet
        ↓
2. FlightSearch component
   → user enters airline IATA + flight number + date
        ↓
3. POST /policies/quote
   → display PremiumQuote (premium, payout, risk tier)
        ↓
4. User clicks "Buy"
   → call insurance-pool contract create_policy() via Freighter
   → on tx confirmed: POST /policies to record in DB
        ↓
5. Redirect to /dashboard
```

#### 3. Dashboard `/dashboard`

```
GET /policies/:wallet       → list PolicyCard components
GET /flights/:id/status     → show delay status per active policy
GET /pool/position/:wallet  → show LP balance if user is an LP
```

---

### Auth Flow

```
1. User clicks "Connect Wallet"
2. Freighter returns wallet address
3. POST /auth/token { wallet }  → receive JWT
4. Store JWT in Zustand / localStorage
5. Attach as Authorization header on POST /policies and POST /pool/deposit
```

> MVP shortcut: the backend trusts the wallet claim in `/auth/token` without signature verification.
> Production: sign a challenge message with Freighter and verify the Ed25519 signature server-side.

---

### Contract Call Pattern (create_policy)

```ts
// 1. Get quote from backend
const quote = await fetch("/api/policies/quote", { method: "POST", body: ... }).then(r => r.json());

// 2. Build + sign tx via Freighter
const txHash = await createPolicy(
  walletAddress,
  flightId,
  departureTimestamp,
  BigInt(quote.premium * 1e7),      // convert USDC → stroops
  BigInt(quote.payoutAmount * 1e7),
  USDC_CONTRACT_ADDRESS
);

// 3. Record in backend DB
await fetch("/api/policies", {
  method: "POST",
  headers: { Authorization: `Bearer ${jwt}` },
  body: JSON.stringify({ policyId, flightId, premium: quote.premium, payoutAmount: quote.payoutAmount, userWallet: walletAddress })
});
```

---

### Key Frontend Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_POOL_CONTRACT_ID=C...
NEXT_PUBLIC_ORACLE_CONTRACT_ID=C...
NEXT_PUBLIC_NFT_CONTRACT_ID=C...
NEXT_PUBLIC_USDC_ADDRESS=C...
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

### Component Map

```
app/
├── page.tsx                  Landing
├── buy/page.tsx              FlightSearch → PremiumQuote → purchase tx
└── dashboard/page.tsx        PolicyCard list + oracle status + LP position

components/
├── WalletConnect.tsx         Freighter connect button, stores address + JWT
├── FlightSearch.tsx          Inputs: airline IATA, flight number, date
├── PremiumQuote.tsx          Displays quote response, "Buy" button
└── PolicyCard.tsx            Single policy: flight, status, payout, delay badge

hooks/
├── useWallet.ts              Freighter state + JWT fetch
├── usePolicy.ts              GET /policies/:wallet
└── usePool.ts                GET /pool/reserve + /pool/position/:wallet
```

---

### What the Frontend Does NOT Need to Implement

- Oracle polling — handled entirely by the backend cron + BullMQ worker
- Payout triggering — handled by the oracle submitter → Soroban contract
- Premium calculation logic — always call `POST /policies/quote`; never replicate the formula client-side
