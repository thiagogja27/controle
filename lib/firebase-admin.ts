import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The private key is now expected to be a Base64 encoded string.
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKeyBase64) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set or empty.');
  }

  // Decode the Base64 string back to the original PEM format.
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey, // Use the decoded key
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail) {
    throw new Error('Incomplete Firebase Admin credentials in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export const getFirebaseAdmin = () => {
  if (!adminDb) {
    initializeAdmin();
    adminDb = admin.firestore();
  }
  return adminDb;
};
