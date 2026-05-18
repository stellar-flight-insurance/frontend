"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlightSearch } from "@/components/FlightSearch";
import { PremiumQuote } from "@/components/PremiumQuote";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/hooks/useWallet";
import { api, QuoteResponse } from "@/lib/api";
import { createPolicy } from "@/lib/soroban";

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "";

export default function BuyPage() {
  const router = useRouter();
  const { address, jwt, isConnected } = useWallet();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [flightId, setFlightId] = useState("");
  const [departureTime, setDepartureTime] = useState(0);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuote = (q: QuoteResponse, fid: string, dep: number) => {
    setQuote(q);
    setFlightId(fid);
    setDepartureTime(dep);
    setError(null);
  };

  const handleBuy = async () => {
    if (!address || !quote || !jwt) return;
    setBuying(true);
    setError(null);
    try {
      const premiumStroops = BigInt(Math.round(quote.premium * 1e7));
      const payoutStroops = BigInt(Math.round(quote.payoutAmount * 1e7));

      const txHash = await createPolicy(
        address,
        flightId,
        departureTime,
        premiumStroops,
        payoutStroops,
        USDC_ADDRESS
      );

      // Record in backend DB (best-effort)
      await api
        .recordPolicy(
          {
            policyId: 0, // will be assigned by contract; backend can read from tx
            flightId,
            premium: quote.premium,
            payoutAmount: quote.payoutAmount,
            userWallet: address,
          },
          jwt
        )
        .catch(() => {});

      console.log("Policy created, tx:", txHash);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-blue-600">
          FlightShield
        </Link>
        <WalletConnect />
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Insurance</h1>
        <p className="text-gray-500 mb-8">
          Search your flight to get an instant premium quote.
        </p>

        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-center">
            <p className="text-blue-700 font-medium mb-3">
              Connect your wallet to purchase insurance
            </p>
            <WalletConnect />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Flight Details</h2>
          <FlightSearch onQuote={handleQuote} />
        </div>

        {quote && (
          <PremiumQuote
            quote={quote}
            flightId={flightId}
            onBuy={handleBuy}
            loading={buying}
          />
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isConnected && quote && (
          <p className="mt-4 text-sm text-center text-gray-500">
            Connect your wallet above to complete the purchase.
          </p>
        )}
      </main>
    </div>
  );
}
