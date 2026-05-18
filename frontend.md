# Frontend Implementation

Next.js 16 (App Router) · Tailwind CSS v4 · TypeScript · Stellar Testnet

---

## Pages

### `/` — Landing page (`app/page.tsx`)
- Hero section with headline, description, and CTA buttons to `/buy` and `/dashboard`
- "How It Works" 3-step grid (search → pay → get paid)
- Pricing tiers table: Low ($5 → $50), Medium ($12 → $100), High ($25 → $150)
- Bottom CTA banner
- `WalletConnect` in the nav

### `/buy` — Purchase flow (`app/buy/page.tsx`)
- Renders `FlightSearch` to collect flight details and fetch a quote
- Renders `PremiumQuote` once a quote is returned
- On purchase: calls `createPolicy` (Soroban), then `api.recordPolicy` (backend, best-effort)
- Redirects to `/dashboard` on success
- Inline error display; wallet-not-connected prompt

### `/dashboard` — Policy dashboard (`app/dashboard/page.tsx`)
- Pool reserve and user LP position stats (with skeleton loaders)
- Lists all policies via `usePolicy`, rendered as `PolicyCard` components
- Fetches live delay status for each active policy via `api.getFlightStatus`
- Empty state with link to `/buy`
- Wallet-not-connected gate

---

## Components

### `WalletConnect`
Calls `useWallet`. Shows a "Connect Wallet" button when disconnected; shows truncated address (`GXXXXX…XXXX`) and a "Disconnect" button when connected.

### `FlightSearch`
Form with fields: Airline IATA, Flight Number, Origin, Destination, Departure datetime. On submit calls `api.getQuote` and passes the result up via `onQuote` callback.

### `PremiumQuote`
Displays the quote returned by the backend: premium, payout amount, delay probability, risk tier badge (low/medium/high with colour coding). "Buy" button triggers the purchase flow in the parent.

### `PolicyCard`
Displays a single policy: flight ID, policy number, date, status badge, premium paid, coverage amount. If `delayMinutes` is passed, shows a live delay indicator (red warning if ≥ 120 min, green if on time).

---

## Hooks

### `useWallet` (`hooks/useWallet.ts`)
- Calls `freighter.setAllowed()` + `freighter.getAddress()` to connect
- Fetches a JWT from the backend (`api.getToken`) after connecting
- Stores `address` and `jwt` in Zustand; exposes `connect`, `disconnect`, `isConnected`

### `usePolicy` (`hooks/usePolicy.ts`)
- Fetches `Policy[]` from `api.getPolicies(wallet)` when wallet address changes
- Returns `{ policies, loading, error }`

### `usePool` (`hooks/usePool.ts`)
- Fetches pool reserve (`api.getPoolReserve`) and LP position (`api.getLpPosition`) in parallel
- Returns `{ pool, position, loading }`

---

## Library

### `lib/soroban.ts` — Soroban contract calls
Two functions:

**`createPolicy(userAddress, flightId, departureTime, premium, payoutAmount, tokenAddress)`**
- Builds a Soroban transaction calling `create_policy` on the Insurance Pool contract
- Uses `server.prepareTransaction` for fee simulation
- Signs via `freighter.signTransaction`, submits with `server.sendTransaction`
- Returns the transaction hash

**`getPoolReserve()`**
- Simulates a `get_reserve` call on the pool contract
- Returns the reserve as `bigint` (0n on failure)

### `lib/api.ts` — Oracle backend client
Typed REST client wrapping `fetch`. Endpoints:

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/token` | Get JWT for wallet address |
| POST | `/policies/quote` | Get premium quote for a flight |
| GET | `/policies/:wallet` | List policies for a wallet |
| POST | `/policies` | Record a new policy (JWT required) |
| GET | `/flights/:id/status` | Get current delay status for a flight |
| GET | `/pool/reserve` | Get pool USDC reserve |
| GET | `/pool/position/:wallet` | Get LP position for a wallet |

### `lib/store.ts` — Zustand store
Global state: `address`, `jwt`, `setAddress`, `setJwt`, `disconnect`.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Oracle backend base URL |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint |
| `NEXT_PUBLIC_POOL_CONTRACT_ID` | Insurance Pool contract address |
| `NEXT_PUBLIC_ORACLE_CONTRACT_ID` | Oracle Verifier contract address |
| `NEXT_PUBLIC_NFT_CONTRACT_ID` | Policy NFT contract address |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC asset contract address |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Stellar network passphrase |

---

## What is NOT yet implemented

- Oracle Verifier and Policy NFT contract calls (contract IDs wired in env but no frontend interaction)
- LP deposit / withdraw UI
- NFT receipt viewer
- Transaction history / payout history tab
- Real-time polling for delay status (currently fetches once on dashboard mount)
- Error boundary / toast notifications
- Mobile-responsive nav
