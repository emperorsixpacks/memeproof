"use client";

import { useStellar } from "@/lib/stellar-provider";
import { registerAgent } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CreateAgentPage() {
  const { publicKey, isConnected, kit } = useStellar();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !kit) return;
    setSubmitting(true);
    setError("");

    try {
      await registerAgent(kit, publicKey, name, description);
      router.push("/agents");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center text-neutral-500">
        Connect your wallet to create an agent
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link
        href="/agents"
        className="mb-8 block text-sm text-neutral-400 hover:text-white transition-colors"
      >
        &larr; Back to agents
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Register Agent</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 outline-none focus:border-emerald-500"
            placeholder="My AI Agent"
            required
            maxLength={128}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 outline-none focus:border-emerald-500"
            placeholder="A short description of this agent"
            rows={4}
            maxLength={1024}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Register Agent"}
        </button>
      </form>
    </div>
  );
}
