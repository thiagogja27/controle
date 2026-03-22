import { openDB, DBSchema } from 'idb';

// This code runs in the browser AND the service worker.
// We need to dispatch an event ONLY in the browser context.
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
  // O Service Worker não tem 'window', mas tem 'self.indexedDB'
  // O Node.js (build) não tem nenhum dos dois.
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
  // Dispatch custom event to notify hooks/components (Browser only)
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

export async function getOutbox(): Promise<OutboxRecord[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('outbox');
}

export async function deleteFromOutbox(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('outbox', id);
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

export async function clearOutbox() {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('outbox', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
