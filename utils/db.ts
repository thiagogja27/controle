import { openDB, DBSchema } from 'idb';

interface OutboxRecord {
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
  if (typeof window === 'undefined') return null;
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
  // Dispatch custom event to notify hooks/components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

export async function getOutbox() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('outbox');
}

export async function deleteFromOutbox(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('outbox', id);
  if (typeof window !== 'undefined') {
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
