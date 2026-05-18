"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { PolicyCard } from "@/components/PolicyCard";
import { useWallet } from "@/hooks/useWallet";
import { usePolicy } from "@/hooks/usePolicy";
import { usePool } from "@/hooks/usePool";
import { api, FlightStatus } from "@/lib/api";

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const { policies, loading: policiesLoading } = usePolicy(address);
  const { pool, position, loading: poolLoading } = usePool(address);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, FlightStatus>>({});

  // Fetch delay status for each active policy
  useEffect(() => {
    const active = policies.filter((p) => p.status === "active");
    active.forEach((p) => {
      api
        .getFlightStatus(p.flight_id)
        .then((status) =>
          setFlightStatuses((prev) => ({ ...prev, [p.flight_id]: status }))
        )
        .catch(() => {});
    });
  }, [policies]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-blue-600">
          FlightShield
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/buy" className="text-sm text-blue-600 font-medium hover:underline">
            + Buy Insurance
          </Link>
          <WalletConnect />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {!isConnected ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500 mb-4">
              Connect your wallet to view your policies.
            </p>
            <WalletConnect />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pool stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">Pool Reserve</p>
                {poolLoading ? (
                  <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    ${pool ? (pool.reserve / 1e7).toLocaleString() : "—"} USDC
                  </p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">Your LP Position</p>
                {poolLoading ? (
                  <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {position
                      ? `$${(position.amount / 1e7).toLocaleString()} USDC`
                      : "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Policies */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Policies
              </h2>
              {policiesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : policies.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 mb-4">No policies yet.</p>
                  <Link
                    href="/buy"
                    className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Buy Your First Policy
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      delayMinutes={
                        flightStatuses[policy.flight_id]?.delay_minutes
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
