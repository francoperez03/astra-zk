use std::hash::poseidon2::Poseidon2::hash;

/// Account address = hash(private_key)
/// El owner demuestra conocimiento del private_key sin revelarlo
pub fn account(private_key: Field) -> Field {
    hash([private_key], 1)
}

/// Commitment = hash(owner, value, blinding)
/// blinding = random para hacer cada commitment único
pub fn commitment(owner: Field, value: Field, blinding: Field) -> Field {
    hash([owner, value, blinding], 3)
}

/// Nullifier = hash(commitment, blinding)
/// Único por nota, previene double-spend
pub fn nullifier(commitment: Field, blinding: Field) -> Field {
    hash([commitment, blinding], 2)
}
