"use client";
import { useWallet } from "@/hooks/useWallet";

export function WalletConnect() {
  const { address, connect, disconnect, isConnected } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
