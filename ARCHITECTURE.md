# MemoProof Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Frontend                       │
│  (Sui dApp Kit React + Walrus TS SDK + Tailwind)         │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Dashboard│ │ Agents   │ │ Memories │ │ Verify   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
├───────┴────────────┴────────────┴────────────┴──────────┤
│                    FastAPI Backend                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Walrus     │ │ Hashing    │ │ Verification│           │
│  │ Publisher  │ │ Service    │ │ Service    │           │
│  │ Client     │ │ (SHA-256)  │ │            │           │
│  └─────┬──────┘ └────────────┘ └────────────┘           │
├────────┼────────────────────────────────────────────────┤
│        │              Walrus Network                     │
│  ┌─────┴──────────┐       ┌──────────────────┐          │
│  │ Publisher (HTTP)│       │ Aggregator (HTTP)│          │
│  │ PUT /v1/blobs   │       │ GET /v1/<blobId> │          │
│  └─────┬──────────┘       └────────┬─────────┘          │
├───────┴────────────────────────────┴────────────────────┤
│                     Sui Network                          │
│  ┌────────────────────┐  ┌───────────────────────────┐  │
│  │ Move Contract      │  │ Tatum gRPC Gateway        │  │
│  │ - Agent Registry   │  │ sui-testnet-grpc.gateway  │  │
│  │ - Memory Anchoring │  │     .tatum.io:443         │  │
│  └────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### Sui Move Objects

#### Agent
```
struct Agent has key, store {
    id: UID,
    name: String,
    description: String,
    created_by: address,
    created_at: u64,          // unix ms
    memory_count: u64,
    memory_table: Table<u64, ID>,  // seq → MemoryAnchor ID
}
```
- Owned by creator address
- `memory_table` enables on-chain timeline traversal

#### MemoryAnchor
```
struct MemoryAnchor has key, store {
    id: UID,
    agent_id: ID,
    walrus_blob_id: String,   // base64-encoded Walrus blob ID
    content_hash: String,      // SHA-256 hex digest
    size: u64,                // bytes
    mime_type: String,
    description: String,
    timestamp: u64,           // unix ms
    created_by: address,
}
```
- Owned by creator address
- Linked to Agent via `agent_id`
- Anyone can read and verify

### Off-chain (Backend)

#### MemoryUploadRequest
```
{
    file: binary,
    agent_id: string,
    description: string,
    mime_type: string,
}
```

#### MemoryUploadResponse
```
{
    walrus_blob_id: string,   // base64
    content_hash: string,      // SHA-256 hex
    size: number,
}
```

---

## Sui Move Contract Architecture

### Package: `memproof`

#### Module `agent`
| Function | Visibility | Description |
|---|---|---|
| `register(name, description, ctx)` | `entry` | Creates new Agent, shares it for discovery |
| `rename(agent, new_name, ctx)` | `entry` | Update agent name (owner only) |
| `update_description(agent, description, ctx)` | `entry` | Update agent description (owner only) |

#### Module `memory`
| Function | Visibility | Description |
|---|---|---|
| `anchor(agent, blob_id, hash, size, mime, desc, ctx)` | `entry` | Creates MemoryAnchor, appends to agent's table |
| `get_memory_count(agent)` | `view` | Returns number of memories |
| `get_memory(agent, index)` | `view` | Returns MemoryAnchor at index |

#### Key Design Decisions
- **Agent is shared** — anyone can view its memory table (read-only). Only owner can mutate.
- **MemoryAnchor is owned** — owner controls it, but content is immutable once created.
- **Table-based lookup** — `memory_count` and `memory_table` give O(1) access to any record.
- **No deletion** — memory anchors are append-only for audit integrity.

---

## FastAPI Backend Architecture

### Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/memories/upload` | Accept file, compute SHA-256, upload to Walrus publisher, return blob_id + hash |
| `GET` | `/api/memories/{blob_id}` | Fetch blob content from Walrus aggregator |
| `POST` | `/api/verify` | Accept blob_id + expected_hash, fetch blob, recompute hash, return match/mismatch |

### Services

#### Walrus Service
- **Upload**: POST file bytes to Walrus publisher (`https://publisher.testnet.walrus.space/v1/blobs?epochs=1`)
- **Read**: GET blob from Walrus aggregator (`https://aggregator.testnet.walrus.space/v1/<blob_id>`)
- Both publisher and aggregator URLs are configurable per environment

#### Hashing Service
- Computes SHA-256 over raw byte content
- Returns hex-encoded digest

### Config (environment variables)
```
WALRUS_PUBLISHER_URL=https://publisher.testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.testnet.walrus.space
```

---

## Next.js Frontend Architecture

