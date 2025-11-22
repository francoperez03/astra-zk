
use poseidon::poseidon2::Poseidon2::hash;

/// Account address = hash(private_key)
/// The owner proves knowledge of the private_key without revealing it
pub fn account(private_key: Field) -> Field {
    hash([private_key], 1)
}

/// Commitment = hash(owner, value, blinding)
/// blinding random to make each commitment unique
pub fn commitment(owner: Field, value: Field, blinding: Field) -> Field {
    hash([owner, value, blinding], 3)
}

/// Nullifier = hash(commitment, blinding)
/// Unique per note, prevents double-spend
pub fn nullifier(commitment: Field, blinding: Field) -> Field {
    hash([commitment, blinding], 2)
}
