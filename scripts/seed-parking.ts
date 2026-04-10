
// scripts/seed-parking.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Caminho para a chave da conta de serviço
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

// Verifica se o arquivo da chave de serviço existe
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n\x1b[31mERRO: Arquivo de chave de serviço não encontrado!\x1b[0m');
  console.error(`Baixe o arquivo JSON da chave de serviço do seu projeto Firebase e salve-o como \x1b[32mserviceAccountKey.json\x1b[0m na raiz do projeto.`);
  console.error('Você pode gerar uma nova chave em: https://console.cloud.google.com/iam-admin/serviceaccounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// A URL do seu Realtime Database
const databaseURL = "https://controle-diversos-default-rtdb.firebaseio.com";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL
});

const db = admin.database();

async function seedDatabase() {
  console.log('Iniciando o processo de seeding do estacionamento com privilégios de administrador...');
  try {
    const parkingLotRef = db.ref('parking_lot');
    const spaces: { [key: string]: any } = {};
    const totalSpaces = 20;

    for (let i = 1; i <= totalSpaces; i++) {
      const spaceId = `space_${i}`;
      spaces[spaceId] = {
        id: i,
        status: 'available',
        occupied_by_plate: ' ',
        visitor_id: ' ',
      };
    }

    await parkingLotRef.set({ spaces });

    console.log(`\n\x1b[32mSucesso! ${totalSpaces} vagas de estacionamento foram criadas no Firebase.\x1b[0m`);
    console.log('Pode fechar este terminal agora.');

  } catch (error) {
    console.error('\n\x1b[31mErro ao popular o banco de dados:', error, '\x1b[0m');
  } finally {
    // A conexão com o admin SDK mantém o processo vivo, então forçamos a saída.
    process.exit(0);
  }
}

seedDatabase();
