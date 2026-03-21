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

const dbPromise = openDB<MyDB>('my-app-db', 1, {
  upgrade(db) {
    db.createObjectStore('outbox', { keyPath: 'id' });
  },
});

export async function addToOutbox(record: OutboxRecord) {
  const db = await dbPromise;
  await db.put('outbox', record);
}

export async function getOutbox() {
  const db = await dbPromise;
  return db.getAll('outbox');
}

export async function deleteFromOutbox(id: string) {
  const db = await dbPromise;
  await db.delete('outbox', id);
}

export async function clearOutbox() {
  const db = await dbPromise;
  const tx = db.transaction('outbox', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
