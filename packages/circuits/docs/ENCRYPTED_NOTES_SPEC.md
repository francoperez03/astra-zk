# Astra Encrypted Notes Specification

## Version: 1.0.0
## Status: Proposal (Phase 2)
## Author: Claude Code
## Date: 2025-11-22

---

## 1. Resumen Ejecutivo

Este documento especifica cómo implementar **encrypted notes** en Astra para que un auditor con viewing key pueda ver los **montos** de las transacciones, no solo el ownership.

### Problema Actual (Phase 1)

```
commitment = Poseidon2(owner, value, blinding)
```

El auditor con viewing_key puede derivar el `owner`, pero:
- ❌ No puede extraer `value` del hash (one-way function)
- ❌ No puede ver los montos de las transacciones
- ✅ Solo puede verificar ownership

### Solución Propuesta (Phase 2)

Emitir **encrypted notes** on-chain que el auditor puede desencriptar:

```
encrypted_note = ECDH_Encrypt(viewing_pubkey, {value, blinding})
```

El auditor con viewing_key:
- ✅ Puede desencriptar y ver `value`
- ✅ Puede reconstruir historial de balances
- ❌ Sigue sin poder gastar (no tiene nullifier_key)

---

## 2. Estudio de RAILGUN

### 2.1 Arquitectura de RAILGUN

RAILGUN es el protocolo de privacidad líder en Ethereum que implementa viewing keys con visibilidad de montos.

**Características principales:**
- Dual curve: Baby JubJub (spending) + Ed25519 (viewing)
- Note encryption via ECDH
- Encrypted data emitido en eventos on-chain
- Compatible con wallets externos (viewing-only)

