# Project Structure & Implementation Guide

---

## What's Been Implemented (Contracts — 50%)

### `contracts/insurance-pool` ✅

The core of the protocol. Manages the reserve pool and the full policy lifecycle.

**Storage:**
| Key | Type | Description |
|---|---|---|
| `Policy(u64)` | `Policy` | Per-policy data, keyed by ID |
| `NextId` | `u64` | Auto-incrementing policy counter |
| `Reserve` | `i128` | Total USDC held in pool |
| `Oracle` | `Address` | Only address allowed to trigger payouts |
| `PayoutThreshold` | `u32` | Delay minutes required for payout |

**Functions implemented:**
| Function | Auth | Description |
|---|---|---|
| `initialize(oracle, threshold_minutes)` | — | One-time setup |
| `deposit_liquidity(provider, token, amount)` | provider | LP deposits USDC into reserve |
| `create_policy(user, flight_id, departure_time, premium, payout_amount, token)` | user | Buys a policy, transfers premium, returns `policy_id` |
| `trigger_payout(policy_id, delay_minutes, token)` | oracle | Pays user if delay ≥ threshold, else expires policy |
| `cancel_policy(policy_id, token)` | policy.user | Refunds premium if called before departure |
| `get_policy(policy_id)` | — | Read policy state |
| `get_reserve()` | — | Read pool balance |

**Events emitted:** `deposit`, `policy_created`, `payout`, `expired`, `cancelled`

**Not yet implemented:** `withdraw_liquidity`, LP yield tracking, cross-contract oracle call before payout, NFT minting inside `create_policy`.

---

### `contracts/oracle` ✅

Multi-node quorum verification. Prevents any single oracle from triggering a payout.

**Storage:**
| Key | Type | Description |
|---|---|---|
| `FlightStatus(String)` | `FlightStatus` | Per-flight status, keyed by flight_id |
| `OracleNodes` | `Vec<Address>` | Registered trusted nodes |
| `Quorum` | `u32` | Approvals required to finalize |
| `Admin` | `Address` | Can add oracle nodes |

**Functions implemented:**
| Function | Auth | Description |
|---|---|---|
| `initialize(admin, quorum)` | — | One-time setup |
| `add_oracle_node(node)` | admin | Registers a trusted oracle node |
| `submit_flight_status(node, flight_id, delay_minutes)` | node | Submits delay data; finalizes at quorum |
| `get_flight_status(flight_id)` | — | Returns full `FlightStatus` |
| `is_finalized(flight_id)` | — | Returns bool |

**Events emitted:** `node_added`, `status_finalized`

**Not yet implemented:** stake slashing for malicious nodes, duplicate submission guard per node, cross-contract call from insurance-pool.

---

### `contracts/policy-nft` ✅

Each policy is an NFT. Enables transferable ownership and secondary market trading.

**Storage:**
| Key | Type | Description |
|---|---|---|
| `Nft(u64)` | `NftData` | NFT metadata keyed by token_id |
| `Owner(u64)` | `Address` | Current owner of each token |
| `NextId` | `u64` | Auto-incrementing token counter |
| `Admin` | `Address` | Only address that can mint |

**Functions implemented:**
| Function | Auth | Description |
|---|---|---|
| `initialize(admin)` | — | One-time setup |
| `mint(to, policy_id, airline, flight_number, departure_time, coverage_amount, expiration)` | admin | Mints NFT to user, returns `token_id` |
| `transfer(from, to, token_id)` | from | Transfers ownership |
| `owner_of(token_id)` | — | Returns current owner |
| `get_metadata(token_id)` | — | Returns `NftData` |

**Events emitted:** `minted`, `transfer`

**Not yet implemented:** auto-mint wired into `insurance-pool.create_policy`, burn on policy expiry.

---

### `contracts/governance` ✅

DAO voting over protocol parameters with time-locked proposals.

**Storage:**
| Key | Type | Description |
|---|---|---|
| `Proposal(u64)` | `Proposal` | Proposal data keyed by ID |
| `NextId` | `u64` | Auto-incrementing proposal counter |
| `VotingPeriod` | `u64` | Seconds a proposal stays open |
| `Admin` | `Address` | Initial admin |

**Functions implemented:**
| Function | Auth | Description |
|---|---|---|
| `initialize(admin, voting_period)` | — | One-time setup |
| `propose(proposer, description)` | proposer | Creates proposal, sets deadline |
| `vote(voter, proposal_id, support)` | voter | Casts for/against vote before deadline |
| `finalize(proposal_id)` | — | Closes voting, sets Passed/Rejected |
| `get_proposal(proposal_id)` | — | Read proposal state |

