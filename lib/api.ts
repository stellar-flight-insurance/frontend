const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface QuoteRequest {
  flightId: string;
  airlineIata: string;
  originIata: string;
  destIata: string;
  payoutAmount: number;
}

export interface QuoteResponse {
  premium: number;
  payoutAmount: number;
  delayProbability: number;
  riskTier: "low" | "medium" | "high";
}

export interface Policy {
  id: number;
  policy_id: number;
  user_wallet: string;
  flight_id: string;
  premium: number;
  payout_amount: number;
  status: "active" | "paid" | "expired" | "cancelled";
  created_at: string;
}

export interface FlightStatus {
  flight_id: string;
  delay_minutes: number;
  finalized: boolean;
  submitted_at: string;
}

export interface PoolInfo {
  reserve: number;
}

export interface LpPosition {
  wallet: string;
  amount: number;
  deposited_at: string;
}

export const api = {
  getToken: (wallet: string) =>
    request<{ token: string }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ wallet }),
    }),

  getQuote: (data: QuoteRequest) =>
    request<QuoteResponse>("/policies/quote", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPolicies: (wallet: string) =>
    request<Policy[]>(`/policies/${wallet}`),

  recordPolicy: (
    data: {
      policyId: number;
      flightId: string;
      premium: number;
      payoutAmount: number;
      userWallet: string;
    },
    jwt: string
  ) =>
    request<{ ok: boolean }>("/policies", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(data),
    }),

  getFlightStatus: (flightId: string) =>
    request<FlightStatus>(`/flights/${flightId}/status`),

  getPoolReserve: () => request<PoolInfo>("/pool/reserve"),

  getLpPosition: (wallet: string) =>
    request<LpPosition>(`/pool/position/${wallet}`),
};
