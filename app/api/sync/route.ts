import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminDb = getFirebaseAdmin();
    // O corpo da requisição é o item completo do outbox
    const item = await request.json();
    // O `id` do item no outbox é o nosso ID temporário (tempId)
    const { data, tableName, action = 'create', id: tempId, originalId: firebaseKeyForUpdate } = item;

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    if (action === 'update' && firebaseKeyForUpdate) {
      const itemRef = adminDb.ref(`${tableName}/${firebaseKeyForUpdate}`);
      await itemRef.update({
        ...data,
        timestamp_update: admin.database.ServerValue.TIMESTAMP,
      });
      console.log(`Documento ${firebaseKeyForUpdate} atualizado no Realtime Database.`);
      // Retorna o tempId do outbox como originalId para o SW poder deletá-lo
      return NextResponse.json({ success: true, id: firebaseKeyForUpdate, originalId: tempId });
    } else if (action === 'create') {
      const collectionRef = adminDb.ref(tableName);
      const newDoc = await collectionRef.push({
        ...data,
        timestamp_server: admin.database.ServerValue.TIMESTAMP,
      });
      console.log("Documento criado no Realtime Database com ID: ", newDoc.key);
      // Retorna o tempId do outbox (como originalId) e o novo ID do Firebase
      return NextResponse.json({ success: true, id: newDoc.key, originalId: tempId });
    } else {
        // Cobre casos como uma ação de 'update' sem a chave do firebase
        return NextResponse.json({ success: false, message: 'Ação inválida ou ID do documento ausente para atualização.' }, { status: 400 });
    }

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
