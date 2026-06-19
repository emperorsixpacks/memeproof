# MemProof — Verifiable Agent Memory Vault

A decentralized, tamper-evident memory vault for AI agents.  
Anchor agent memory artifacts on-chain via **Stellar** (Soroban) and store blobs on **Walrus**.  
Trustless, independently verifiable integrity proofs.

## How It Works

1. **Register** — Create an AI agent on-chain with a name and description.
2. **Anchor** — Upload memory artifacts (logs, snapshots, files) to Walrus and record the blob ID + SHA-256 hash in a Soroban smart contract.
3. **Verify** — Anyone can re-fetch the blob from Walrus and recompute the hash to verify integrity against the on-chain record.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend    │────▶│    Walrus    │
│ (Next.js)   │     │  (FastAPI)   │     │  (Blob Store)│
└──────┬──────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│   Stellar    │
│  (Soroban)   │
│  Smart       │
│  Contracts   │
└──────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Stellar (Soroban, Rust/WASM) |
| **Smart Contracts** | Rust + soroban-sdk v26.1 |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS v4 |
| **Wallet** | Freighter (via StellarWalletsKit) |
| **Backend** | FastAPI (Python 3.13) |
| **Storage** | Walrus (HTTP blob store) |

## Project Structure

```
memproof/
├── contracts/             # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs         # Agent + MemoryAnchor contract
│       └── test.rs        # Unit tests
├── backend/               # FastAPI backend
│   ├── main.py
│   └── app/
│       ├── config.py
│       ├── routes/
│       └── services/
├── frontend/              # Next.js dApp
│   ├── src/
│   │   ├── lib/
│   │   │   ├── stellar.ts           # Stellar SDK helpers
│   │   │   ├── stellar-provider.tsx # Wallet context
│   │   │   ├── providers.tsx
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── components/
│   │   │   └── connect-wallet.tsx
│   │   └── app/
│   │       ├── page.tsx
│   │       ├── agents/
│   │       └── verify/
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Rust toolchain (1.84+)
- Soroban CLI (`cargo install --locked soroban-cli --features opt`)
- Node.js 20+
- Freighter Wallet browser extension

### 1. Build & Deploy Contract

```bash
cd contracts
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/memproof.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

### 2. Backend

```bash
cd backend
cp .env.example .env
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ID to the deployed contract ID
npm install
npm run dev
```

## Running Tests

```bash
cd contracts
cargo test
```

## Smart Contract API

### `register(caller, name, description) -> u32`
Register a new AI agent. Returns agent ID.

### `rename(agent_id, new_name)`
Rename an agent (owner only).

### `update_description(agent_id, new_description)`
Update agent description (owner only).

### `anchor(agent_id, blob_id, hash, size, mime, description)`
Anchor a memory artifact to an agent (owner only).

### View Functions
- `get_agent(agent_id) -> Agent`
- `get_agent_count() -> u32`
- `get_agent_owner(agent_id) -> Address`
- `get_agent_memory_count(agent_id) -> u32`
- `get_agent_memories(agent_id) -> Vec<u32>`
- `get_agents_by_owner(owner) -> Vec<u32>`
- `get_memory(agent_id, index) -> MemoryAnchor`

## License

MIT
