
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, get, set, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';
import { db } from '@/lib/firebase'; // Correção: importa a instância 'db' corretamente

interface ParkingSpace {
  id: number;
  status: 'available' | 'occupied';
  occupied_by_plate?: string;
  visitor_id?: string;
}

export function useParking() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const spacesRef = ref(db, 'parking_lot/spaces'); // Correção: usa 'db' em vez de 'database'
    const unsubscribe = onValue(spacesRef, (snapshot) => {
      const data = snapshot.val();
      const spacesArray = data ? Object.values(data) : [];
      setSpaces(spacesArray as ParkingSpace[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const occupySpace = useCallback(async (plate: string, visitorId: string) => {
    if (!plate) return;

    const spacesRef = ref(db, 'parking_lot/spaces'); // Correção: usa 'db'
    const availableSpaceQuery = query(
      spacesRef,
      orderByChild('status'),
      equalTo('available'),
      limitToFirst(1)
    );

    try {
      const snapshot = await get(availableSpaceQuery);
      if (snapshot.exists()) {
        const spaceData = snapshot.val();
        const spaceId = Object.keys(spaceData)[0];
        const spaceToUpdateRef = ref(db, `parking_lot/spaces/${spaceId}`); // Correção: usa 'db'
        await set(spaceToUpdateRef, {
          ...spaceData[spaceId],
          status: 'occupied',
          occupied_by_plate: plate,
          visitor_id: visitorId,
        });
        console.log(`Vaga ${spaceId} ocupada pela placa ${plate}`);
      } else {
        console.log('Nenhuma vaga disponível.');
      }
    } catch (error) {
      console.error("Erro ao ocupar vaga:", error);
    }
  }, []);

  const freeSpace = useCallback(async (plate: string) => {
    if (!plate) return;

    const spacesRef = ref(db, 'parking_lot/spaces'); // Correção: usa 'db'
     const occupiedSpaceQuery = query(
      spacesRef,
      orderByChild('occupied_by_plate'),
      equalTo(plate),
      limitToFirst(1)
    );

    try {
      const snapshot = await get(occupiedSpaceQuery);
      if (snapshot.exists()) {
        const spaceData = snapshot.val();
        const spaceId = Object.keys(spaceData)[0];
        const spaceToUpdateRef = ref(db, `parking_lot/spaces/${spaceId}`); // Correção: usa 'db'

        await set(spaceToUpdateRef, {
            ...spaceData[spaceId],
            status: 'available',
            occupied_by_plate: ' ',
            visitor_id: ' ',
        });
        console.log(`Vaga ${spaceId} liberada.`);
      } else {
        console.log(`Nenhuma vaga encontrada para a placa ${plate}`);
      }
    } catch (error) {
      console.error("Erro ao liberar vaga:", error);
    }
  }, []);

  return { spaces, loading, occupySpace, freeSpace };
}
