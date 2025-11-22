use common::definitions::{account, commitment, nullifier, derive_viewing_key, derive_nullifier_key};
use common::merkle_tree::assert_merkle_inclusion;
use poseidon::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production
global DEPTH: u32 = 2;

/// Transfer circuit: Move value between private notes
///
/// Flow:
/// 1. Sender has note with X tokens
/// 2. Burns their note (generates nullifier using nullifier_key)
/// 3. Creates note for receiver with Y tokens
/// 4. Creates note for self with (X - Y) tokens (change)
///
/// Key hierarchy:
/// - spending_key -> viewing_key -> account
/// - spending_key -> nullifier_key (for deriving nullifiers)
pub fn main(
    // === Sender keys ===
    sender_spending_key: Field,  // Sender's spending key (secret)

    // === Input note (being spent) ===
    in_value: Field,
    in_blinding: Field,
    in_rho: Field,               // Unique note identifier from deposit
    in_merkle_path: [Field; DEPTH],
    in_merkle_indices: [bool; DEPTH],

    // === Output notes ===
    receiver_account: Field,     // Receiver's account (hash of their viewing_key)
    out_receiver_value: Field,
    out_receiver_blinding: Field,
    out_sender_value: Field,
    out_sender_blinding: Field,

    // === Merkle tree update ===
    out_subtree_path: [Field; DEPTH - 1],
    out_subtree_indices: [bool; DEPTH - 1],

    // === Public inputs ===
    in_root: pub Field,
    in_nullifier: pub Field,
    out_receiver_commitment: pub Field,
    out_sender_commitment: pub Field,
    out_receiver_rho: pub Field,  // rho for receiver's new note
    out_sender_rho: pub Field,    // rho for sender's change note
    out_root: pub Field,
) {
    // 1. Derive keys from spending key
    let sender_viewing_key = derive_viewing_key(sender_spending_key);
    let sender_nullifier_key = derive_nullifier_key(sender_spending_key);
    let sender_account = account(sender_viewing_key);

    // 2. Verify input commitment exists and belongs to sender
    let in_commitment = commitment(sender_account, in_value, in_blinding);
    assert_merkle_inclusion(
        in_root,
        in_merkle_path,
        in_merkle_indices,
        in_commitment,
        "Input not in tree",
    );

    // 3. Verify nullifier (prevents double-spend)
    // NEW: Uses nullifier_key instead of blinding for security
    let expected_nullifier = nullifier(sender_nullifier_key, in_commitment, in_rho);
    assert(expected_nullifier == in_nullifier, "Invalid nullifier");

    // 4. Verify balance conservation: input = receiver + sender change
    assert(
        in_value == out_receiver_value + out_sender_value,
        "Invalid amounts",
    );

    // 5. Verify output commitments
    assert(
        commitment(receiver_account, out_receiver_value, out_receiver_blinding)
            == out_receiver_commitment,
        "Invalid receiver commitment",
    );
    assert(
        commitment(sender_account, out_sender_value, out_sender_blinding)
            == out_sender_commitment,
        "Invalid sender commitment",
    );

    // 6. Verify rho values for new notes
    let expected_receiver_rho = hash([out_receiver_blinding], 1);
    let expected_sender_rho = hash([out_sender_blinding], 1);
    assert(expected_receiver_rho == out_receiver_rho, "Invalid receiver rho");
    assert(expected_sender_rho == out_sender_rho, "Invalid sender rho");

    // 7. Verify insert into empty slot
    let zero_subtree = hash([0, 0], 2);
    assert_merkle_inclusion(
        in_root,
        out_subtree_path,
        out_subtree_indices,
        zero_subtree,
        "Slot not empty",
    );

    // 8. Verify new root contains both outputs
    let new_subtree = hash([out_sender_commitment, out_receiver_commitment], 2);
    assert_merkle_inclusion(
        out_root,
        out_subtree_path,
        out_subtree_indices,
        new_subtree,
        "Outputs not in new tree",
    );
}