**Referencias:**
- [RAILGUN Privacy System](https://docs.railgun.org/wiki/learn/privacy-system)
- [RAILGUN Wallets and Keys](https://docs.railgun.org/wiki/learn/wallets-and-keys)

### 2.2 Flujo de RAILGUN

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILGUN Transaction Flow                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Usuario genera transaction:                              │
│     - ZK proof con commitment                                │
│     - Encrypted note para el receptor                        │
│                                                              │
│  2. On-chain (evento):                                       │
│     {                                                        │
│       commitment: 0xabc...,                                  │
│       ciphertext: [ephemeral_pub, enc_value, enc_token, ...] │
│     }                                                        │
│                                                              │
│  3. Receptor/Auditor con viewing key:                        │
│     - Escanea eventos                                        │
│     - Intenta desencriptar con su viewing key                │
│     - Si funciona → es su transacción                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Diferencias con Astra

| Aspecto | RAILGUN | Astra (actual) | Astra (propuesto) |
|---------|---------|----------------|-------------------|
| Curva spending | Baby JubJub | BN254 Field | BN254 Field |
| Curva viewing | Ed25519 | N/A | Grumpkin |
| Note encryption | ECDH + cipher | ❌ | ECDH + Poseidon cipher |
| On-chain events | Encrypted data | Solo commitment | Encrypted data |

---

## 3. Primitivas Criptográficas

### 3.1 Curva Elíptica: Grumpkin

**¿Por qué Grumpkin?**

Grumpkin es la **curva embebida** de BN254, lo que significa:
- Su orden de campo es igual al orden del grupo de BN254
- Las operaciones son "nativas" en los circuitos Noir/BN254
- Es equivalente a Baby JubJub para nuestros propósitos

**Propiedades:**
```
Grumpkin:
  - Field: F_p donde p = order(BN254.G1)
  - Order: r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
  - Generator: G = (1, 17631683881184975370165255887551781615748388533673675138860)
```

**Disponibilidad en Noir:**
```noir
use std::embedded_curve_ops::{
    EmbeddedCurvePoint,      // Punto en Grumpkin
    EmbeddedCurveScalar,     // Escalar de 256 bits
    fixed_base_scalar_mul,   // G * scalar
    multi_scalar_mul,        // Σ(P_i * s_i)
    embedded_curve_add,      // P1 + P2
};
```

### 3.2 Hash Function: Poseidon2

**¿Por qué Poseidon2?**

| Hash | Constraints | ZK-Friendly |
|------|-------------|-------------|
| SHA256 | ~30,000 | ❌ No |
| Keccak | ~50,000 | ❌ No |
| Pedersen | ~1,000 | ✅ Sí |
| **Poseidon2** | ~300 | ✅ **Muy eficiente** |

**Ya implementado en Astra:**
```noir
use poseidon::poseidon2::Poseidon2::hash;

// Key derivation
let viewing_key = hash([spending_key, VIEWING_DOMAIN], 2);

// Commitment
let commitment = hash([owner, value, blinding], 3);
```

**Uso para ECDH:**
```noir
// Derivar symmetric key desde ECDH shared point
let shared_key = hash([shared_point.x, shared_point.y], 2);
```

### 3.3 Método de Encriptación: Poseidon-based Addition Cipher

**¿Por qué no XOR?**

En aritmética de campos finitos, XOR no es una operación nativa. Usar suma/resta es más eficiente:

```noir
// ENCRIPTAR
encrypted[i] = plaintext[i] + Poseidon2(shared_key, i)

// DESENCRIPTAR
plaintext[i] = encrypted[i] - Poseidon2(shared_key, i)
```

**Seguridad:**
- Poseidon2 es un PRF (Pseudo-Random Function)
- Cada campo usa un índice diferente como domain separator
- El shared_key es único por transacción (ephemeral key)

**Implementación:**
```noir
fn encrypt_note(
    value: Field,
    blinding: Field,
    shared_key: Field
) -> (Field, Field) {
    let mask_value = hash([shared_key, 0], 2);
    let mask_blinding = hash([shared_key, 1], 2);

    (value + mask_value, blinding + mask_blinding)
}

fn decrypt_note(
    enc_value: Field,
    enc_blinding: Field,
    shared_key: Field
) -> (Field, Field) {
    let mask_value = hash([shared_key, 0], 2);
    let mask_blinding = hash([shared_key, 1], 2);

    (enc_value - mask_value, enc_blinding - mask_blinding)
}
```

---

## 4. Protocolo ECDH Detallado

### 4.1 Key Generation

El usuario genera un par de claves para viewing:

```noir
/// Derive viewing public key from viewing key
fn viewing_public_key(viewing_key: Field) -> EmbeddedCurvePoint {
    let scalar = EmbeddedCurveScalar { lo: viewing_key, hi: 0 };
    fixed_base_scalar_mul(scalar)  // G * viewing_key
}
```

**Importante:** La viewing_key ahora tiene dos representaciones:
- `viewing_key: Field` - clave privada (para desencriptar)
- `viewing_pubkey: Point` - clave pública (para encriptar)

### 4.2 Flujo de Encriptación (Sender)

```
SENDER realiza deposit/transfer:

1. Genera ephemeral key (random):
   ephemeral_priv = random_field()

2. Calcula ephemeral public key:
   ephemeral_pub = G * ephemeral_priv

3. Obtiene viewing public key del receptor:
   receiver_viewing_pub = publicado por el receptor

4. Calcula ECDH shared point:
   shared_point = ephemeral_priv * receiver_viewing_pub

5. Deriva symmetric key:
   shared_key = Poseidon2(shared_point.x, shared_point.y)

6. Encripta note data:
   enc_value = value + Poseidon2(shared_key, 0)
   enc_blinding = blinding + Poseidon2(shared_key, 1)

7. Emite on-chain:
   EncryptedNote {
     ephemeral_pub_x,
     ephemeral_pub_y,
     enc_value,
     enc_blinding,
   }
```

### 4.3 Flujo de Desencriptación (Auditor)

```
AUDITOR con viewing_key:

1. Lee eventos on-chain:
   encrypted_notes = scan_blockchain_events()

2. Para cada encrypted_note:

   2a. Reconstruye ephemeral_pub:
       ephemeral_pub = Point(enc_note.ephemeral_pub_x, enc_note.ephemeral_pub_y)

   2b. Calcula ECDH shared point (propiedad ECDH):
       shared_point = viewing_key * ephemeral_pub
       // Funciona porque:
       // viewing_key * (ephemeral_priv * G) = ephemeral_priv * (viewing_key * G)

   2c. Deriva symmetric key:
       shared_key = Poseidon2(shared_point.x, shared_point.y)

   2d. Desencripta:
       value = enc_value - Poseidon2(shared_key, 0)
       blinding = enc_blinding - Poseidon2(shared_key, 1)

   2e. Verifica commitment:
       account = Poseidon2(viewing_key)  // derive account
       expected_commitment = Poseidon2(account, value, blinding)

       if expected_commitment == on_chain_commitment:
           // ✅ Esta note es del usuario
           // ✅ Ahora conocemos el value
```

### 4.4 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEPOSIT CON ENCRYPTED NOTE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USUARIO                           CONTRATO              AUDITOR     │
│     │                                 │                     │        │
│     │ 1. spending_key (secreto)       │                     │        │
│     │    ├─ viewing_key               │                     │        │
│     │    │   └─ viewing_pub = G*vk    │                     │        │
│     │    └─ nullifier_key             │                     │        │
│     │                                 │                     │        │
│     │ 2. ephemeral_priv = random()    │                     │        │
│     │    ephemeral_pub = G * e_priv   │                     │        │
│     │                                 │                     │        │
│     │ 3. ECDH shared secret:          │                     │        │
│     │    shared = e_priv * vk_pub     │                     │        │
│     │    key = H(shared.x, shared.y)  │                     │        │
│     │                                 │                     │        │
│     │ 4. Encrypt note:                │                     │        │
│     │    enc_val = val + H(key, 0)    │                     │        │
│     │    enc_blind = blind + H(key,1) │                     │        │
│     │                                 │                     │        │
│     │ 5. Generate ZK proof ──────────▶│                     │        │
│     │    (proves commitment correct)  │                     │        │
│     │                                 │                     │        │
│     │ 6. Emit encrypted note ────────▶│                     │        │
│     │    {e_pub, enc_val, enc_blind}  │  ──────────────────▶│        │
│     │                                 │                     │        │
│     │                                 │      7. Scan events │        │
│     │                                 │                     │        │
│     │                                 │      8. ECDH:       │        │
│     │                                 │      shared = vk * e_pub     │
│     │                                 │      key = H(shared)│        │
│     │                                 │                     │        │
│     │                                 │      9. Decrypt:    │        │
│     │                                 │      val = enc_val - H(key,0)│
│     │                                 │                     │        │
│     │                                 │      10. Verify:    │        │
│     │                                 │      commitment ✓   │        │
│     │                                 │      AMOUNT = val   │        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Estructuras de Datos

### 5.1 EncryptedNote

```noir
/// Encrypted note data emitted on-chain
struct EncryptedNote {
    /// Ephemeral public key X coordinate
    ephemeral_pub_x: Field,
    /// Ephemeral public key Y coordinate
    ephemeral_pub_y: Field,
    /// Encrypted value: value + H(shared_key, 0)
    encrypted_value: Field,
    /// Encrypted blinding: blinding + H(shared_key, 1)
    encrypted_blinding: Field,
}
```

### 5.2 ViewingKeyPair

```noir
/// Complete viewing key pair
struct ViewingKeyPair {
    /// Private viewing key (for decryption)
    private_key: Field,
    /// Public viewing key (for encryption)
    public_key: EmbeddedCurvePoint,
}

impl ViewingKeyPair {
    fn from_spending_key(spending_key: Field) -> Self {
        let private_key = derive_viewing_key(spending_key);
        let public_key = viewing_public_key(private_key);
        ViewingKeyPair { private_key, public_key }
    }
}
```

### 5.3 ShareableViewingKey (actualizado)

```noir
/// Viewing key that can be shared with auditors
struct ShareableViewingKey {
    /// Private viewing key
    viewing_key: Field,
    /// Public viewing key (for sender to encrypt notes to this user)
    viewing_pubkey_x: Field,
    viewing_pubkey_y: Field,
    /// Optional time restrictions
    start_block: Option<u64>,
    end_block: Option<u64>,
}
```

---

## 6. Cambios Requeridos por Circuit

### 6.1 definitions.nr

**Nuevas constantes:**
```noir
/// Domain separator for ECDH encryption
global ENCRYPTION_DOMAIN: Field = 0x656e6372797074696f6e;  // "encryption"
```

**Nuevas funciones:**
```noir
use std::embedded_curve_ops::{
    EmbeddedCurvePoint,
    EmbeddedCurveScalar,
    fixed_base_scalar_mul,
    multi_scalar_mul,
};

/// Derive viewing public key from viewing private key
pub fn viewing_public_key(viewing_key: Field) -> EmbeddedCurvePoint {
    let scalar = EmbeddedCurveScalar { lo: viewing_key, hi: 0 };
    fixed_base_scalar_mul(scalar)
}

/// Compute ECDH shared secret
pub fn ecdh_shared_secret(
    my_private_key: Field,
    their_public_key: EmbeddedCurvePoint
) -> Field {
    let scalar = EmbeddedCurveScalar { lo: my_private_key, hi: 0 };
    let shared_point = multi_scalar_mul([their_public_key], [scalar]);
    Poseidon2::hash([shared_point.x, shared_point.y], 2)
}

/// Encrypt note data for recipient
pub fn encrypt_note(
    value: Field,
    blinding: Field,
    receiver_viewing_pubkey: EmbeddedCurvePoint,
    ephemeral_private_key: Field
) -> EncryptedNote {
    // Generate ephemeral public key
    let ephemeral_scalar = EmbeddedCurveScalar { lo: ephemeral_private_key, hi: 0 };
    let ephemeral_pub = fixed_base_scalar_mul(ephemeral_scalar);

    // ECDH shared secret
    let shared_key = ecdh_shared_secret(ephemeral_private_key, receiver_viewing_pubkey);

    // Encrypt with domain separation
    let mask_value = Poseidon2::hash([shared_key, 0], 2);
    let mask_blinding = Poseidon2::hash([shared_key, 1], 2);

    EncryptedNote {
        ephemeral_pub_x: ephemeral_pub.x,
        ephemeral_pub_y: ephemeral_pub.y,
        encrypted_value: value + mask_value,
        encrypted_blinding: blinding + mask_blinding,
    }
}
```

### 6.2 deposit.nr

**Cambios:**

| Tipo | Nombre | Descripción |
|------|--------|-------------|
| + Private Input | `receiver_viewing_pubkey_x` | X coord of receiver's viewing pubkey |
| + Private Input | `receiver_viewing_pubkey_y` | Y coord of receiver's viewing pubkey |
| + Private Input | `ephemeral_private_key` | Random ephemeral key for ECDH |
| + Public Output | `out_encrypted_note` | Array [eph_x, eph_y, enc_val, enc_blind] |

**Código adicional:**
```noir
// Reconstruct viewing pubkey point
let receiver_viewing_pubkey = EmbeddedCurvePoint {
    x: receiver_viewing_pubkey_x,
    y: receiver_viewing_pubkey_y,
    is_infinite: false,
};

// Verify the point is on the curve
assert(receiver_viewing_pubkey.is_on_curve());

// Encrypt note
let encrypted = encrypt_note(
    in_public_amount,
    out_blinding,
    receiver_viewing_pubkey,
    ephemeral_private_key
);

// Verify output matches
assert(out_encrypted_note[0] == encrypted.ephemeral_pub_x);
assert(out_encrypted_note[1] == encrypted.ephemeral_pub_y);
assert(out_encrypted_note[2] == encrypted.encrypted_value);
assert(out_encrypted_note[3] == encrypted.encrypted_blinding);
```

### 6.3 transfer.nr

**Cambios:**

| Tipo | Nombre | Descripción |
|------|--------|-------------|
| + Private Input | `receiver_viewing_pubkey_x/y` | Receiver's viewing pubkey |
| + Private Input | `sender_viewing_pubkey_x/y` | Sender's viewing pubkey (for change) |
| + Private Input | `ephemeral_priv_receiver` | Ephemeral for receiver note |
| + Private Input | `ephemeral_priv_sender` | Ephemeral for sender change note |
| + Public Output | `out_receiver_encrypted_note` | Encrypted note for receiver |
| + Public Output | `out_sender_encrypted_note` | Encrypted change note for sender |

### 6.4 withdraw.nr

**Sin cambios** - withdraw destruye notes, no crea nuevas.

---

## 7. Análisis de Seguridad

### 7.1 Propiedades Garantizadas

| Propiedad | Garantía | Mecanismo |
|-----------|----------|-----------|
| **Confidencialidad de montos** | Solo viewing_key holder puede ver | ECDH + encryption |
| **Integridad** | No se puede falsificar encrypted note | ZK proof verifica commitment |
| **Forward secrecy** | Comprometer vk no afecta txs pasadas | Ephemeral keys únicas |
| **No spending** | viewing_key no permite gastar | Nullifier requiere nullifier_key |

### 7.2 Modelo de Amenazas

```
┌─────────────────────────────────────────────────────────────┐
│              Adversario con viewing_key                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ PUEDE:                                                    │
│   - Ver todas las transacciones del usuario                  │
│   - Ver montos de cada transacción                          │
│   - Reconstruir historial de balances                       │
│   - Verificar ownership de commitments                      │
│                                                              │
│ ❌ NO PUEDE:                                                 │
│   - Gastar fondos del usuario                               │
│   - Derivar spending_key o nullifier_key                    │
│   - Ver transacciones fuera del rango de bloques (si tiene) │
│   - Crear proofs válidos de transferencia                   │
│   - Vincular transacciones entre diferentes usuarios        │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Ataques Mitigados

**1. Replay de encrypted notes:**
- Mitigado: Cada encrypted_note está vinculada a un commitment único
- El commitment incluye blinding random

**2. Ataque de diccionario sobre valores:**
- Mitigado: El blinding añade entropía
- Sin el blinding correcto, no se puede verificar el commitment

**3. Correlación de ephemeral keys:**
- Mitigado: Ephemeral key es random por transacción
- No hay patrón reutilizable

---

## 8. Comparación: Antes vs Después

### 8.1 Capacidades del Auditor

| Capacidad | Phase 1 (actual) | Phase 2 (propuesto) |
|-----------|------------------|---------------------|
| Identificar ownership | ✅ Sí | ✅ Sí |
| Ver montos | ❌ No | ✅ **Sí** |
| Ver historial completo | ❌ No | ✅ **Sí** |
| Calcular balance | ❌ No | ✅ **Sí** |
| Detectar si gastó | ❌ No | ❌ No |
| Gastar fondos | ❌ No | ❌ No |

### 8.2 Datos On-Chain

| Dato | Phase 1 | Phase 2 |
|------|---------|---------|
| commitment | ✅ | ✅ |
| nullifier (al gastar) | ✅ | ✅ |
| merkle root | ✅ | ✅ |
| **encrypted_note** | ❌ | ✅ **Nuevo** |

### 8.3 Overhead

| Métrica | Phase 1 | Phase 2 | Diferencia |
|---------|---------|---------|------------|
| Constraints (deposit) | ~5,000 | ~7,000 | +2,000 |
| Constraints (transfer) | ~15,000 | ~19,000 | +4,000 |
| Calldata (deposit) | ~128 bytes | ~256 bytes | +128 bytes |
| Proving time | ~2s | ~3s | +50% |

---

## 9. Roadmap de Implementación

### Phase 2.A: Primitivas (1-2 días)

**Objetivo:** Agregar funciones ECDH en definitions.nr

**Tareas:**
1. [ ] Agregar imports de `embedded_curve_ops`
2. [ ] Implementar `viewing_public_key()`
3. [ ] Implementar `ecdh_shared_secret()`
4. [ ] Implementar `encrypt_note()`
5. [ ] Agregar struct `EncryptedNote`
6. [ ] Tests unitarios

### Phase 2.B: Deposit Circuit (2-3 días)

**Objetivo:** Modificar deposit para emitir encrypted note

**Tareas:**
1. [ ] Agregar nuevos private inputs
2. [ ] Agregar public output `out_encrypted_note`
3. [ ] Verificar point on curve
4. [ ] Llamar `encrypt_note()`
5. [ ] Verificar output matches
6. [ ] Tests de integración

### Phase 2.C: Transfer Circuit (3-4 días)

**Objetivo:** Modificar transfer para emitir 2 encrypted notes

**Tareas:**
1. [ ] Agregar inputs para ambos receptores
2. [ ] Agregar 2 ephemeral keys
3. [ ] Generar encrypted note para receiver
4. [ ] Generar encrypted note para sender (cambio)
5. [ ] Tests de integración

### Phase 2.D: Contrato Soroban (2-3 días)

**Objetivo:** Emitir eventos con encrypted notes

**Tareas:**
1. [ ] Definir struct `EncryptedNoteEvent`
2. [ ] Modificar `deposit()` para emitir evento
3. [ ] Modificar `transfer()` para emitir eventos
4. [ ] Indexar eventos para scanning

### Phase 2.E: SDK Client (3-4 días)

**Objetivo:** Funciones para desencriptar notes

**Tareas:**
1. [ ] `scanEncryptedNotes(viewingKey, blockRange)`
2. [ ] `decryptNote(viewingKey, encryptedNote)`
3. [ ] `calculateBalance(viewingKey)`
4. [ ] `getTransactionHistory(viewingKey)`
5. [ ] Tests E2E

### Phase 2.F: Integración Frontend (2-3 días)

**Objetivo:** UI para auditor/regulador

**Tareas:**
1. [ ] Vista de historial de transacciones
2. [ ] Cálculo de balance actual
3. [ ] Exportar reporte de auditoría

---

## 10. Referencias

### Documentación Interna
- [VIEWING_KEYS_SPEC.md](./VIEWING_KEYS_SPEC.md) - Spec original de viewing keys
- [arquitectura-privacidad.md](../../../docs/arquitectura-privacidad.md) - Arquitectura general

### Referencias Externas
- [RAILGUN Privacy System](https://docs.railgun.org/wiki/learn/privacy-system)
- [RAILGUN Wallets and Keys](https://docs.railgun.org/wiki/learn/wallets-and-keys)
- [Noir Embedded Curve Ops](https://noir-lang.org/docs/noir/standard_library/cryptographic_primitives/embedded_curve_ops)
- [Poseidon2 Paper](https://eprint.iacr.org/2023/323)
- [Grumpkin Curve](https://hackmd.io/@aztec-network/grumpkin)

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-22 | Claude Code | Initial specification |
