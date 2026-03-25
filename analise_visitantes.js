
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://controle-de-acesso-a5832-default-rtdb.firebaseio.com"
  });
} catch (error) {
  // Ignore "app already exists" error
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
}

const db = admin.database();
const ref = db.ref('visitantes');

ref.once('value', (snapshot) => {
  console.log(JSON.stringify(snapshot.val(), null, 2));
  process.exit(0);
}, (errorObject) => {
  console.error('The read failed: ' + errorObject.name);
  process.exit(1);
});
