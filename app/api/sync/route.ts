'''
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { firestore } from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { data, tableName, action = 'create', originalId } = await request.json();

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    if (action === 'update' && originalId) {
      // Use Firestore from firebase-admin for update
      const itemRef = adminDb.collection(tableName).doc(originalId);
      await itemRef.update({
        ...data,
        timestamp_update: firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Documento ${originalId} atualizado no Firestore.`);
      return NextResponse.json({ success: true, id: originalId });
    } else {
      // Use Firestore from firebase-admin for create
      const collectionRef = adminDb.collection(tableName);
      const newDoc = await collectionRef.add({
        ...data,
        timestamp_server: firestore.FieldValue.serverTimestamp(),
      });
      console.log("Documento criado no Firestore com ID: ", newDoc.id);
      return NextResponse.json({ success: true, id: newDoc.id });
    }

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
'''