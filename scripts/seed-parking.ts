
// scripts/seed-parking.ts
const { db } = require('../lib/firebase');
const { ref, set, goOffline } = require('firebase/database');

const TOTAL_SPACES = 50;

async function seedParking() {
  console.log('Iniciando a inicialização do estacionamento...');
  
  // Definir o tipo do objeto de vagas para ser compatível com TypeScript
  const spaces: { [key: string]: any } = {};
  for (let i = 1; i <= TOTAL_SPACES; i++) {
    spaces[i] = {
      id: i,
      status: 'available',
      occupied_by_plate: null,
      visitor_id: null,
    };
  }
  
  const parkingLotSpacesRef = ref(db, 'parking_lot/spaces');
  
  try {
    await set(parkingLotSpacesRef, spaces);
    console.log(`Sucesso! ${TOTAL_SPACES} vagas de estacionamento foram criadas ou redefinidas.`);
  } catch (error) {
    console.error("Erro ao inicializar o estacionamento:", error);
  } finally {
    // Desconectar do banco de dados para permitir que o script termine
    console.log("Desconectando do banco de dados...");
    goOffline(db);
  }
}

seedParking();
