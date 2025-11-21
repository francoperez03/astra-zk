use common::definitions::{account, commitment, nullifier};
use common::merkle_tree::assert_merkle_inclusion;
use std::hash::poseidon2::Poseidon2::hash;

// TODO: update to 20 for production
global DEPTH: u32 = 2;

/// Transfer circuit: Move value between private notes
///
/// Flow:
/// 1. Sender has note with X tokens
/// 2. Burns their note (generates nullifier)
/// 3. Creates note for receiver with Y tokens
/// 4. Creates note for self with (X - Y) tokens (change)
pub fn main(
    // === Sender account ===
    sender_private_key: Field,

    // === Input note (being spent) ===
    in_value: Field,
    in_blinding: Field,
    in_merkle_path: [Field; DEPTH],
    in_merkle_indices: [bool; DEPTH],

    // === Output notes ===
    receiver_account: Field, // hash(receiver_private_key) - shared by receiver
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
    out_root: pub Field,
) {
    let sender_account = account(sender_private_key);

    // 1. Verify input commitment exists and belongs to sender
    let in_commitment = commitment(sender_account, in_value, in_blinding);
    assert_merkle_inclusion(
        in_root,
        in_merkle_path,
        in_merkle_indices,
        in_commitment,
        "Input not in tree",
    );

    // 2. Verify nullifier (prevents double-spend)
    let expected_nullifier = nullifier(in_commitment, in_blinding);
    assert(expected_nullifier == in_nullifier, "Invalid nullifier");

    // 3. Verify balance conservation: input = receiver + sender change
    assert(
        in_value == out_receiver_value + out_sender_value,
        "Invalid amounts",
    );

    // 4. Verify output commitments
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

    // 5. Verify insert into empty slot
    let zero_subtree = hash([0, 0], 2);
    assert_merkle_inclusion(
        in_root,
        out_subtree_path,
        out_subtree_indices,
        zero_subtree,
        "Slot not empty",
    );

    // 6. Verify new root contains both outputs
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
    let sender_pk = 111;
    let receiver_pk = 222;
    let sender_acc = account(sender_pk);
    let receiver_acc = account(receiver_pk);

    // Input note: 100 tokens
    let in_value = 100;
    let in_blinding = 333;
    let in_commitment = commitment(sender_acc, in_value, in_blinding);
    let in_nullifier = nullifier(in_commitment, in_blinding);

    // Output: 30 to receiver, 70 change to sender
    let out_receiver_value = 30;
    let out_sender_value = 70;
    let out_receiver_blinding = 444;
    let out_sender_blinding = 555;

    let out_receiver_commitment = commitment(receiver_acc, out_receiver_value, out_receiver_blinding);
    let out_sender_commitment = commitment(sender_acc, out_sender_value, out_sender_blinding);

    // Build tree (simplified for depth=2)
    let zero_hash = hash([0, 0], 2);
    let first_level_l = hash([in_commitment, 0], 2);
    let in_root = hash([first_level_l, zero_hash], 2);

    let new_subtree = hash([out_sender_commitment, out_receiver_commitment], 2);
    let out_root = hash([first_level_l, new_subtree], 2);

    main(
        sender_pk,
        in_value,
        in_blinding,
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
        out_root,
    );
}

#[test(should_fail_with = "Invalid amounts")]
fn test_transfer_invalid_amounts() {
    let sender_pk = 111;
    let sender_acc = account(sender_pk);
    let receiver_acc = account(222);

    let in_value = 100;
    let in_blinding = 333;
    let in_commitment = commitment(sender_acc, in_value, in_blinding);
    let in_nullifier = nullifier(in_commitment, in_blinding);

    // Try to create more than input
    let out_receiver_value = 50;
    let out_sender_value = 80; // 50 + 80 = 130 > 100 - INVALID

    let out_receiver_commitment = commitment(receiver_acc, out_receiver_value, 444);
    let out_sender_commitment = commitment(sender_acc, out_sender_value, 555);

    let zero_hash = hash([0, 0], 2);
    let first_level_l = hash([in_commitment, 0], 2);
    let in_root = hash([first_level_l, zero_hash], 2);
    let new_subtree = hash([out_sender_commitment, out_receiver_commitment], 2);
    let out_root = hash([first_level_l, new_subtree], 2);

    main(
        sender_pk,
        in_value,
        in_blinding,
        [0, zero_hash],
        [false, false],
        receiver_acc,
        out_receiver_value,
        444,
        out_sender_value,
        555,
        [first_level_l],
        [true],
        in_root,
        in_nullifier,
        out_receiver_commitment,
        out_sender_commitment,
        out_root,
    );
}
