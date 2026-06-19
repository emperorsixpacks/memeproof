"use client";

import { useStellar } from "@/lib/stellar-provider";

export function ConnectWallet() {
  const { publicKey, isConnected, connect, disconnect } = useStellar();

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-400">
          {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm transition-colors hover:border-neutral-500"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
    >
      Connect Wallet
    </button>
  );
}
