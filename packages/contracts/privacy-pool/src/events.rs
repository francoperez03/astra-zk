use soroban_sdk::{Address, BytesN, Env, Symbol};

pub fn emit_deposit(env: &Env, commitment: BytesN<32>, leaf_index: u32) {
    let topics = (Symbol::new(env, "deposit"), leaf_index);
    env.events().publish(topics, commitment);
}

pub fn emit_withdraw(env: &Env, nullifier: BytesN<32>, recipient: Address) {
    let topics = (Symbol::new(env, "withdraw"), recipient);
    env.events().publish(topics, nullifier);
}
