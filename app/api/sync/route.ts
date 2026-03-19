'use server'

import { NextResponse } from 'next/server'
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const { data, tableName } = await request.json();

    if (!data || !tableName) {
      return NextResponse.json({ success: false, message: 'Dados ou nome da tabela ausentes.' }, { status: 400 });
    }

    // Em um cenário real, você pode querer validar `tableName`
    const docRef = await addDoc(collection(db, tableName), {
      ...data,
      // Adiciona um timestamp do servidor para saber quando foi realmente adicionado
      timestamp_server: serverTimestamp(), 
    });
    
    console.log("Documento sincronizado com ID: ", docRef.id);

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Erro de sincronização da API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, message: `Erro ao sincronizar: ${errorMessage}` }, { status: 500 });
  }
}
