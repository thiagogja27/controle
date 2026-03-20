function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('my-app-db', 1);
        request.onerror = (event) => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = (event) => resolve(event.target.result);
    });
}

async function syncItems() {
    const db = await openDb();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readonly');
        const store = transaction.objectStore('outbox');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const outboxItems = getAllRequest.result;
            if (outboxItems.length === 0) {
                console.log("Outbox is empty. Nothing to sync.");
                return resolve();
            }

            console.log(`Syncing ${outboxItems.length} item(s) from outbox...`);

            const syncPromises = outboxItems.map(item => {
                return fetch('/api/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tableName: item.tableName,
                        data: item.data,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => Promise.reject(err));
                    }
                    return response.json();
                })
                .then(result => {
                    console.log("Successfully synced item:", result);
                });
            });

            Promise.all(syncPromises)
                .then(async () => {
                    console.log("All items synced successfully. Clearing outbox.");
                    const writeTransaction = db.transaction(['outbox'], 'readwrite');
                    const writeStore = writeTransaction.objectStore('outbox');
                    const clearRequest = writeStore.clear();
                    
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = (event) => reject("Error clearing outbox: " + event.target.errorCode);
                })
                .catch(error => {
                    console.error("Sync failed. Items will remain in outbox for next attempt.", error);
                    reject(error);
                });
        };

        getAllRequest.onerror = (event) => {
            console.error('Error getting items from outbox:', event.target.errorCode);
            reject("Error fetching from outbox");
        };
    });
}

self.addEventListener('sync', function(event) {
    if (event.tag == 'sync-new-items') {
        console.log("'sync-new-items' event received!");
        event.waitUntil(syncItems());
    }
});

// Basic install and activate steps to ensure the service worker takes control
self.addEventListener('install', event => {
  console.log('Custom SW install');
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', event => {
  console.log('Custom SW activate');
  event.waitUntil(self.clients.claim()); // Become available to all pages
});
