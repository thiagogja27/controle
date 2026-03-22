// Helper to promisify IndexedDB requests
function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('my-app-db', 1);
        request.onerror = (event) => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Ensure the 'outbox' object store exists and uses 'id' as the key.
            if (!db.objectStoreNames.contains('outbox')) {
                db.createObjectStore('outbox', { keyPath: 'id' });
            }
        };
    });
}

async function syncItems() {
    const db = await openDb();
    const transaction = db.transaction(['outbox'], 'readonly');
    const store = transaction.objectStore('outbox');
    const outboxItems = await promisifyRequest(store.getAll());

    if (!outboxItems || outboxItems.length === 0) {
        console.log("Outbox is empty. Nothing to sync.");
        return;
    }

    console.log(`Syncing ${outboxItems.length} item(s) from outbox...`);

    const syncPromises = outboxItems.map(item => {
        return fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableName: item.tableName,
                data: item.data,
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Sync failed for item ${item.id}: ${err.message || response.statusText}`);
                });
            }
            console.log(`Item ${item.id} synced successfully.`);
            // On success, resolve with the ID of the item.
            return item.id;
        });
    });

    const results = await Promise.allSettled(syncPromises);

    const successfulIds = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successfulIds.push(result.value);
        } else {
            const itemId = outboxItems[index].id;
            console.error(`Failed to sync item ${itemId}. It will be retried later.`, result.reason);
        }
    });

    if (successfulIds.length === 0) {
        console.log("No items were successfully synced in this batch.");
        return;
    }
    
    console.log(`Removing ${successfulIds.length} successfully synced items from the outbox.`);
    
    const writeTransaction = db.transaction(['outbox'], 'readwrite');
    const writeStore = writeTransaction.objectStore('outbox');
    
    const deletePromises = successfulIds.map(id => promisifyRequest(writeStore.delete(id)));

    await Promise.all(deletePromises);

    console.log("Outbox cleaned of synced items.");
}

self.addEventListener('sync', function(event) {
    if (event.tag == 'sync-new-items') {
        console.log("'sync-new-items' event received!");
        event.waitUntil(syncItems());
    }
});

self.addEventListener('install', event => {
  console.log('Custom SW install');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('Custom SW activate');
  event.waitUntil(self.clients.claim());
});
