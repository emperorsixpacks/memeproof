import { readContract, writeContract, nativeToScval } from "./stellar";
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// --- Backend API (Walrus storage — unchanged) ---

export async function uploadMemory(file: File): Promise<{
  walrus_blob_id: string;
  content_hash: string;
  size: number;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/memories/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function verifyMemory(
  walrusBlobId: string,
  expectedHash: string
): Promise<{ match: boolean; computed_hash: string }> {
  const res = await fetch(`${API_BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walrus_blob_id: walrusBlobId,
      expected_hash: expectedHash,
    }),
  });
  if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
  return res.json();
}

// --- Soroban Contract API -- reads ---

export async function getAgentCount(): Promise<number> {
  return readContract<number>("get_agent_count", []);
}

export async function getAgent(agentId: number): Promise<{
  name: string;
  description: string;
  created_by: string;
  created_at: number;
  memory_count: number;
}> {
  return readContract("get_agent", [nativeToScval(agentId, "u32")]);
}

export async function getAgentsByOwner(ownerAddress: string): Promise<number[]> {
  return readContract<number[]>("get_agents_by_owner", [
    nativeToScval(ownerAddress, "address"),
  ]);
}

export async function getAgentMemories(agentId: number): Promise<number[]> {
  return readContract<number[]>("get_agent_memories", [
    nativeToScval(agentId, "u32"),
  ]);
}

export async function getMemory(
  agentId: number,
  memoryIndex: number
): Promise<{
  agent_id: number;
  walrus_blob_id: string;
  content_hash: string;
  size: number;
  mime_type: string;
  description: string;
  timestamp: number;
  created_by: string;
}> {
  return readContract("get_memory", [
    nativeToScval(agentId, "u32"),
    nativeToScval(memoryIndex, "u32"),
  ]);
}

// --- Soroban Contract API -- writes ---

export async function registerAgent(
  kit: StellarWalletsKit,
  publicKey: string,
  name: string,
  description: string
): Promise<string> {
  return writeContract(
    kit,
    "register",
    [
      nativeToScval(publicKey, "address"),
      nativeToScval(name, "string"),
      nativeToScval(description, "string"),
    ],
    publicKey
  );
}

export async function anchorMemory(
  kit: StellarWalletsKit,
  publicKey: string,
  agentId: number,
  walrusBlobId: string,
  contentHash: string,
  size: number,
  mimeType: string,
  description: string
): Promise<string> {
  return writeContract(
    kit,
    "anchor",
    [
      nativeToScval(agentId, "u32"),
      nativeToScval(walrusBlobId, "string"),
      nativeToScval(contentHash, "string"),
      nativeToScval(size, "u64"),
      nativeToScval(mimeType, "string"),
      nativeToScval(description, "string"),
    ],
    publicKey
  );
}