### Routes (App Router)

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` | Dashboard — connect wallet, quick stats |
| `/agents` | `AgentListPage` | List user's agents |
| `/agents/new` | `CreateAgentPage` | Form to register new agent |
| `/agents/[id]` | `AgentDetailPage` | Agent info + memory timeline |
| `/agents/[id]/anchor` | `AnchorMemoryPage` | Upload file to anchor for agent |
| `/memories/[blobId]` | `MemoryDetailPage` | Memory record + verify button |
| `/verify` | `VerifyPage` | Manual verification (paste blob_id + hash) |

### dApp Kit Setup (new `@mysten/dapp-kit-react`)

```
app/dapp-kit.ts          — createDAppKit with SuiGrpcClient + Tatum endpoints
app/providers.tsx        — DAppKitProvider wrapper (client component)
```

Key pattern:
```ts
export const dAppKit = createDAppKit({
  networks: ['testnet'],
  createClient: (network) => new SuiGrpcClient({
    network,
    baseUrl: 'https://sui-testnet-grpc.gateway.tatum.io:443',
  }),
});
```

### Component Tree

```
Layout (server)
├── Providers (client, dynamic import, ssr:false)
│   ├── DAppKitProvider
│   └── React Query Provider
├── Navbar
│   ├── Logo
│   ├── NavLinks
│   └── ConnectButton (dynamic, ssr:false)
└── Page Content

AgentListPage
├── CreateAgentButton
└── AgentCard[] (name, description, memory count, created date)

AgentDetailPage
├── AgentHeader (name, description, metadata)
├── AnchorMemoryButton → /agents/[id]/anchor
└── MemoryTimeline
    └── MemoryCard[] (blob_id preview, hash, size, timestamp, verify button)

AnchorMemoryPage
├── FileDropzone
├── DescriptionInput
└── SubmitButton (triggers: backend upload → wallet sign on-chain tx)

VerifyPage
├── BlobIdInput
├── ExpectedHashInput
└── VerifyButton → shows PASS/FAIL result
```

### Data Flow

**Memory Anchoring:**
```
1. User drops file + fills description
2. Frontend POST file + agent_id + desc → FastAPI
3. FastAPI computes SHA-256, uploads to Walrus publisher
4. FastAPI returns { walrus_blob_id, content_hash, size }
5. Frontend builds Transaction (moveCall: anchor)
6. Wallet signs & executes on Sui
7. UI refreshes agent timeline
```

**Verification:**
```
1. Frontend reads MemoryAnchor from Sui (blob_id, content_hash)
   OR user manually enters blob_id + expected_hash
2. Frontend GET /api/verify?blob_id=...&expected_hash=...
   OR directly via /api/memories/{blob_id}
3. Backend fetches blob from Walrus aggregator
4. Backend recomputes SHA-256
5. Backend returns { match: true/false, computed_hash: "..." }
6. UI shows green check or red X
```

---

## Directory Structure

```
memproof/
├── contracts/
│   ├── Move.toml
│   ├── sources/
│   │   ├── agent.move
│   │   └── memory.move
│   └── tests/
│       ├── agent_tests.move
│       └── memory_tests.move
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── memories.py
│       │   └── verify.py
│       └── services/
│           ├── __init__.py
│           ├── walrus.py
│           └── hashing.py
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dapp-kit.ts
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── anchor/
│   │   │           └── page.tsx
│   │   ├── memories/
│   │   │   └── [blobId]/
│   │   │       └── page.tsx
│   │   └── verify/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ConnectWallet.tsx
│   │   ├── AgentCard.tsx
│   │   ├── MemoryCard.tsx
│   │   ├── MemoryTimeline.tsx
│   │   ├── FileDropzone.tsx
│   │   └── VerifyResult.tsx
│   └── lib/
│       ├── api.ts
│       └── types.ts
└── docs/
    └── architecture.md
```

---

## Key Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Sui RPC | Tatum gRPC | JSON-RPC deprecated July 2026; gRPC is future-proof |
| dApp Kit | `@mysten/dapp-kit-react` (new) | Legacy `@mysten/dapp-kit` only supports deprecated JSON-RPC |
| Walrus upload | Publisher HTTP API (server-side) | Browser cannot handle 2000+ direct storage node requests |
| Walrus read | Aggregator HTTP API | Simple GET request, efficient for verification |
| Blob storage params | `epochs=1`, `deletable=false` | Permanent blobs for audit trail; 1 epoch = 2 weeks on mainnet |
| Hashing | SHA-256 | Standard, widely supported, sufficient for content verification |
| Agent ownership | Shared object (readable by all) | Enables public audit timeline while owner retains write access |
| Memory storage | Owned objects + Table index | Balances queryability with Sui ownership model |

---

## Deployment Considerations

- **Sui**: Deploy Move package via `sui client publish`. Package ID becomes immutable.
- **Backend**: Deploy as container (FastAPI + uvicorn). Needs wallet funding for Walrus publisher fees.
- **Frontend**: Deploy to Vercel or similar. All on-chain writes require user wallet signature.
- **Walrus**: Blobs stored permanently (not deletable) for tamper-evident audit trail. Costs WAL tokens paid by backend wallet at upload time.

---

## Success Criteria (from PRD)

1. Agent registration tx confirmed on Sui testnet ✓
2. Memory blob stored on Walrus, retrievable by blob ID ✓
3. Proof verification returns correct match/mismatch ✓
4. End-to-end demo < 60s ✓
