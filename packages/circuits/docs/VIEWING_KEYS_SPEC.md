# Astra Viewing Keys Specification

## Overview

This document specifies the viewing key architecture for Astra, inspired by RAILGUN's privacy system. Viewing keys enable third parties (auditors, exchanges, regulators) to view transaction history without the ability to spend funds.

## Key Hierarchy

```
                    Master Seed (Mnemonic)
                           │
                           ▼
              ┌────────────────────────┐
              │     Spending Key       │
              │      (sk_spend)        │
              └────────────────────────┘
                    │         │
         ┌──────────┘         └──────────┐
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  Viewing Key    │             │ Nullifier Key   │
│   (sk_view)     │             │     (nk)        │
└─────────────────┘             └─────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│ - Decrypt notes │             │ - Derive        │
│ - Scan chain    │             │   nullifiers    │
│ - View balances │             │ - Detect spent  │
└─────────────────┘             └─────────────────┘
```

## Key Derivation

All keys are derived using Poseidon2 hash with domain separation:

```noir
// Domain separators (ASCII encoded)
global VIEWING_DOMAIN: Field = 0x76696577696e675f6b6579;   // "viewing_key"
global NULLIFIER_DOMAIN: Field = 0x6e756c6c696669657221;   // "nullifier!"

/// Derive viewing key from spending key
pub fn derive_viewing_key(spending_key: Field) -> Field {
    Poseidon2::hash([spending_key, VIEWING_DOMAIN], 2)
}

/// Derive nullifier key from spending key
pub fn derive_nullifier_key(spending_key: Field) -> Field {
    Poseidon2::hash([spending_key, NULLIFIER_DOMAIN], 2)
}
```

## Note Structure

A note represents ownership of private tokens:

```noir
struct Note {
    owner: Field,           // = hash(viewing_key) - the "account"
    value: Field,           // Amount of tokens
    blinding: Field,        // Randomness for commitment uniqueness
    rho: Field,             // Unique identifier for nullifier derivation
}
```

## Commitment

The commitment hides the note details in the Merkle tree:

```noir
/// commitment = Poseidon2(owner, value, blinding)
/// - owner: derived from viewing_key (allows scanning)
/// - value: hidden token amount
/// - blinding: random factor for uniqueness
pub fn commitment(owner: Field, value: Field, blinding: Field) -> Field {
    Poseidon2::hash([owner, value, blinding], 3)
}
```

## Nullifier (Updated)

The nullifier prevents double-spending. **Critical change**: Now derived from `nullifier_key` instead of `blinding`:

### Before (Insecure)
```noir
// OLD - Anyone who learns blinding can compute nullifier
nullifier = Poseidon2(commitment, blinding)
```

### After (Secure)
```noir
// NEW - Only owner with nullifier_key can compute
/// nullifier = Poseidon2(nullifier_key, commitment, rho)
/// - nullifier_key: derived from spending_key (secret)
/// - commitment: the note being spent
/// - rho: unique per note, prevents rainbow attacks
pub fn nullifier(nullifier_key: Field, commitment: Field, rho: Field) -> Field {
    Poseidon2::hash([nullifier_key, commitment, rho], 3)
}
```

## Key Capabilities Matrix

| Capability | Viewing Key Only | Spending Key |
|------------|:----------------:|:------------:|
| Decrypt incoming notes | ✅ | ✅ |
| Scan blockchain for notes | ✅ | ✅ |
| View balance history | ✅ | ✅ |
| Calculate nullifiers | ❌ | ✅ |
| Detect if note was spent | ❌ | ✅ |
| Sign transactions | ❌ | ✅ |
| Spend funds | ❌ | ✅ |

## Account Address

The public account address is derived from the viewing key:

```noir
/// Account = Poseidon2(viewing_key)
/// This is what receivers share to receive payments
pub fn account(viewing_key: Field) -> Field {
    Poseidon2::hash([viewing_key], 1)
}
```

## Circuit Changes Summary

### deposit circuit
- Input: `receiver_viewing_key` (instead of `receiver_private_key`)
- Derives: `account(receiver_viewing_key)`
- Generates: `rho` for future nullifier calculation

### transfer circuit
- Input: `sender_spending_key`
- Derives internally:
  - `viewing_key = derive_viewing_key(spending_key)`
  - `nullifier_key = derive_nullifier_key(spending_key)`
  - `account = account(viewing_key)`
- Uses: `nullifier(nullifier_key, commitment, rho)`

### withdraw circuit
- Same changes as transfer circuit

## Security Properties

1. **Spend Privacy**: Viewing key holders cannot determine when notes are spent (nullifiers require spending key)

2. **Balance Privacy**: Only viewing key holders can see account balances

3. **Forward Secrecy**: Compromising viewing key doesn't reveal past spending patterns

4. **Nullifier Unlinkability**: Each nullifier requires the unique `rho` value, preventing nullifier grinding attacks

## Shareable Viewing Key Format

For audit purposes, a viewing key can be shared:

```noir
struct ShareableViewingKey {
    viewing_key: Field,
    // Optional restrictions
    start_block: Option<u64>,  // Only view from this block
    end_block: Option<u64>,    // Only view until this block
}
```

## Migration Path

### Phase 1: Current Implementation
- Update `definitions.nr` with new derivation functions
- Keep backward compatibility functions
- Update circuits to use new nullifier scheme

### Phase 2: On-chain Encryption (Future)
- Add encrypted note data to on-chain events
- Implement ECDH key exchange for note encryption
- Enable full chain scanning with viewing key

### Phase 3: Full RAILGUN Compatibility (Future)
- Dual curve support (Baby JubJub + Ed25519)
- Stealth addresses
- Multi-asset support

## References

- [RAILGUN Privacy System](https://docs.railgun.org/wiki/learn/privacy-system)
- [Zcash Orchard Keys](https://zcash.github.io/orchard/design/keys.html)
- [Penumbra Viewing Keys](https://protocol.penumbra.zone/main/addresses_keys/viewing_keys.html)

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-22 | Initial specification |
