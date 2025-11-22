use common::definitions::{account, commitment, nullifier};
use common::merkle_tree::assert_merkle_inclusion;
use poseidon::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production
global DEPTH: u32 = 2;

/// Withdraw circuit: Convert private note back to public tokens
///
/// Flow:
/// 1. Owner has note with X tokens
/// 2. Generates nullifier (burns the note)
/// 3. Receives X public tokens at recipient address
pub fn main(
    // Private inputs
    owner_private_key: Field,
    note_value: Field,
    note_blinding: Field,
    merkle_path: [Field; DEPTH],
    merkle_indices: [bool; DEPTH],

    // Public inputs
    merkle_root: pub Field,
    out_nullifier: pub Field,
    recipient: pub Field,   // Stellar address (prevents front-running)
    relayer: pub Field,     // Optional relayer address
    fee: pub Field,         // Optional relayer fee
) {
    let owner_account = account(owner_private_key);

    // 1. Reconstruct commitment
    let note_commitment = commitment(owner_account, note_value, note_blinding);

    // 2. Verify it's in the tree
    assert_merkle_inclusion(
        merkle_root,
        merkle_path,
        merkle_indices,
        note_commitment,
        "Note not in tree",
    );

    // 3. Verify nullifier
    let expected_nullifier = nullifier(note_commitment, note_blinding);
    assert(expected_nullifier == out_nullifier, "Invalid nullifier");

    // 4. Verify fee <= note_value (if relayer is used)
    if relayer != 0 {
        assert(fee as u64 <= note_value as u64, "Fee exceeds value");
    }

    // recipient is in public inputs - binds proof to that specific recipient
    // Contract will verify tokens go to that recipient
}

#[test]
fn test_withdraw() {

    let owner_pk = 12345;
    let owner_acc = account(owner_pk);
    let value = 1000;
    let blinding = 99999;

    let note_commitment = commitment(owner_acc, value, blinding);
    let out_nullifier = nullifier(note_commitment, blinding);

    // Build tree with the commitment
    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    let recipient = 0x123456; // Stellar address as field
    let relayer = 0;
    let fee = 0;

    main(
        owner_pk,
        value,
        blinding,
        [0, zero_hash],
        [false, false],
        merkle_root,
        out_nullifier,
        recipient,
        relayer,
        fee,
    );
}

#[test(should_fail_with = "Invalid nullifier")]
fn test_withdraw_wrong_owner() {

    let real_owner_pk = 12345;
    let fake_owner_pk = 99999; // Wrong key
    let owner_acc = account(real_owner_pk);
    let value = 1000;
    let blinding = 99999;

    let note_commitment = commitment(owner_acc, value, blinding);
    let out_nullifier = nullifier(note_commitment, blinding);

    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    // Try with wrong private key - should fail
    main(
        fake_owner_pk, // WRONG
        value,
        blinding,
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

    let owner_pk = 12345;
    let owner_acc = account(owner_pk);
    let value = 1000;
    let blinding = 99999;

    let note_commitment = commitment(owner_acc, value, blinding);
    let out_nullifier = nullifier(note_commitment, blinding);

    let zero_hash = hash([0, 0], 2);
    let first_level = hash([note_commitment, 0], 2);
    let merkle_root = hash([first_level, zero_hash], 2);

    let relayer = 0x999; // Using relayer
    let fee = 2000;      // Fee > value - INVALID

    main(
        owner_pk,
        value,
        blinding,
        [0, zero_hash],
        [false, false],
        merkle_root,
        out_nullifier,
        0x123456,
        relayer,
        fee,
    );
}
