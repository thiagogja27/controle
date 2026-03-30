import { openDB, DBSchema } from 'idb';

// This code runs in the browser AND the service worker.
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export interface OutboxRecord {
  id: string;
  data: any;
  tableName: string;
  action: 'create' | 'update';
  originalId?: string;
}

interface MyDB extends DBSchema {
  outbox: {
    key: string;
    value: OutboxRecord;
  };
}

let dbPromise: Promise<any> | null = null;

function getDB() {
  if (typeof indexedDB === 'undefined' && typeof self === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('my-app-db', 1, {
      upgrade(db) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function addToOutbox(record: OutboxRecord) {
  const db = await getDB();
  if (!db) return;
  await db.put('outbox', record);
  // Notify client-side code that the outbox has changed
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

export async function getOutbox(): Promise<OutboxRecord[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('outbox');
}

// This function ONLY deletes from the database. It does not dispatch events.
// The caller is responsible for notifying the UI if needed.
export async function deleteFromOutbox(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('outbox', id);
}

export async function clearOutbox() {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('outbox', 'readwrite');
  await tx.store.clear();
  await tx.done;
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}