**Events emitted:** `proposed`, `voted`, `finalized`

**Not yet implemented:** token-weighted voting, on-chain execution of passed proposals, vote delegation.

---

### Test Coverage

```
insurance-pool  4 tests  ✓ deposit_and_create_policy
                         ✓ trigger_payout_above_threshold
                         ✓ trigger_payout_below_threshold_expires
                         ✓ cancel_policy_refunds_premium

oracle          3 tests  ✓ quorum_finalizes_status
                         ✓ on_time_flight
                         ✓ unauthorized_node_rejected

policy-nft      3 tests  ✓ mint_and_owner
                         ✓ transfer_nft
                         ✓ transfer_by_non_owner_fails

governance      3 tests  ✓ propose_and_vote_passes
                         ✓ proposal_rejected
                         ✓ vote_after_deadline_fails

Total: 13 passed, 0 failed
```

---

## What's Left on Contracts (Remaining 50%)

| Task | Contract |
|---|---|
| `withdraw_liquidity` + LP yield tracking | insurance-pool |
| Cross-contract: pool reads oracle before payout | insurance-pool + oracle |
| Auto-mint NFT inside `create_policy` | insurance-pool + policy-nft |
| Duplicate submission guard per oracle node | oracle |
| Stake slashing for malicious nodes | oracle |
| Token-weighted voting | governance |
| On-chain execution of passed proposals | governance |
| NFT burn on policy expiry/payout | policy-nft |
| Dynamic premium pricing | insurance-pool |
| Reinsurance reserve vault | insurance-pool |

---

## Backend Implementation Guide

The backend has two jobs: serve the API to the frontend, and run the oracle service that polls flight APIs and submits data on-chain.

### Folder structure

```
backend/
├── api/
│   ├── routes/
│   │   ├── policies.ts       # GET /policies/:wallet, POST /policies/quote
│   │   ├── flights.ts        # GET /flights/:id/status
│   │   └── liquidity.ts      # GET /pool/reserve
│   ├── middleware/
│   │   └── auth.ts           # JWT or wallet-signature verification
│   └── server.ts             # Fastify entry point
├── oracle-service/
│   ├── poller.ts             # Cron job: polls flight APIs every 5 min
│   ├── submitter.ts          # Signs and submits to oracle contract
│   └── queue.ts              # BullMQ job queue
├── pricing-engine/
│   └── premium.ts            # base_rate × delay_probability × payout_size
├── db/
│   ├── schema.sql            # Tables: policies, oracle_updates, lp_positions
│   └── client.ts             # Postgres connection
└── .env                      # RPC_URL, ORACLE_SECRET_KEY, DB_URL, FLIGHT_API_KEY
```

### Key implementation steps

**1. Oracle poller** — runs on a cron, fetches delay data, submits to chain:

```ts
// oracle-service/poller.ts
import { SorobanRpc, Contract, Keypair } from "@stellar/stellar-sdk";

async function pollAndSubmit(flightId: string) {
  const delay = await fetchDelayFromApi(flightId); // AviationStack / FlightAware
  const keypair = Keypair.fromSecret(process.env.ORACLE_SECRET_KEY!);
  const server = new SorobanRpc.Server(process.env.RPC_URL!);

  // Build and submit transaction to oracle contract
  const contract = new Contract(process.env.ORACLE_CONTRACT_ID!);
  const tx = await buildTx(server, keypair, contract, "submit_flight_status", [
    nativeToScVal(keypair.publicKey(), { type: "address" }),
    nativeToScVal(flightId, { type: "string" }),
    nativeToScVal(delay, { type: "u32" }),
  ]);
  await server.sendTransaction(tx);
}
```

**2. Premium calculation:**

```ts
// pricing-engine/premium.ts
export function calculatePremium(
  delayProbability: number, // 0–1, from historical data
  payoutAmount: number,
  baseFeePercent = 0.05
): number {
  return Math.ceil(delayProbability * payoutAmount * (1 + baseFeePercent));
}
```

**3. Database schema:**

