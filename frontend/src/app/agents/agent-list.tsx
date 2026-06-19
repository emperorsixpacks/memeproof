"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useStellar } from "@/lib/stellar-provider";
import { getAgent, getAgentsByOwner } from "@/lib/api";

export default function AgentList() {
  const { publicKey, isConnected } = useStellar();

  const { data, isPending } = useQuery({
    queryKey: ["agents", publicKey],
    queryFn: async () => {
      const ids = await getAgentsByOwner(publicKey!);
      const agents = await Promise.all(ids.map((id) => getAgent(id)));
      return agents;
    },
    enabled: !!publicKey,
  });

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
        Connect your wallet to view agents
      </div>
    );
  }

  if (isPending) {
    return <div className="h-32 animate-pulse rounded-xl bg-neutral-900" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-500">
        No agents yet. Create your first one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((agent) => (
        <Link
          key={agent.id}
          href={`/agents/${agent.id}`}
          className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 transition-colors hover:border-neutral-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="mt-1 text-sm text-neutral-400 line-clamp-1">
                {agent.description}
              </p>
            </div>
            <span className="text-xs text-neutral-500">
              {agent.memory_count} memories
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
