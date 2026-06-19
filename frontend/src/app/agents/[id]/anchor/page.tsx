"use client";

import { useStellar } from "@/lib/stellar-provider";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import { uploadMemory, anchorMemory } from "@/lib/api";

export default function AnchorMemoryPage() {
  const { id } = useParams<{ id: string }>();
  const agentId = Number(id);
  const { publicKey, isConnected, kit } = useStellar();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !kit || !file) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Upload to backend -> Walrus
      const { walrus_blob_id, content_hash, size } = await uploadMemory(file);

      // 2. Anchor on Stellar via Soroban contract
      await anchorMemory(
        kit,
        publicKey,
        agentId,
        walrus_blob_id,
        content_hash,
        size,
        file.type || "application/octet-stream",
        description
      );

      router.push(`/agents/${agentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to anchor memory");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center text-neutral-500">
        Connect your wallet to anchor memory
      </div>
    );
  }

  if (isNaN(agentId)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center text-neutral-500">
        Invalid agent ID
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link
        href={`/agents/${agentId}`}
        className="mb-8 block text-sm text-neutral-400 hover:text-white transition-colors"
      >
        &larr; Back to agent
      </Link>

      <h1 className="mb-8 text-3xl font-bold">Anchor Memory</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">File</label>
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/50 p-8 transition-colors hover:border-neutral-500"
          >
            {file ? (
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-neutral-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-400">
                  Drop a file here or click to browse
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Memory snapshots, execution logs, or agent artifacts
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 outline-none focus:border-emerald-500"
            placeholder="E.g. State snapshot after training epoch 5"
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
          disabled={submitting || !file}
          className="w-full rounded-lg bg-emerald-500 py-3 font-medium text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {submitting ? "Uploading & Signing..." : "Anchor Memory"}
        </button>
      </form>
    </div>
  );
}
