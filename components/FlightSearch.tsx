"use client";
import { useState } from "react";
import { api, QuoteResponse } from "@/lib/api";

interface FlightSearchProps {
  onQuote: (quote: QuoteResponse, flightId: string, departureTime: number) => void;
}

export function FlightSearch({ onQuote }: FlightSearchProps) {
  const [airlineIata, setAirlineIata] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [originIata, setOriginIata] = useState("");
  const [destIata, setDestIata] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const flightId = `${airlineIata}${flightNumber}`;
      const departureTime = Math.floor(new Date(date).getTime() / 1000);
      const quote = await api.getQuote({
        flightId,
        airlineIata,
        originIata,
        destIata,
        payoutAmount: 100,
      });
      onQuote(quote, flightId, departureTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Airline IATA
          </label>
          <input
            type="text"
            value={airlineIata}
            onChange={(e) => setAirlineIata(e.target.value.toUpperCase())}
            placeholder="AA"
            maxLength={2}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Flight Number
          </label>
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            placeholder="123"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origin
          </label>
          <input
            type="text"
            value={originIata}
            onChange={(e) => setOriginIata(e.target.value.toUpperCase())}
            placeholder="JFK"
            maxLength={3}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          <input
            type="text"
            value={destIata}
            onChange={(e) => setDestIata(e.target.value.toUpperCase())}
            placeholder="LAX"
            maxLength={3}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Departure Date
        </label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Getting Quote…" : "Get Quote"}
      </button>
    </form>
  );
}
