# Parametric Flight Insurance on Stellar (Soroban)

A decentralized insurance protocol on Stellar where users purchase flight-delay coverage using stablecoins, and payouts are triggered automatically via oracle-verified flight data — no manual claims required.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why Stellar + Soroban](#2-why-stellar--soroban)
3. [Architecture](#3-architecture)
4. [Smart Contracts](#4-smart-contracts)
5. [Insurance Flow](#5-insurance-flow)
6. [Oracle Design](#6-oracle-design)
7. [Frontend](#7-frontend)
8. [Liquidity & Risk Engine](#8-liquidity--risk-engine)
9. [Database Schema](#9-database-schema)
10. [Security](#10-security)
11. [Revenue Model](#11-revenue-model)
12. [Development Roadmap](#12-development-roadmap)
13. [Folder Structure](#13-folder-structure)

---

## 1. Project Overview

Users insure a specific flight before departure. If the flight is delayed beyond a configured threshold (e.g. 2 hours), the smart contract **automatically pays compensation in USDC** — no forms, no adjusters, no waiting.

This is **parametric insurance**: payouts are triggered by measurable external data (flight delay minutes), not subjective assessment.

---

## 2. Why Stellar + Soroban

| Benefit | Detail |
|---|---|
| **Low fees** | Payouts as small as $5–$100 remain economically viable |
| **Fast settlement** | Payouts settle in seconds |
| **Native stablecoins** | USDC, EURC, NGN stable assets, custom airline tokens |
| **Soroban contracts** | Enables escrow pools, automated payout logic, oracle integration, and DAO governance |

---

## 3. Architecture

```
┌──────────────────┐
│  Frontend (Next) │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│  Soroban Contracts │
│  - Insurance Pool  │
│  - Oracle Verifier │
│  - Policy NFT      │
│  - Governance      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Oracle Backend    │
│  Flight API Adapter│
│  Delay Verifier    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Flight Data APIs  │
│  AviationStack     │
│  FlightAware       │
│  OpenSky           │
└────────────────────┘
```

---

## 4. Smart Contracts

### 4.1 Insurance Pool Contract

Manages liquidity, premiums, and claim payouts.

**Key functions:**

```rust
pub fn create_policy(env: Env, user: Address, flight_id: String, premium: i128) -> PolicyId;
pub fn trigger_payout(env: Env, flight_id: String, delay_minutes: u32);
pub fn deposit_liquidity(env: Env, provider: Address, amount: i128);
pub fn withdraw_liquidity(env: Env, provider: Address, amount: i128);
pub fn cancel_policy(env: Env, policy_id: PolicyId);
```

**Policy data structure:**

```rust
pub struct Policy {
    pub user: Address,
    pub flight_id: String,
    pub departure_time: u64,
    pub premium: i128,
    pub payout_amount: i128,
    pub status: PolicyStatus,
}
```

**Payout logic:**

```rust
if delay_minutes > threshold {
    release_funds(policy.user, policy.payout_amount);
} else {
    mark_policy_expired(policy_id);
}
```

---

### 4.2 Oracle Verification Contract

Validates off-chain flight data before any payout is triggered.

**Responsibilities:**
- Receives signed flight delay submissions
- Validates cryptographic signatures
- Enforces multi-oracle quorum (e.g. 3-of-5)
- Prevents oracle spoofing and replay attacks

```rust
pub fn submit_flight_status(
    env: Env,
    flight_id: String,
    delay_minutes: u32,
    signed_hash: BytesN<64>,
);
```

---

### 4.3 Policy NFT Contract

Each purchased policy is minted as an NFT, enabling:
- Transferable policy ownership
- On-chain proof of coverage
- Secondary market trading

**NFT metadata:** airline, flight number, departure time, coverage amount, expiration.

---

### 4.4 Governance Contract *(optional)*

DAO voting over:
- Premium pricing parameters
- Supported airlines and oracle providers
- Payout thresholds and reserve ratios

---

## 5. Insurance Flow

```
1. User selects flight (airline, number, date)
        ↓
2. Backend calculates risk score
   (airline history, weather, airport congestion)
        ↓
3. Premium quoted to user
        ↓
4. User pays premium in USDC
   → Contract creates policy + mints NFT receipt
        ↓
5. Oracle backend polls flight APIs
        ↓
6. Delay detected (e.g. 185 min > 120 min threshold)
   → Oracle signs and submits proof on-chain
        ↓
7. Contract verifies proof → releases payout instantly
```

**Example premium tiers:**

| Delay Risk | Premium |
|---|---|
| Low | $5 |
| Medium | $12 |
| High | $25 |

**Example payout:** Alice pays 15 USDC → flight delayed 4 hours → receives 120 USDC automatically.

---

## 6. Oracle Design

Smart contracts cannot call external APIs directly. An off-chain oracle service bridges flight data to the chain.

### Oracle Workflow

```
Flight API → Oracle Backend → Sign Delay Data → Submit to Soroban → Contract Verifies → Payout
```

### Security Model

- **Signed payloads** — each oracle submission includes a cryptographic signature
- **Quorum consensus** — requires 3-of-5 oracle approvals before payout
- **Stake slashing** — malicious oracles lose staked collateral

### Oracle Backend Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| API | Fastify |
| Queue | BullMQ |
| Scheduler | Cron |
| Database | PostgreSQL |
| Cache | Redis |

### Supported Flight Data Providers

| Provider | Purpose |
|---|---|
| AviationStack | Real-time flight tracking |
| FlightAware | Delay monitoring |
| AeroDataBox | Airport data |
| OpenSky | Aircraft position tracking |

---

## 7. Frontend

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Styling | Tailwind CSS |
| Wallet | Freighter |
| State | Zustand |
| Charts | Recharts |

### Pages

- **Landing** — how it works, supported airlines, pricing
- **Buy Insurance** — flight lookup, premium quote, purchase
- **Dashboard** — active policies, payout history, NFT receipts

---

## 8. Liquidity & Risk Engine

### Liquidity Pool

Liquidity Providers (LPs) deposit USDC and earn yield from premiums and protocol fees.

```
Premiums collected → Reserve Pool
Claims triggered  → Paid from Pool
Unused premiums   → Distributed as LP yield
```

### Dynamic Premium Formula

```
premium = (base_rate × delay_probability × payout_size) + protocol_fee
```

**Inputs:** airline delay history, airport, season, weather, geopolitical risk.

---

## 9. Database Schema

```sql
-- policies
id, user_wallet, flight_id, premium, payout_amount, status, created_at

-- oracle_updates
flight_id, delay_minutes, oracle_signature, submitted_at

-- liquidity_positions
wallet, amount_deposited, current_apy, rewards_earned
```

---

## 10. Security

| Risk | Mitigation |
|---|---|
| Oracle manipulation | Signed payloads + quorum consensus + stake slashing |
| Pool insolvency | Max payout ratio + dynamic premium adjustment + emergency reserve vault |
| Flash loan exploits | Time-locked purchases + cutoff window before departure |

---

## 11. Revenue Model

| Source | Mechanism |
|---|---|
| Premium spread | Collect $10, expected payout $7 → $3 protocol profit |
| LP fees | Small protocol cut from liquidity yield |
| NFT trading fees | Commission on secondary policy marketplace |

---

## 12. Development Roadmap

| Phase | Features | Duration |
|---|---|---|
| **Phase 1 — MVP** | Buy insurance, oracle integration, automatic USDC payout | 3–4 weeks |
| **Phase 2 — Risk Engine** | Dynamic pricing, airline scoring, LP vaults | 2–3 weeks |
| **Phase 3 — DAO** | Governance voting, decentralized oracle network, NFT marketplace | Ongoing |

**Hackathon MVP scope:** single airline, single oracle, fixed premium, USDC payouts, basic dashboard.

---

## 13. Folder Structure

```
flight-insurance/
├── contracts/
│   ├── insurance-pool/
│   ├── oracle/
│   ├── policy-nft/
│   └── governance/
├── backend/
│   ├── api/
│   ├── oracle-service/
│   ├── pricing-engine/
│   ├── scheduler/
│   └── database/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── wallet/
│   └── services/
├── shared/
│   ├── types/
│   ├── constants/
│   └── sdk/
└── docs/
```

---

## Full Tech Stack

| Layer | Tool |
|---|---|
| Smart Contracts | Rust + Soroban SDK |
| Wallet | Freighter |
| Blockchain SDK | Stellar SDK (JS) |
| Backend | Node.js + Fastify |
| Database | PostgreSQL |
| Queue | Redis + BullMQ |
| Frontend | Next.js + Tailwind |
| Hosting | Railway / Vercel |
| Monitoring | Grafana |

---

> **Future expansion:** the same oracle architecture applies to train delays, weather events, crop insurance, shipment tracking, and event cancellations.