```sql
CREATE TABLE policies (
  id            BIGSERIAL PRIMARY KEY,
  policy_id     BIGINT UNIQUE NOT NULL,   -- on-chain ID
  user_wallet   TEXT NOT NULL,
  flight_id     TEXT NOT NULL,
  premium       BIGINT NOT NULL,
  payout_amount BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE oracle_updates (
  id            BIGSERIAL PRIMARY KEY,
  flight_id     TEXT NOT NULL,
  delay_minutes INT NOT NULL,
  node_address  TEXT NOT NULL,
  submitted_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lp_positions (
  wallet        TEXT PRIMARY KEY,
  amount        BIGINT NOT NULL,
  deposited_at  TIMESTAMPTZ DEFAULT now()
);
```

**4. Environment variables:**

```env
RPC_URL=https://soroban-testnet.stellar.org
ORACLE_CONTRACT_ID=C...
POOL_CONTRACT_ID=C...
ORACLE_SECRET_KEY=S...
FLIGHT_API_KEY=...
DATABASE_URL=postgres://user:pass@localhost:5432/flight_insurance
REDIS_URL=redis://localhost:6379
```

---

## Frontend Implementation Guide

### Folder structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── buy/page.tsx          # Buy insurance flow
│   ├── dashboard/page.tsx    # Active policies + history
│   └── layout.tsx
├── components/
│   ├── FlightSearch.tsx      # Flight number + date input
│   ├── PremiumQuote.tsx      # Shows premium / payout before purchase
│   ├── PolicyCard.tsx        # Single policy display
│   └── WalletConnect.tsx     # Freighter connect button
├── hooks/
│   ├── useWallet.ts          # Freighter wallet state
│   ├── usePolicy.ts          # Fetch user policies from chain + DB
│   └── usePool.ts            # Pool reserve, LP position
├── lib/
│   ├── soroban.ts            # Contract call helpers
│   └── api.ts                # Backend API client
└── .env.local
```

### Key implementation steps

**1. Wallet connection (Freighter):**

```ts
// hooks/useWallet.ts
import freighter from "@stellar/freighter-api";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    await freighter.setAllowed();
    const { address } = await freighter.getAddress();
    setAddress(address);
  };

  return { address, connect };
}
```

**2. Calling the insurance-pool contract:**

```ts
// lib/soroban.ts
import { SorobanRpc, Contract, nativeToScVal, TransactionBuilder } from "@stellar/stellar-sdk";

export async function createPolicy(
  userAddress: string,
  flightId: string,
  departureTime: number,
  premium: bigint,
  payoutAmount: bigint,
  tokenAddress: string
) {
  const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_RPC_URL!);
  const contract = new Contract(process.env.NEXT_PUBLIC_POOL_CONTRACT_ID!);

  const args = [
    nativeToScVal(userAddress, { type: "address" }),
    nativeToScVal(flightId, { type: "string" }),
    nativeToScVal(departureTime, { type: "u64" }),
    nativeToScVal(premium, { type: "i128" }),
    nativeToScVal(payoutAmount, { type: "i128" }),
    nativeToScVal(tokenAddress, { type: "address" }),
  ];

  const account = await server.getAccount(userAddress);
  const tx = new TransactionBuilder(account, { fee: "100" })
    .addOperation(contract.call("create_policy", ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signed = await freighter.signTransaction(prepared.toXDR(), { networkPassphrase: Networks.TESTNET });
  return server.sendTransaction(TransactionBuilder.fromXDR(signed, Networks.TESTNET));
}
```

**3. Buy insurance page flow:**

```
FlightSearch → user enters flight number + date
      ↓
POST /api/policies/quote → backend returns { premium, payoutAmount, delayProbability }
      ↓
PremiumQuote → user reviews and clicks "Buy"
      ↓
createPolicy() → Freighter prompts for signature
      ↓
Transaction confirmed → redirect to /dashboard
```

**4. Environment variables:**

```env
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_POOL_CONTRACT_ID=C...
NEXT_PUBLIC_ORACLE_CONTRACT_ID=C...
NEXT_PUBLIC_NFT_CONTRACT_ID=C...
NEXT_PUBLIC_USDC_ADDRESS=C...
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

## Deployment Order

```
1. Deploy oracle contract        → note ORACLE_CONTRACT_ID
2. Deploy policy-nft contract    → note NFT_CONTRACT_ID
3. Deploy insurance-pool         → initialize(oracle=ORACLE_CONTRACT_ID, threshold=120)
4. Deploy governance contract    → initialize(admin, voting_period=604800)
5. Register oracle nodes         → oracle.add_oracle_node(node_address) × N
6. Seed liquidity                → pool.deposit_liquidity(lp, usdc, amount)
7. Start oracle backend          → poller begins watching active policies
8. Deploy frontend               → point to contract IDs via env vars
```
