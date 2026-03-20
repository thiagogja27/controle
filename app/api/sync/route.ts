import { NextResponse } from 'next/server'
import { ref, push, set, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const { data, tableName } = await request.json();

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    const collectionRef = ref(db, tableName);
    const newRef = push(collectionRef);
    
    await set(newRef, {
      ...data,
      timestamp_server: serverTimestamp(),
    });
    
    console.log("Documento sincronizado no Realtime Database com ID: ", newRef.key);

    return NextResponse.json({ success: true, id: newRef.key });

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
