import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminDb = getFirebaseAdmin();
    const { data, tableName, action = 'create', originalId } = await request.json();

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    if (action === 'update' && originalId) {
      const itemRef = adminDb.ref(`${tableName}/${originalId}`);
      await itemRef.update({
        ...data,
        timestamp_update: admin.database.ServerValue.TIMESTAMP,
      });
      console.log(`Documento ${originalId} atualizado no Realtime Database.`);
      return NextResponse.json({ success: true, id: originalId, originalId: originalId }); // Mantém o ID original
    } else {
      const collectionRef = adminDb.ref(tableName);
      const newDoc = await collectionRef.push({
        ...data,
        timestamp_server: admin.database.ServerValue.TIMESTAMP,
      });
      console.log("Documento criado no Realtime Database com ID: ", newDoc.key);
      return NextResponse.json({ success: true, id: newDoc.key, originalId: data.id }); // Retorna o ID original e o novo ID
    }

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
