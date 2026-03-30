import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { ServerValue, type DataSnapshot } from 'firebase-admin/database';

export const dynamic = 'force-dynamic';

/**
 * API endpoint para sincronização idempotente de dados offline.
 * Esta API é a única responsável por mutações no banco de dados vindas do cliente.
 */
export async function POST(request: Request) {
  try {
    const adminDb = getFirebaseAdmin();
    const item = await request.json();
    const { data, tableName, action = 'create', id: tempId, originalId: firebaseKeyForUpdate } = item;

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    // --- AÇÃO: ATUALIZAR UM REGISTRO EXISTENTE ---
    if (action === 'update' && firebaseKeyForUpdate) {
      const itemRef = adminDb.ref(`${tableName}/${firebaseKeyForUpdate}`);
      await itemRef.update({
        ...data,
        timestamp_update: ServerValue.TIMESTAMP,
      });
      console.log(`SYNC API: Documento ${firebaseKeyForUpdate} atualizado em [${tableName}].`);
      return NextResponse.json({ success: true, id: firebaseKeyForUpdate, originalId: tempId, action: 'update' });
    }
    
    // --- AÇÃO: CRIAR UM NOVO REGISTRO (com verificação de duplicidade) ---
    if (action === 'create') {
      const collectionRef = adminDb.ref(tableName);

      // 1. VERIFICAR SE O ID TEMPORÁRIO JÁ FOI PROCESSADO
      // Buscamos na coleção por um item que já tenha o nosso tempId.
      const snapshot = await collectionRef.orderByChild('id').equalTo(tempId).once('value');
      
      if (snapshot.exists()) {
        // ID já processado! Este é um reenvio.
        const existingData = snapshot.val();
        const firebaseKey = Object.keys(existingData)[0]; // Pega a chave do Firebase do registro existente

        console.log(`SYNC API: ID temporário ${tempId} já existe no DB com a chave ${firebaseKey}. Ignorando criação duplicada.`);
        // Retornamos sucesso para que o SW possa remover o item do outbox.
        return NextResponse.json({ success: true, id: firebaseKey, originalId: tempId, action: 'create', message: 'Duplicate ignored' });
      }

      // 2. SE NÃO EXISTIR, CRIAR O NOVO REGISTRO
      const newDocRef = await collectionRef.push({
        ...data, // data já contém o 'id: tempId'
        timestamp_server: ServerValue.TIMESTAMP,
      });
      
      const newKey = newDocRef.key;
      console.log(`SYNC API: Documento criado em [${tableName}] com ID Firebase: ${newKey} a partir do ID temporário ${tempId}.`);
      return NextResponse.json({ success: true, id: newKey, originalId: tempId, action: 'create' });
    }

    // --- CASO INVÁLIDO ---
    return NextResponse.json({ success: false, message: 'Ação inválida ou ID ausente para atualização.' }, { status: 400 });

  } catch (error) {
    console.error("Erro fatal na API de sincronização:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
