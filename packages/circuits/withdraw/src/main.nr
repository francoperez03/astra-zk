use common::definitions::{account, commitment, nullifier, derive_viewing_key, derive_nullifier_key};
use common::merkle_tree::assert_merkle_inclusion;
use poseidon::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production
global DEPTH: u32 = 2;

/// Withdraw circuit: Convert private note back to public tokens
///
/// Flow:
/// 1. Owner has note with X tokens
/// 2. Generates nullifier (burns the note) using nullifier_key
/// 3. Receives X public tokens at recipient address
///
/// Key hierarchy:
/// - spending_key -> viewing_key -> account
/// - spending_key -> nullifier_key (for deriving nullifiers)
pub fn main(
    // Private inputs
    owner_spending_key: Field,  // Owner's spending key (secret)
    note_value: Field,
    note_blinding: Field,
    note_rho: Field,            // Unique note identifier from deposit/transfer
    merkle_path: [Field; DEPTH],
    merkle_indices: [bool; DEPTH],

    // Public inputs
    merkle_root: pub Field,
    out_nullifier: pub Field,
    recipient: pub Field,   // Stellar address (prevents front-running)
    relayer: pub Field,     // Optional relayer address
    fee: pub Field,         // Optional relayer fee
) {
    // 1. Derive keys from spending key
    let owner_viewing_key = derive_viewing_key(owner_spending_key);
    let owner_nullifier_key = derive_nullifier_key(owner_spending_key);
    let owner_account = account(owner_viewing_key);

    // 2. Reconstruct commitment
    let note_commitment = commitment(owner_account, note_value, note_blinding);

    // 3. Verify it's in the tree
    assert_merkle_inclusion(
        merkle_root,
        merkle_path,
        merkle_indices,
        note_commitment,
        "Note not in tree",
    );

    // 4. Verify nullifier (using nullifier_key for security)
    let expected_nullifier = nullifier(owner_nullifier_key, note_commitment, note_rho);
    assert(expected_nullifier == out_nullifier, "Invalid nullifier");

    // 5. Verify fee <= note_value (if relayer is used)
    if relayer != 0 {
        assert(fee as u64 <= note_value as u64, "Fee exceeds value");
    }

    // recipient is in public inputs - binds proof to that specific recipient
    // Contract will verify tokens go to that recipient
}

#[test]
fn test_withdraw() {
    // Setup: owner's spending key
    let owner_spending_key = 12345;

    // Derive keys using new hierarchy
    let owner_viewing_key = derive_viewing_key(owner_spending_key);
    let owner_nullifier_key = derive_nullifier_key(owner_spending_key);
    let owner_acc = account(owner_viewing_key);

    let value = 1000;
    let blinding = 99999;
    let note_rho = hash([blinding], 1); // rho from original deposit

    let note_commitment = commitment(owner_acc, value, blinding);

    // NEW: nullifier uses nullifier_key instead of blinding
    let out_nullifier = nullifier(owner_nullifier_key, note_commitment, note_rho);

    // Build tree with the commitment
    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    let recipient = 0x123456; // Stellar address as field
    let relayer = 0;
    let fee = 0;

    main(
        owner_spending_key,
        value,
        blinding,
        note_rho,
        [0, zero_hash],
        [false, false],
        merkle_root,
        out_nullifier,
        recipient,
        relayer,
        fee,
    );
}

#[test(should_fail_with = "Note not in tree")]
fn test_withdraw_wrong_owner() {
    // Setup: real owner creates the note
    let real_owner_spending_key = 12345;
    let fake_owner_spending_key = 99999; // Wrong key - attacker

    // Real owner's keys
    let real_owner_viewing_key = derive_viewing_key(real_owner_spending_key);
    let real_owner_nullifier_key = derive_nullifier_key(real_owner_spending_key);
    let real_owner_acc = account(real_owner_viewing_key);

    let value = 1000;
    let blinding = 99999;
    let note_rho = hash([blinding], 1);

    // Note belongs to real owner
    let note_commitment = commitment(real_owner_acc, value, blinding);
    let out_nullifier = nullifier(real_owner_nullifier_key, note_commitment, note_rho);

    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    // Try with wrong spending key - should fail because commitment won't match
    // (attacker's account != real owner's account)
    main(
        fake_owner_spending_key, // WRONG - will derive different account
        value,
        blinding,
        note_rho,
        [0, zero_hash],
        [false, false],
        merkle_root,
        out_nullifier,
        0x123456,
        0,
        0,
    );
}

#[test(should_fail_with = "Fee exceeds value")]
fn test_withdraw_fee_too_high() {
    // Setup: owner's spending key
    let owner_spending_key = 12345;

    // Derive keys
    let owner_viewing_key = derive_viewing_key(owner_spending_key);
    let owner_nullifier_key = derive_nullifier_key(owner_spending_key);
    let owner_acc = account(owner_viewing_key);

    let value = 1000;
    let blinding = 99999;
    let note_rho = hash([blinding], 1);

    let note_commitment = commitment(owner_acc, value, blinding);
    let out_nullifier = nullifier(owner_nullifier_key, note_commitment, note_rho);

    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    let relayer = 0x999; // Using relayer
    let fee = 2000;      // Fee > value - INVALID

    main(
        owner_spending_key,
        value,
        blinding,
        note_rho,
        [0, zero_hash],
        [false, false],
        merkle_root,
        out_nullifier,
        0x123456,
        relayer,
        fee,
    );
}
