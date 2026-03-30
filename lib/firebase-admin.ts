import admin from 'firebase-admin';

// --- Interface para o cache global ---
interface FirebaseAdminCache {
  app?: admin.app.App;
  db?: admin.database.Database;
}

// --- Cache Global ---
// O "global as any" é uma forma de criar uma variável global em TypeScript
// que persiste entre as invocações de funções serverless no Next.js.
const globalCache: { firebaseAdmin: FirebaseAdminCache } = global as any;

/**
 * Obtém a instância do app do Firebase Admin, inicializando-a apenas se não existir.
 * Este padrão (Singleton) evita inicializações múltiplas e erros em ambientes serverless.
 * @returns {admin.app.App} A instância do app do Firebase Admin.
 */
function initializeAdminApp(): admin.app.App {
  if (globalCache.firebaseAdmin && globalCache.firebaseAdmin.app) {
    return globalCache.firebaseAdmin.app;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('A variável de ambiente FIREBASE_PRIVATE_KEY não está definida.');
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://controle-diversos-default-rtdb.firebaseio.com",
  });

  // Cacheia a instância do app
  if (!globalCache.firebaseAdmin) {
    globalCache.firebaseAdmin = {};
  }
  globalCache.firebaseAdmin.app = app;

  return app;
}

/**
 * Obtém a instância do Firebase Realtime Database.
 * Utiliza um padrão Singleton para garantir que a conexão seja reutilizada entre as invocações.
 * @returns {admin.database.Database} A instância do Realtime Database.
 */
export const getFirebaseAdmin = (): admin.database.Database => {
  if (globalCache.firebaseAdmin && globalCache.firebaseAdmin.db) {
    return globalCache.firebaseAdmin.db;
  }

  // Garante que o app está inicializado antes de pegar o DB
  initializeAdminApp();
  
  const db = admin.database();

  // Cacheia a instância do DB
  if (!globalCache.firebaseAdmin) {
    globalCache.firebaseAdmin = {};
  }
  globalCache.firebaseAdmin.db = db;
  
  return db;
};
