
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, get, set, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';
import { db } from '@/lib/firebase';

interface ParkingSpace {
  id: number;
  status: 'available' | 'occupied';
  occupied_by_plate?: string;
  visitor_id?: string;
  visitor_name?: string;
}

// A interface foi corrigida de 'name' para 'nome' para corresponder ao banco de dados.
interface Visitor {
    nome: string;
}

export function useParking() {
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const spacesRef = ref(db, 'parking_lot/spaces');
    
    const unsubscribe = onValue(spacesRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const spacesArray = Object.values(data) as ParkingSpace[];

        const enrichedSpaces = await Promise.all(
          spacesArray.map(async (space) => {
            if (space.status === 'occupied' && space.visitor_id) {
              try {
                const visitorRef = ref(db, `visitantes/${space.visitor_id}`);
                const visitorSnapshot = await get(visitorRef);
                if (visitorSnapshot.exists()) {
                  const visitorData = visitorSnapshot.val() as Visitor;
                  // Correção: Usa 'visitorData.nome' em vez de 'visitorData.name'.
                  return { ...space, visitor_name: visitorData.nome || 'Nome não encontrado' };
                }
              } catch (error) {
                console.error("Erro ao buscar nome do visitante:", error);
                return { ...space, visitor_name: 'Erro de busca' };
              }
            }
            return space;
          })
        );
        
        setSpaces(enrichedSpaces);
      } else {
        setSpaces([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const occupySpace = useCallback(async (plate: string, visitorId: string) => {
    if (!plate) return;

    const spacesRef = ref(db, 'parking_lot/spaces');
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
        const spaceToUpdateRef = ref(db, `parking_lot/spaces/${spaceId}`);
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

    const spacesRef = ref(db, 'parking_lot/spaces');
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
        const spaceToUpdateRef = ref(db, `parking_lot/spaces/${spaceId}`);

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
