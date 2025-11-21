#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Vec};

mod merkle;
mod events;

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Verifier,
    Denomination,
    MerkleRoot,
    NextLeafIndex,
    Nullifier(BytesN<32>),
    RootHistory(u32),
    Paused,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotInitialized,
    AlreadyInitialized,
    Unauthorized,
    NullifierAlreadyUsed,
    InvalidProof,
    UnknownRoot,
    ContractPaused,
    InvalidAmount,
}

#[contract]
pub struct PrivacyPool;

#[contractimpl]
impl PrivacyPool {
    /// Initialize the privacy pool
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        verifier: Address,
        denomination: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Denomination, &denomination);
        env.storage().instance().set(&DataKey::NextLeafIndex, &0u32);
        env.storage().instance().set(&DataKey::Paused, &false);

        // Initialize merkle root with zero tree
        let zero_root = merkle::zero_root(&env);
        env.storage().instance().set(&DataKey::MerkleRoot, &zero_root);

        Ok(())
    }

    /// Deposit tokens into the privacy pool
    pub fn deposit(
        env: Env,
        depositor: Address,
        commitment: BytesN<32>,
        proof: BytesN<256>,
        new_root: BytesN<32>,
    ) -> Result<u32, Error> {
        Self::require_not_paused(&env)?;
        depositor.require_auth();

        // Transfer tokens to contract
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let denomination: i128 = env.storage().instance().get(&DataKey::Denomination).unwrap();

        // TODO: Call token.transfer(depositor, contract, denomination)

        // Verify deposit proof
        let verifier: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        // TODO: Call verifier.verify_deposit(proof, current_root, commitment, new_root)

        // Get next leaf index
        let leaf_index: u32 = env.storage().instance().get(&DataKey::NextLeafIndex).unwrap();

        // Update merkle root
        Self::update_root(&env, new_root.clone());

        // Increment leaf index
        env.storage().instance().set(&DataKey::NextLeafIndex, &(leaf_index + 1));

        // Emit event
        events::emit_deposit(&env, commitment.clone(), leaf_index);

        Ok(leaf_index)
    }

    /// Withdraw tokens from the privacy pool
    pub fn withdraw(
        env: Env,
        proof: BytesN<256>,
        root: BytesN<32>,
        nullifier: BytesN<32>,
        recipient: Address,
        relayer: Address,
        fee: i128,
    ) -> Result<(), Error> {
        Self::require_not_paused(&env)?;

        // Check nullifier hasn't been used
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier.clone())) {
            return Err(Error::NullifierAlreadyUsed);
        }

        // Check root is known
        if !Self::is_known_root(&env, root.clone()) {
            return Err(Error::UnknownRoot);
        }

        // Verify proof
        let verifier: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        // TODO: Call verifier.verify_withdraw(proof, root, nullifier, recipient, relayer, fee)

        // Mark nullifier as used
        env.storage().persistent().set(&DataKey::Nullifier(nullifier.clone()), &true);

        // Transfer tokens
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let denomination: i128 = env.storage().instance().get(&DataKey::Denomination).unwrap();

        let amount_to_recipient = denomination - fee;
        // TODO: Call token.transfer(contract, recipient, amount_to_recipient)
        // TODO: If fee > 0, call token.transfer(contract, relayer, fee)

        // Emit event
        events::emit_withdraw(&env, nullifier.clone(), recipient.clone());

        Ok(())
    }

    /// Check if a root is known (current or in history)
    pub fn is_known_root(env: &Env, root: BytesN<32>) -> bool {
        let current_root: BytesN<32> = env.storage().instance().get(&DataKey::MerkleRoot).unwrap();
        if current_root == root {
            return true;
        }

        // Check history (last 100 roots)
        for i in 0..100u32 {
            if let Some(historical_root) = env.storage().persistent().get::<_, BytesN<32>>(&DataKey::RootHistory(i)) {
                if historical_root == root {
                    return true;
                }
            }
        }

        false
    }

    /// Check if a nullifier has been spent
    pub fn is_spent(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier))
    }

    /// Get current merkle root
    pub fn get_root(env: Env) -> BytesN<32> {
        env.storage().instance().get(&DataKey::MerkleRoot).unwrap()
    }

    /// Get denomination
    pub fn get_denomination(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Denomination).unwrap()
    }

    /// Emergency pause (admin only)
    pub fn pause(env: Env, admin: Address) -> Result<(), Error> {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }
        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    // Internal helpers

    fn require_not_paused(env: &Env) -> Result<(), Error> {
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }

    fn update_root(env: &Env, new_root: BytesN<32>) {
        let current_root: BytesN<32> = env.storage().instance().get(&DataKey::MerkleRoot).unwrap();
        let next_index: u32 = env.storage().instance().get(&DataKey::NextLeafIndex).unwrap();

        // Store current root in history
        let history_index = next_index % 100;
        env.storage().persistent().set(&DataKey::RootHistory(history_index), &current_root);

        // Set new root
        env.storage().instance().set(&DataKey::MerkleRoot, &new_root);
    }
}

mod test {
    #[test]
    fn test_initialize() {
        // TODO: Add tests
    }
}
