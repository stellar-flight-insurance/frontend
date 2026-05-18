import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search Your Flight",
    desc: "Enter your airline and flight number. We calculate your delay risk in real time.",
  },
  {
    step: "2",
    title: "Pay Premium in USDC",
    desc: "Sign a single transaction with Freighter. Your policy is minted on Stellar instantly.",
  },
  {
    step: "3",
    title: "Get Paid Automatically",
    desc: "If your flight is delayed 2+ hours, USDC lands in your wallet — no claims needed.",
  },
];

const TIERS = [
  { label: "Low Risk", premium: "$5", payout: "$50", color: "border-green-200 bg-green-50" },
  { label: "Medium Risk", premium: "$12", payout: "$100", color: "border-yellow-200 bg-yellow-50" },
  { label: "High Risk", premium: "$25", payout: "$150", color: "border-red-200 bg-red-50" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-xl text-blue-600">FlightShield</span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <WalletConnect />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Powered by Stellar · Soroban
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Flight Delayed?<br />
          <span className="text-blue-600">Get Paid Automatically.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Parametric flight insurance on Stellar. Pay a small USDC premium before
          departure — if your flight is delayed 2+ hours, the smart contract pays
          you instantly. No forms, no adjusters, no waiting.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/buy"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Buy Insurance
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Simple Pricing
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Premium is calculated dynamically based on airline delay history, route,
          and season.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map(({ label, premium, payout, color }) => (
            <div key={label} className={`border-2 rounded-xl p-6 ${color}`}>
              <p className="font-semibold text-gray-700 mb-4">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{premium}</p>
              <p className="text-sm text-gray-500 mb-4">premium in USDC</p>
              <p className="text-sm font-medium text-gray-700">
                Payout: <span className="text-gray-900">{payout} USDC</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to fly with confidence?
        </h2>
        <p className="text-blue-100 mb-8">
          Connect your Freighter wallet and insure your next flight in under a minute.
        </p>
        <Link
          href="/buy"
          className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Get Started
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        FlightShield · Parametric Insurance on Stellar Testnet
      </footer>
    </div>
  );
}
