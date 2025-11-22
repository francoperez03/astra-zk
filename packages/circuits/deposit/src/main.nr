use common::definitions::{account, commitment, derive_viewing_key};
use common::merkle_tree::assert_merkle_inclusion;
use poseidon::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production (~1M notes)
global DEPTH: u32 = 2;

/// Deposit circuit: Convert public tokens into a private note
///
/// Flow:
/// 1. User has X public tokens
/// 2. Generates commitment with their account, amount, blinding
/// 3. Proves the commitment was inserted correctly in the tree
///
/// Key derivation:
/// - spending_key (secret) -> viewing_key -> account
/// - Receiver shares their account (or viewing_key) to receive deposits
pub fn main(
    // Private inputs
    receiver_spending_key: Field,  // The receiver's spending key (secret)
    out_blinding: Field,           // Random blinding factor

    // Public inputs
    in_root: pub Field,          // Current tree root
    in_public_amount: pub Field, // Amount deposited (verified on-chain)
    out_commitment: pub Field,   // Created commitment
    out_root: pub Field,         // New root after insert
    out_rho: pub Field,          // Unique note identifier (for future nullifier)

    // Merkle path for insert verification
    out_subtree_path: [Field; DEPTH - 1],
    out_subtree_indices: [bool; DEPTH - 1],
) {
    // 1. Derive viewing key and account from spending key
    let receiver_viewing_key = derive_viewing_key(receiver_spending_key);
    let receiver_account = account(receiver_viewing_key);

    // 2. Verify commitment is correct
    let expected_commitment = commitment(
        receiver_account,
        in_public_amount,
        out_blinding,
    );
    assert(expected_commitment == out_commitment, "Invalid commitment");

    // 3. Verify rho is correctly derived from blinding
    // rho = hash(blinding) - unique per note for nullifier derivation
    let expected_rho = hash([out_blinding], 1);
    assert(expected_rho == out_rho, "Invalid rho");

    // 4. Verify we're inserting in an empty slot (zero subtree)
    let zero_subtree = hash([0, 0], 2);
    assert_merkle_inclusion(
        in_root,
        out_subtree_path,
        out_subtree_indices,
        zero_subtree,
        "Slot not empty in old tree",
    );

    // 5. Verify new root contains the commitment
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
    // Setup: receiver's spending key
    let receiver_spending_key = 12345;

    // Derive viewing key and account (as per new key hierarchy)
    let receiver_viewing_key = derive_viewing_key(receiver_spending_key);
    let receiver_acc = account(receiver_viewing_key);

    let amount = 1000_000_000; // 100 XLM in stroops
    let blinding = 99999;

    // Compute commitment and rho
    let out_commitment = commitment(receiver_acc, amount, blinding);
    let out_rho = hash([blinding], 1); // rho derived from blinding

    // Build simple tree depth=2
    let zero_hash = hash([0, 0], 2);
    let in_root = hash([zero_hash, zero_hash], 2);

    let new_subtree = hash([out_commitment, 0], 2);
    let out_root = hash([new_subtree, zero_hash], 2);

    main(
        receiver_spending_key,
        blinding,
        in_root,
        amount,
        out_commitment,
        out_root,
        out_rho,
        [zero_hash],
        [false],
    );
}
