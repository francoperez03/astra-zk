use soroban_sdk::{BytesN, Env};

/// Get the zero root for an empty tree
pub fn zero_root(env: &Env) -> BytesN<32> {
    // TODO: Compute proper zero root for depth 20
    BytesN::from_array(env, &[0u8; 32])
}
