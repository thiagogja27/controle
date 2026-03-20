import { NextResponse } from 'next/server'
import { ref, push, set, update, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { data, tableName, action = 'create', originalId } = await request.json();

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    if (action === 'update' && originalId) {
      const itemRef = ref(db, `${tableName}/${originalId}`);
      await update(itemRef, {
        ...data,
        timestamp_update: serverTimestamp(),
      });
      console.log(`Documento ${originalId} atualizado no Realtime Database.`);
      return NextResponse.json({ success: true, id: originalId });
    } else {
      const collectionRef = ref(db, tableName);
      const newRef = push(collectionRef);
      
      await set(newRef, {
        ...data,
        timestamp_server: serverTimestamp(),
      });
      
      console.log("Documento criado no Realtime Database com ID: ", newRef.key);
      return NextResponse.json({ success: true, id: newRef.key });
    }

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
