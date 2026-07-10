/**
 * cloudCrypto.ts — AES-256-GCM encryption for Cloud private apps.
 *
 * SECURITY MODEL
 * ══════════════
 * 1. A random 256-bit master key is generated once and stored in localStorage.
 *    It never leaves the browser.
 * 2. Each app is encrypted with AES-256-GCM using a fresh 12-byte IV.
 *    The IV is prepended to the ciphertext (stored as base64 in localStorage).
 * 3. Nothing is ever uploaded to a public server — all data is local.
 * 4. Cross-browser: export a .bpcloud backup file and import it elsewhere.
 */

const MASTER_KEY_STORAGE = 'bitpopart:cloud:masterKey';

// ── Master key management ─────────────────────────────────────────────────────

/**
 * Load the master CryptoKey from localStorage (stored as base64).
 * Returns null if it hasn't been generated yet.
 */
async function loadMasterCryptoKey(): Promise<CryptoKey | null> {
  const b64 = localStorage.getItem(MASTER_KEY_STORAGE);
  if (!b64) return null;
  try {
    const raw = base64ToBytes(b64);
    return await crypto.subtle.importKey(
      'raw', raw,
      { name: 'AES-GCM', length: 256 },
      false, // not extractable after import — stays in memory
      ['encrypt', 'decrypt'],
    );
  } catch { return null; }
}

/**
 * Generate and persist a new random 256-bit AES-GCM master key.
 * Returns the CryptoKey ready for use.
 */
async function generateMasterKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can export and store it
    ['encrypt', 'decrypt'],
  );
  // Export and save as base64
  const raw = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(MASTER_KEY_STORAGE, bytesToBase64(new Uint8Array(raw)));
  return key;
}

/**
 * Get (or create) the master key. Always resolves to a usable CryptoKey.
 */
export async function getMasterKey(): Promise<CryptoKey> {
  return (await loadMasterCryptoKey()) ?? (await generateMasterKey());
}

/**
 * Export the master key as a base64 string for backup/transfer purposes.
 * The admin can copy this to another browser to access the same encrypted apps.
 */
export async function exportMasterKeyB64(): Promise<string> {
  const b64 = localStorage.getItem(MASTER_KEY_STORAGE);
  if (b64) return b64;
  await generateMasterKey();
  return localStorage.getItem(MASTER_KEY_STORAGE)!;
}

/**
 * Import a base64 master key (e.g. copied from another browser).
 * Replaces the current key — all apps encrypted with the old key will no
 * longer be decryptable from this browser.
 */
export async function importMasterKeyB64(b64: string): Promise<void> {
  // Validate it's a real AES-256 key (32 bytes)
  const raw = base64ToBytes(b64);
  if (raw.byteLength !== 32) throw new Error('Invalid key length — expected 32 bytes (256 bits)');
  await crypto.subtle.importKey(
    'raw', raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  localStorage.setItem(MASTER_KEY_STORAGE, b64);
}

// ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

/**
 * Encrypt a UTF-8 string with AES-256-GCM.
 * Returns a Uint8Array of: [12-byte IV] + [ciphertext + 16-byte auth tag].
 */
export async function encryptText(plaintext: string): Promise<Uint8Array> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );
  // Prepend IV so we can extract it later
  const out = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipherBuf), iv.byteLength);
  return out;
}

/**
 * Decrypt a Uint8Array produced by `encryptText`.
 * Throws if the key is wrong or data is corrupted (GCM auth tag mismatch).
 */
export async function decryptBytes(data: Uint8Array): Promise<string> {
  const key = await getMasterKey();
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plainBuf);
}

/**
 * Encrypt plaintext → base64 string (for localStorage storage).
 */
export async function encryptToB64(plaintext: string): Promise<string> {
  const bytes = await encryptText(plaintext);
  return bytesToBase64(bytes);
}

/**
 * Decrypt a base64 string produced by encryptToB64 → plaintext.
 */
export async function decryptFromB64(b64: string): Promise<string> {
  const bytes = base64ToBytes(b64);
  return decryptBytes(bytes);
}

// ── Utility ───────────────────────────────────────────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Check whether a master key exists in localStorage (without generating one). */
export function hasMasterKey(): boolean {
  return !!localStorage.getItem(MASTER_KEY_STORAGE);
}
