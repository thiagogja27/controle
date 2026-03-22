import admin from 'firebase-admin';

let adminDb: admin.database.Database;

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set or empty.');
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Vercel's environment variable UI often replaces newlines with the literal string "\\n".
    // We need to replace them back with actual newline characters `\n` for the Firebase SDK to parse the key correctly.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail) {
    throw new Error('Incomplete Firebase Admin credentials in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://controle-diversos-default-rtdb.firebaseio.com",
  });
}

export const getFirebaseAdmin = () => {
  if (!adminDb) {
    initializeAdmin();
    adminDb = admin.database();
  }
  return adminDb;
};
