import dynamic from "next/dynamic";
import Link from "next/link";

const AgentList = dynamic(
  () => import("./agent-list"),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-neutral-900" /> }
);

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-12 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight hover:text-emerald-400 transition-colors">
          memproof
        </Link>
        <span className="text-sm text-neutral-400">Agents</span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Agents</h1>
        <Link
          href="/agents/new"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
        >
          + New Agent
        </Link>
      </div>

      <AgentList />
    </div>
  );
}
