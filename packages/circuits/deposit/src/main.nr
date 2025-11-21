use common::definitions::{account, commitment};
use common::merkle_tree::assert_merkle_inclusion;
use std::hash::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production (~1M notes)
global DEPTH: u32 = 2;

/// Deposit circuit: Convert public tokens into a private note
///
/// Flow:
/// 1. User has X public tokens
/// 2. Generates commitment with their account, amount, blinding
/// 3. Proves the commitment was inserted correctly in the tree
pub fn main(
    // Private inputs
    receiver_private_key: Field,
    out_blinding: Field,

    // Public inputs
    in_root: pub Field,          // Current tree root
    in_public_amount: pub Field, // Amount deposited (verified on-chain)
    out_commitment: pub Field,   // Created commitment
    out_root: pub Field,         // New root after insert

    // Merkle path for insert verification
    out_subtree_path: [Field; DEPTH - 1],
    out_subtree_indices: [bool; DEPTH - 1],
) {
    // 1. Verify commitment is correct
    let receiver_account = account(receiver_private_key);
    let expected_commitment = commitment(
        receiver_account,
        in_public_amount,
        out_blinding,
    );
    assert(expected_commitment == out_commitment, "Invalid commitment");

    // 2. Verify we're inserting in an empty slot (zero subtree)
    let zero_subtree = hash([0, 0], 2);
    assert_merkle_inclusion(
        in_root,
        out_subtree_path,
        out_subtree_indices,
        zero_subtree,
        "Slot not empty in old tree",
    );

    // 3. Verify new root contains the commitment
    let new_subtree = hash([out_commitment, 0], 2);
    assert_merkle_inclusion(
        out_root,
        out_subtree_path,
        out_subtree_indices,
        new_subtree,
        "Commitment not in new tree",
    );
}

#[test]
fn test_deposit() {
    let receiver_private_key = 12345;
    let receiver_acc = account(receiver_private_key);
    let amount = 1000_000_000; // 100 XLM in stroops
    let blinding = 99999;

    let out_commitment = commitment(receiver_acc, amount, blinding);

    // Build simple tree depth=2
    let zero_hash = hash([0, 0], 2);
    let in_root = hash([zero_hash, zero_hash], 2);

    let new_subtree = hash([out_commitment, 0], 2);
    let out_root = hash([new_subtree, zero_hash], 2);

    main(
        receiver_private_key,
        blinding,
        in_root,
        amount,
        out_commitment,
        out_root,
        [zero_hash],
        [false],
    );
}
