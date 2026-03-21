import admin from 'firebase-admin';

// This new structure ensures that we only attempt to initialize and connect to Firebase
// when the API route is actually being used, not during the build process.

// We will store the initialized instance here to reuse it across function invocations.
let adminDb: admin.firestore.Firestore;

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  // This check is crucial. If the secrets aren't here, we can't initialize.
  // This is what was causing the build to fail.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase Admin credentials are not available in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      ...serviceAccount,
      privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

// This is the function our API route will now use.
// It initializes the app (if needed) and returns the database connection.
export const getFirebaseAdmin = () => {
  if (!adminDb) {
    initializeAdmin();
    adminDb = admin.firestore();
  }
  return adminDb;
};
