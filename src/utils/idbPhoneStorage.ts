// On-device Phone Storage Engine using IndexedDB for permanent local persistence
// Ensures all bills, hotels, payments, prices, and settings are saved permanently on this phone.

const DB_NAME = 'ChickenAgencyPhoneDB';
const DB_VERSION = 1;
const STORE_NAME = 'phone_store';

function openPhoneDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported on this device'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an item permanently into this phone's IndexedDB
 */
export async function saveToPhoneDB(key: string, value: any): Promise<void> {
  try {
    const db = await openPhoneDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[PhoneDB] Could not save "${key}":`, err);
  }
}

/**
 * Read an item from this phone's IndexedDB
 */
export async function getFromPhoneDB<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openPhoneDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result !== undefined ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[PhoneDB] Could not read "${key}":`, err);
    return null;
  }
}

/**
 * Request mobile browser to mark storage as persistent (prevents OS from clearing phone cache)
 */
export async function requestPhonePersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[PhoneDB] On-device persistent storage granted:', isPersisted);
      return isPersisted;
    } catch (e) {
      console.warn('[PhoneDB] Persistent storage request error:', e);
    }
  }
  return false;
}

/**
 * Check if storage is marked persistent on this phone
 */
export async function isPhoneStoragePersistent(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
