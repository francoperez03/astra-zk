use poseidon::poseidon2::Poseidon2::hash;

/// Verify merkle inclusion and assert root matches
pub fn assert_merkle_inclusion<let N: u32, let D: u32>(
    root: Field,
    path: [Field; D],
    indices: [bool; D],
    leaf: Field,
    failure_message: str<N>,
) {
    assert(path.len() == indices.len());

    let mut digest = leaf;
    for i in 0..path.len() {
        let (left, right) = if indices[i] {
            (path[i], digest) // leaf is on right
        } else {
            (digest, path[i]) // leaf is on left
        };
        digest = hash([left, right], 2);
    }

    assert(digest == root, failure_message);
}

/// Compute leaf index from direction indices
pub fn compute_leaf_index<let D: u32>(indices: [bool; D]) -> Field {
    let mut index: u32 = 0;
    for i in 0..D {
        let pos = D - 1 - i;
        index = index * 2;
        if indices[pos] {
            index = index + 1;
        }
    }
    index as Field
}

#[test]
fn test_merkle_inclusion() {
    // Simple 2-level tree test
    let leaf = hash([1, 2, 3], 3);
    let sibling = hash([4, 5, 6], 3);
    let root = hash([leaf, sibling], 2);

    assert_merkle_inclusion(
        root,
        [sibling],
        [false], // leaf on left
        leaf,
        "Should be included",
    );
}
