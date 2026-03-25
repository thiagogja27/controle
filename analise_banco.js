
require('dotenv').config();
const admin = require('firebase-admin');

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

initializeAdmin();
const db = admin.database();
const ref = db.ref('visitantes');

ref.once('value', (snapshot) => {
  console.log(JSON.stringify(snapshot.val(), null, 2));
  process.exit(0);
}, (errorObject) => {
  console.error('The read failed: ' + errorObject.name);
  process.exit(1);
});
