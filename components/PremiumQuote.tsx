"use client";
import { QuoteResponse } from "@/lib/api";

const RISK_COLORS = {
  low: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-red-600 bg-red-50",
};

interface PremiumQuoteProps {
  quote: QuoteResponse;
  flightId: string;
  onBuy: () => void;
  loading?: boolean;
}

export function PremiumQuote({ quote, flightId, onBuy, loading }: PremiumQuoteProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Quote for {flightId}</h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${RISK_COLORS[quote.riskTier]}`}
        >
          {quote.riskTier} risk
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">You Pay</p>
          <p className="text-2xl font-bold text-gray-900">${quote.premium} USDC</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">You Receive (if delayed)</p>
          <p className="text-2xl font-bold text-blue-700">${quote.payoutAmount} USDC</p>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Delay probability:{" "}
        <span className="font-medium text-gray-700">
          {(quote.delayProbability * 100).toFixed(0)}%
        </span>{" "}
        · Payout triggers if flight delayed &gt; 2 hours
      </p>

      <button
        onClick={onBuy}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing…" : `Buy for $${quote.premium} USDC`}
      </button>
    </div>
  );
}
