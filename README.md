# ASTRA - Privacy Layer for Stellar

A privacy-preserving token system built on Stellar/Soroban using Zero-Knowledge Proofs.

## Overview

ASTRA enables private transactions on Stellar by converting public tokens (USDT, USDC, etc.) into private tokens (pUSDT, pUSDC) using ZK-SNARKs. Users can:

- **Deposit**: Convert public tokens → private commitments
- **Transfer**: Send private tokens without revealing amounts or parties
- **Withdraw**: Convert private tokens back to public

```
┌─────────────────────────────────────────────────────────────────┐
│                        ASTRA SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PUBLIC                PRIVATE                    PUBLIC       │
│                                                                  │
│   ┌──────┐   DEPOSIT   ┌──────────┐   WITHDRAW   ┌──────┐      │
│   │ USDT │ ──────────▶ │  pUSDT   │ ───────────▶ │ USDT │      │
│   └──────┘             │ (hidden) │              └──────┘      │
│                        └────┬─────┘                             │
│                             │                                   │
│                             │ TRANSFER (private)                │
│                             ▼                                   │
│                        ┌──────────┐                             │
│                        │  pUSDT   │                             │
│                        │  (Bob)   │                             │
│                        └──────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **ZK Circuits** | [Noir](https://noir-lang.org/) (Aztec) |
| **Proving System** | UltraHonk (Barretenberg) |
| **Smart Contracts** | Soroban (Rust) |
| **Blockchain** | Stellar |
| **Frontend** | Next.js 14 + TypeScript |
| **SDK** | TypeScript |

## Project Structure

```
astra/
├── packages/
│   ├── circuits/           # Noir ZK circuits
│   │   ├── common/         # Shared definitions (commitments, nullifiers)
│   │   ├── deposit/        # Deposit proof circuit
│   │   ├── transfer/       # Transfer proof circuit
│   │   ├── withdraw/       # Withdraw proof circuit
│   │   └── docs/           # Circuit specifications
│   │
│   ├── contracts/          # Soroban smart contracts
│   │   └── privacy-pool/   # Main privacy pool contract
│   │
│   ├── sdk/                # TypeScript SDK
│   │   └── src/            # Client, types, proof generation
│   │
│   └── web/                # Next.js frontend
│       ├── src/app/        # Pages (deposit, withdraw, notes, etc.)
│       ├── src/components/ # UI components
│       ├── src/hooks/      # React hooks
│       └── e2e/            # Playwright tests
│
└── docs/                   # Project documentation
    ├── arquitectura-privacidad.md
    └── PRPs/               # Privacy Research Proposals
```

### Related Repositories

| Repository | Description |
|------------|-------------|
| [ultrahonk_soroban_contract](../ultrahonk_soroban_contract/) | UltraHonk ZK verifier for Soroban |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- [Nargo](https://noir-lang.org/docs/getting_started/installation/) (for circuits)
- Rust + [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) (for contracts)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/astra.git
cd astra

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start frontend dev server
pnpm dev

# Run E2E tests
pnpm test:e2e

# Build circuits (requires Nargo)
cd packages/circuits
nargo compile
```

## Architecture

### Privacy Model

ASTRA uses a **UTXO-style commitment scheme**:

1. **Commitments**: `commitment = Hash(owner, amount, blinding)`
   - Stored in a Merkle tree on-chain
   - Amount and owner are hidden

2. **Nullifiers**: `nullifier = Hash(nullifier_key, commitment, rho)`
   - Published when spending a commitment
   - Prevents double-spending without revealing which commitment

3. **Proofs**: ZK-SNARKs prove:
   - User owns the commitment
   - Value conservation (inputs = outputs)
   - Correct nullifier derivation

### Key Hierarchy

```
spending_key (secret)
     │
     ├──▶ viewing_key = Hash(sk, "view")    → For auditors (read-only)
     │
     └──▶ nullifier_key = Hash(sk, "null")  → For spending
```

## Documentation

### Core Specifications

| Document | Description |
|----------|-------------|
| [FLOWS.md](packages/circuits/docs/FLOWS.md) | Deposit/Transfer/Withdraw flow diagrams |
| [VIEWING_KEYS_SPEC.md](packages/circuits/docs/VIEWING_KEYS_SPEC.md) | Viewing keys for auditors |
| [ENCRYPTED_NOTES_SPEC.md](packages/circuits/docs/ENCRYPTED_NOTES_SPEC.md) | Encrypted notes (Phase 2) |

### Architecture

| Document | Description |
|----------|-------------|
| [arquitectura-privacidad.md](docs/arquitectura-privacidad.md) | System architecture overview |

### PRPs (Privacy Research Proposals)

| PRP | Description |
|-----|-------------|
| [anchor-dashboard.md](docs/PRPs/anchor-dashboard.md) | Anchor client management |
| [regulator-viewing-keys.md](docs/PRPs/regulator-viewing-keys.md) | Regulator viewing key requests |
| [viewing-keys-architecture.md](docs/PRPs/viewing-keys-architecture.md) | Viewing keys technical design |

## Packages

### `packages/circuits`

Noir ZK circuits for proof generation.

```bash
cd packages/circuits
nargo compile        # Compile all circuits
nargo test           # Run circuit tests
```

### `packages/contracts`

Soroban smart contracts.

```bash
cd packages/contracts
cargo build --release --target wasm32-unknown-unknown
```

### `packages/sdk`

TypeScript SDK for interacting with ASTRA.

```typescript
import { AstraClient } from '@astra/sdk';

const client = new AstraClient();

// Generate deposit proof
const { commitment, proof } = await client.generateDeposit({
  amount: 1000n,
  spendingKey: userKey,
});

// Submit to contract
await client.deposit(commitment, proof);
```

### `packages/web`

Next.js frontend application.

```bash
cd packages/web
pnpm dev             # Start dev server at localhost:3000
pnpm test:e2e        # Run Playwright tests
```

## Roadmap

### Phase 1: Foundation (Current)

- [x] Noir circuit structure (deposit, transfer, withdraw)
- [x] Soroban privacy pool contract (structure)
- [x] TypeScript SDK (mock implementation)
- [x] Next.js frontend (functional UI)
- [x] E2E tests (44 tests passing)

### Phase 2: Integration

- [ ] Connect circuits to real proof generation
- [ ] Deploy contracts to Stellar testnet
- [ ] Integrate SDK with Soroban RPC
- [ ] End-to-end deposit/withdraw flow

### Phase 3: Privacy Features

- [ ] Viewing keys for auditors
- [ ] Encrypted notes on-chain
- [ ] Multi-asset support (USDT, USDC, etc.)

### Phase 4: Production

- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Performance optimization

## Security

ASTRA is experimental software. Do not use with real funds until audited.

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Double-spending | Nullifier set prevents reuse |
| Front-running | Commitment-reveal scheme |
| Amount leakage | ZK proofs hide amounts |
| Linkability | Nullifiers unlinkable to commitments |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT

## Acknowledgments

- [Noir](https://noir-lang.org/) by Aztec
- [Soroban](https://soroban.stellar.org/) by Stellar
- [RAILGUN](https://railgun.org/) for privacy system inspiration
