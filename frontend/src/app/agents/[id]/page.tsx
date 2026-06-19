"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAgent, getAgentMemories, getMemory } from "@/lib/api";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agentId = Number(id);

  const { data: agent, isPending } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId),
    enabled: !isNaN(agentId),
  });

  const { data: memoryData } = useQuery({
    queryKey: ["agent-memories", agentId],
    queryFn: async () => {
      const indices = await getAgentMemories(agentId);
      const anchors = await Promise.all(
        indices.map((idx) => getMemory(agentId, idx))
      );
      return anchors.map((m, i) => ({ ...m, memory_index: indices[i] }));
    },
    enabled: !isNaN(agentId),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-64 animate-pulse rounded-xl bg-neutral-900" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center text-neutral-500">
        Agent not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/agents"
        className="mb-8 block text-sm text-neutral-400 hover:text-white transition-colors"
      >
        &larr; Back to agents
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{agent.name}</h1>
        <p className="mt-2 text-neutral-400">{agent.description}</p>
        <div className="mt-4 flex gap-4 text-sm text-neutral-500">
          <span>Memories: {agent.memory_count}</span>
          <span>Created: {new Date(Number(agent.created_at) * 1000).toLocaleDateString()}</span>
        </div>
      </div>

      <Link
        href={`/agents/${agentId}/anchor`}
        className="mb-8 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
      >
        + Anchor Memory
      </Link>

      <h2 className="mb-4 text-xl font-semibold">Memory Timeline</h2>

      {agent.memory_count === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
          No memories anchored yet
        </div>
      ) : (
        <div className="space-y-3">
          {memoryData?.map((memory) => (
            <div
              key={memory.memory_index}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Memory #{memory.memory_index + 1}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {memory.description}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600 font-mono">
                    {memory.walrus_blob_id.slice(0, 20)}...
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(Number(memory.timestamp) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
