/**
 * cloudIDB.ts — IndexedDB storage for Cloud private-app blobs.
 *
 * WHY IndexedDB?
 * localStorage is capped at ~5 MB per origin. IndexedDB has a quota of
 * hundreds of MB (typically 60 % of free disk space), which is plenty for
 * storing many large encrypted HTML apps.
 *
 * WHAT LIVES HERE vs localStorage
 * ─────────────────────────────────────────────────────────────────────────
 * localStorage  → tiny metadata (app list, session, users, master key)
 * IndexedDB     → large binary blobs (encrypted ciphertext, plaintext cache)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The DB has two object stores:
 *   "enc"   — AES-256-GCM base64 ciphertext, keyed by appId
 *   "cache" — decrypted plaintext HTML, keyed by appId (load-speed opt.)
 */

const DB_NAME    = 'bitpopart-cloud';
const DB_VERSION = 1;
const STORE_ENC   = 'enc';
const STORE_CACHE = 'cache';

// ── Open / init ───────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ENC))   db.createObjectStore(STORE_ENC);
      if (!db.objectStoreNames.contains(STORE_CACHE)) db.createObjectStore(STORE_CACHE);
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function idbGet(store: string, key: string): Promise<string | null> {
  return openDB().then(db =>
    new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror   = () => reject(req.error);
    }),
  );
}

function idbSet(store: string, key: string, value: string): Promise<boolean> {
  return openDB().then(db =>
    new Promise((resolve) => {
      try {
        const tx  = db.transaction(store, 'readwrite');
        const req = tx.objectStore(store).put(value, key);
        req.onsuccess = () => resolve(true);
        req.onerror   = () => resolve(false); // quota or other error → false
      } catch {
        resolve(false);
      }
    }),
  );
}

function idbDelete(store: string, key: string): Promise<void> {
  return openDB().then(db =>
    new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    }),
  );
}

function idbGetAllKeys(store: string): Promise<string[]> {
  return openDB().then(db =>
    new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror   = () => reject(req.error);
    }),
  );
}

// ── Encrypted blob (large, lives in "enc" store) ──────────────────────────────

/** Save AES-256-GCM base64 ciphertext. Returns false on quota exceeded. */
export function saveEncryptedAppData(appId: string, b64: string): Promise<boolean> {
  return idbSet(STORE_ENC, appId, b64);
}

/** Load base64 ciphertext. Returns null if not found. */
export function loadEncryptedAppData(appId: string): Promise<string | null> {
  return idbGet(STORE_ENC, appId);
}

/** Returns true synchronously if we can confirm data exists via a cached flag. */
export function loadEncryptedAppDataSync(appId: string): boolean {
  // We can't do IDB synchronously; use a localStorage flag set after each save.
  return localStorage.getItem(`bitpopart:cloud:enc-flag:${appId}`) === '1';
}

/** Remove encrypted data (called on app delete). */
export async function deleteEncryptedAppData(appId: string): Promise<void> {
  await idbDelete(STORE_ENC, appId);
  localStorage.removeItem(`bitpopart:cloud:enc-flag:${appId}`);
}

// ── Plaintext HTML cache (large, lives in "cache" store) ──────────────────────

/** Cache plaintext for instant load. Returns false on quota exceeded (non-fatal). */
export function cacheCloudAppHtml(appId: string, html: string): Promise<boolean> {
  return idbSet(STORE_CACHE, appId, html);
}

export function loadCachedCloudAppHtml(appId: string): Promise<string | null> {
  return idbGet(STORE_CACHE, appId);
}

export async function deleteCachedCloudAppHtml(appId: string): Promise<void> {
  await idbDelete(STORE_CACHE, appId);
}

/** Delete all plaintext caches (called before saving to free IDB space). */
export async function clearAllCloudAppCaches(): Promise<number> {
  const keys = await idbGetAllKeys(STORE_CACHE);
  await Promise.all(keys.map(k => idbDelete(STORE_CACHE, k)));
  return keys.length;
}

// ── Approximate IDB usage ─────────────────────────────────────────────────────

export async function getCloudIDBUsageBytes(): Promise<{ enc: number; cache: number }> {
  const db = await openDB();

  async function storeSize(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => {
        const total = (req.result as string[]).reduce((sum, v) => sum + v.length * 2, 0);
        resolve(total);
      };
      req.onerror = () => reject(req.error);
    });
  }

  const [enc, cache] = await Promise.all([storeSize(STORE_ENC), storeSize(STORE_CACHE)]);
  return { enc, cache };
}

// ── One-time migration from localStorage ──────────────────────────────────────

const MIGRATION_FLAG = 'bitpopart:cloud:idb-migrated-v1';

/**
 * Migrate existing encrypted blobs and plaintext caches from localStorage
 * into IndexedDB. Runs once; subsequent calls are no-ops.
 */
export async function migrateCloudDataToIDB(appIds: string[]): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  for (const id of appIds) {
    // Migrate encrypted blob
    const enc = localStorage.getItem(`bitpopart:cloud:enc:${id}`);
    if (enc) {
      await idbSet(STORE_ENC, id, enc);
      localStorage.setItem(`bitpopart:cloud:enc-flag:${id}`, '1');
      localStorage.removeItem(`bitpopart:cloud:enc:${id}`);
    }

    // Migrate plaintext cache
    const html = localStorage.getItem(`bitpopart:cloud:html:${id}`);
    if (html) {
      await idbSet(STORE_CACHE, id, html);
      localStorage.removeItem(`bitpopart:cloud:html:${id}`);
    }
  }

  localStorage.setItem(MIGRATION_FLAG, '1');
}
