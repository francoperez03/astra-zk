use poseidon::poseidon2::Poseidon2::hash;

// =============================================================================
// Domain Separators
// =============================================================================
// Used for secure key derivation - prevents cross-domain attacks

/// Domain separator for viewing key derivation (ASCII: "viewing_key")
global VIEWING_DOMAIN: Field = 0x76696577696e675f6b6579;

/// Domain separator for nullifier key derivation (ASCII: "nullifier!")
global NULLIFIER_DOMAIN: Field = 0x6e756c6c696669657221;

// =============================================================================
// Key Derivation Functions
// =============================================================================

/// Derive viewing key from spending key
/// The viewing key allows scanning the blockchain for owned notes
/// but cannot be used to spend funds
///
/// viewing_key = Poseidon2(spending_key, VIEWING_DOMAIN)
pub fn derive_viewing_key(spending_key: Field) -> Field {
    hash([spending_key, VIEWING_DOMAIN], 2)
}

/// Derive nullifier key from spending key
/// The nullifier key is required to compute nullifiers when spending
/// This ensures viewing key holders cannot detect when notes are spent
///
/// nullifier_key = Poseidon2(spending_key, NULLIFIER_DOMAIN)
pub fn derive_nullifier_key(spending_key: Field) -> Field {
    hash([spending_key, NULLIFIER_DOMAIN], 2)
}

// =============================================================================
// Account & Note Functions
// =============================================================================

/// Account address = hash(viewing_key)
/// This is the public identifier shared with senders
/// Changed from hash(private_key) to hash(viewing_key) for viewing key support
pub fn account(viewing_key: Field) -> Field {
    hash([viewing_key], 1)
}

/// Commitment = hash(owner, value, blinding)
/// Hides note details in the Merkle tree
/// - owner: account address (hash of viewing key)
/// - value: token amount
/// - blinding: random factor for uniqueness
pub fn commitment(owner: Field, value: Field, blinding: Field) -> Field {
    hash([owner, value, blinding], 3)
}

/// Nullifier = hash(nullifier_key, commitment, rho)
/// Prevents double-spend of notes
///
/// SECURITY: Now requires nullifier_key (derived from spending_key)
/// instead of just blinding. This ensures:
/// - Viewing key holders cannot compute nullifiers
/// - Cannot detect when notes are spent without spending_key
///
/// - nullifier_key: derived from spending_key (secret)
/// - commitment: the note being spent
/// - rho: unique per note, derived from blinding (prevents rainbow attacks)
pub fn nullifier(nullifier_key: Field, commitment: Field, rho: Field) -> Field {
    hash([nullifier_key, commitment, rho], 3)
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Generate rho from blinding
/// rho is a unique identifier per note used in nullifier derivation
/// Separating rho from blinding adds an extra layer of security
pub fn derive_rho(blinding: Field) -> Field {
    hash([blinding], 1)
}

// =============================================================================
// Legacy Compatibility (DEPRECATED - Remove in v2.0)
// =============================================================================

/// DEPRECATED: Use derive_viewing_key + account instead
/// Kept for backward compatibility during migration
pub fn account_legacy(private_key: Field) -> Field {
    hash([private_key], 1)
}

/// DEPRECATED: Old nullifier scheme - insecure if blinding is leaked
/// Use the new nullifier(nullifier_key, commitment, rho) instead
pub fn nullifier_legacy(commitment: Field, blinding: Field) -> Field {
    hash([commitment, blinding], 2)
}