#[test]
fn test_transfer() {
    // Setup: spending keys for sender and receiver
    let sender_spending_key = 111;
    let receiver_spending_key = 222;

    // Derive keys using new hierarchy
    let sender_viewing_key = derive_viewing_key(sender_spending_key);
    let sender_nullifier_key = derive_nullifier_key(sender_spending_key);
    let sender_acc = account(sender_viewing_key);

    let receiver_viewing_key = derive_viewing_key(receiver_spending_key);
    let receiver_acc = account(receiver_viewing_key);

    // Input note: 100 tokens
    let in_value = 100;
    let in_blinding = 333;
    let in_rho = hash([in_blinding], 1); // rho from original deposit
    let in_commitment = commitment(sender_acc, in_value, in_blinding);

    // NEW: nullifier uses nullifier_key instead of blinding
    let in_nullifier = nullifier(sender_nullifier_key, in_commitment, in_rho);

    // Output: 30 to receiver, 70 change to sender
    let out_receiver_value = 30;
    let out_sender_value = 70;
    let out_receiver_blinding = 444;
    let out_sender_blinding = 555;

    // Compute output rho values
    let out_receiver_rho = hash([out_receiver_blinding], 1);
    let out_sender_rho = hash([out_sender_blinding], 1);

    let out_receiver_commitment = commitment(receiver_acc, out_receiver_value, out_receiver_blinding);
    let out_sender_commitment = commitment(sender_acc, out_sender_value, out_sender_blinding);

    // Build tree (simplified for depth=2)
    let zero_hash = hash([0, 0], 2);
    let first_level_l = hash([in_commitment, 0], 2);
    let in_root = hash([first_level_l, zero_hash], 2);

    let new_subtree = hash([out_sender_commitment, out_receiver_commitment], 2);
    let out_root = hash([first_level_l, new_subtree], 2);

    main(
        sender_spending_key,
        in_value,
        in_blinding,
        in_rho,
        [0, zero_hash],
        [false, false],
        receiver_acc,
        out_receiver_value,
        out_receiver_blinding,
        out_sender_value,
        out_sender_blinding,
        [first_level_l],
        [true],
        in_root,
        in_nullifier,
        out_receiver_commitment,
        out_sender_commitment,
        out_receiver_rho,
        out_sender_rho,
        out_root,
    );
}

#[test(should_fail_with = "Invalid amounts")]
fn test_transfer_invalid_amounts() {
    // Setup keys
    let sender_spending_key = 111;
    let receiver_spending_key = 222;

    let sender_viewing_key = derive_viewing_key(sender_spending_key);
    let sender_nullifier_key = derive_nullifier_key(sender_spending_key);
    let sender_acc = account(sender_viewing_key);

    let receiver_viewing_key = derive_viewing_key(receiver_spending_key);
    let receiver_acc = account(receiver_viewing_key);

    let in_value = 100;
    let in_blinding = 333;
    let in_rho = hash([in_blinding], 1);
    let in_commitment = commitment(sender_acc, in_value, in_blinding);
    let in_nullifier = nullifier(sender_nullifier_key, in_commitment, in_rho);

    // Try to create more than input
    let out_receiver_value = 50;
    let out_sender_value = 80; // 50 + 80 = 130 > 100 - INVALID
    let out_receiver_blinding = 444;
    let out_sender_blinding = 555;

    let out_receiver_rho = hash([out_receiver_blinding], 1);
    let out_sender_rho = hash([out_sender_blinding], 1);

    let out_receiver_commitment = commitment(receiver_acc, out_receiver_value, out_receiver_blinding);
    let out_sender_commitment = commitment(sender_acc, out_sender_value, out_sender_blinding);

    let zero_hash = hash([0, 0], 2);
    let first_level_l = hash([in_commitment, 0], 2);
    let in_root = hash([first_level_l, zero_hash], 2);
    let new_subtree = hash([out_sender_commitment, out_receiver_commitment], 2);
    let out_root = hash([first_level_l, new_subtree], 2);

    main(
        sender_spending_key,
        in_value,
        in_blinding,
        in_rho,
        [0, zero_hash],
        [false, false],
        receiver_acc,
        out_receiver_value,
        out_receiver_blinding,
        out_sender_value,
        out_sender_blinding,
        [first_level_l],
        [true],
        in_root,
        in_nullifier,
        out_receiver_commitment,
        out_sender_commitment,
        out_receiver_rho,
        out_sender_rho,
        out_root,
    );
}
