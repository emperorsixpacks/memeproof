import dynamic from "next/dynamic";
import Link from "next/link";

const ConnectWallet = dynamic(
  () => import("@/components/connect-wallet").then((m) => ({ default: m.ConnectWallet })),
  { ssr: false, loading: () => <div className="h-10 w-40 animate-pulse rounded bg-neutral-800" /> }
);

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-12">
      <nav className="mb-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">memproof</span>
        <div className="flex items-center gap-6">
          <Link href="/agents" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Agents
          </Link>
          <Link href="/verify" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Verify
          </Link>
          <ConnectWallet />
        </div>
      </nav>

      <main className="flex-1">
        <section className="mb-16">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Verifiable Agent
            <br />
            <span className="text-emerald-400">Memory Vault</span>
          </h1>
          <p className="max-w-xl text-lg text-neutral-400">
            Anchor AI agent memory artifacts to Stellar via Walrus decentralized storage.
            Tamper-evident, trustless, independently verifiable.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h3 className="mb-2 font-semibold text-emerald-400">1. Register</h3>
            <p className="text-sm text-neutral-400">Create an on-chain agent with a name and description.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h3 className="mb-2 font-semibold text-emerald-400">2. Anchor</h3>
            <p className="text-sm text-neutral-400">Upload memory artifacts to Walrus and anchor the proof on Stellar.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h3 className="mb-2 font-semibold text-emerald-400">3. Verify</h3>
            <p className="text-sm text-neutral-400">Anyone can verify integrity by re-fetching and comparing hashes.</p>
          </div>
        </section>

        <div className="mt-12 flex gap-4">
          <Link
            href="/agents"
            className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-black transition-colors hover:bg-emerald-400"
          >
            Get Started
          </Link>
          <Link
            href="/verify"
            className="rounded-lg border border-neutral-700 px-6 py-3 font-medium text-neutral-300 transition-colors hover:border-neutral-500"
          >
            Verify a Memory
          </Link>
        </div>
      </main>
    </div>
  );
}
