"use client";

import { useState } from "react";
import { verifyMemory } from "@/lib/api";
import Link from "next/link";

export default function VerifyPage() {
  const [blobId, setBlobId] = useState("");
  const [expectedHash, setExpectedHash] = useState("");
  const [result, setResult] = useState<{ match: boolean; computed_hash: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");
    setResult(null);

    try {
      const res = await verifyMemory(blobId, expectedHash);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link href="/" className="mb-8 block text-sm text-neutral-400 hover:text-white transition-colors">
        &larr; Home
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Verify Memory</h1>
      <p className="mb-8 text-neutral-400">
        Enter a Walrus blob ID and the expected SHA-256 hash to verify integrity.
      </p>

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Walrus Blob ID</label>
          <input
            value={blobId}
            onChange={(e) => setBlobId(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 outline-none focus:border-emerald-500 font-mono text-sm"
            placeholder="M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Expected SHA-256 Hash</label>
          <input
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 outline-none focus:border-emerald-500 font-mono text-sm"
            placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            required
            pattern="[a-f0-9]{64}"
            title="64-character hex string"
          />
        </div>

        <button
          type="submit"
          disabled={verifying || !blobId || !expectedHash}
          className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {verifying ? "Verifying..." : "Verify Integrity"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg bg-red-900/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {result && (
        <div
          className={`mt-6 rounded-xl border p-6 ${
            result.match
              ? "border-emerald-800 bg-emerald-900/20"
              : "border-red-800 bg-red-900/20"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                result.match ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span className="font-semibold">
              {result.match ? "Integrity Verified ✓" : "Hash Mismatch ✗"}
            </span>
          </div>
          <p className="font-mono text-xs text-neutral-400 break-all">
            Computed: {result.computed_hash}
          </p>
        </div>
      )}
    </div>
  );
}
