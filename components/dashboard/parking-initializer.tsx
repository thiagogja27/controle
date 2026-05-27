
'use client';

import { useEffect, useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const TOTAL_SPACES = 50;

export function ParkingInitializer() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkParkingLot = async () => {
      const parkingLotRef = ref(db, 'parking_lot/spaces');
      const snapshot = await get(parkingLotRef);
      if (snapshot.exists()) {
        setIsInitialized(true);
      }
    };
    checkParkingLot();
  }, []);

  const handleInitialize = async () => {
    setIsLoading(true);
    console.log('Iniciando a inicialização do estacionamento...');

    const spaces: { [key: string]: any } = {};
    for (let i = 1; i <= TOTAL_SPACES; i++) {
      spaces[i] = {
        id: i,
        status: 'available',
        occupied_by_plate: null,
        visitor_id: null,
      };
    }

    const parkingLotRef = ref(db, 'parking_lot/spaces');

    try {
      await set(parkingLotRef, spaces);
      console.log(`Sucesso! ${TOTAL_SPACES} vagas de estacionamento foram criadas.`);
      setIsInitialized(true);
    } catch (error) {
      console.error("Erro ao inicializar o estacionamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialized) {
    return null; // Não renderiza nada se já foi inicializado
  }

  return (
    <div className="p-4 border-2 border-dashed rounded-lg text-center">
      <h3 className="text-lg font-semibold mb-2">O estacionamento parece estar vazio.</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Clique no botão abaixo para criar as 50 vagas de estacionamento iniciais.
      </p>
      <Button onClick={handleInitialize} disabled={isLoading}>
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde...</>
        ) : (
          'Inicializar Estacionamento'
        )}
      </Button>
    </div>
  );
}
