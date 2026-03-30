'use client'

import { useOcorrenciasCompliance } from './use-compliance';
import { useNotificationStore } from '@/lib/notifications/store';
import { OcorrenciaCompliance } from '@/lib/store';

interface ComplianceResult {
  hasOcorrencia: boolean;
  isCritical: boolean;
  ocorrencia: OcorrenciaCompliance | null;
}

// Debounce function to prevent excessive calls
function debounce<F extends (...args: any[]) => void>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const useComplianceCheck = () => {
  const { data: ocorrencias } = useOcorrenciasCompliance();
  const { addNotification } = useNotificationStore();

  const performCheck = (documento: string): ComplianceResult => {
    const unmaskedDoc = documento.replace(/\D/g, '');
    if (!unmaskedDoc) {
      return { hasOcorrencia: false, isCritical: false, ocorrencia: null };
    }

    const foundOcorrencia = ocorrencias.find(
      o => o.documentoIndividuo.replace(/\D/g, '') === unmaskedDoc
    );

    if (foundOcorrencia) {
      // Disparar a notificação sempre que uma ocorrência for encontrada
      addNotification({
        type: 'compliance_alert',
        title: foundOcorrencia.isCritical ? 'ALERTA CRÍTICO' : 'Alerta de Compliance',
        message: `Tentativa de registro para CPF ${documento}. Motivo: ${foundOcorrencia.motivo}`,
        relatedId: documento,
      });

      return {
        hasOcorrencia: true,
        isCritical: foundOcorrencia.isCritical,
        ocorrencia: foundOcorrencia,
      };
    }

    return { hasOcorrencia: false, isCritical: false, ocorrencia: null };
  };

  // A versão com debounce pode ser usada para verificações em tempo real (enquanto digita)
  // para não sobrecarregar o sistema com notificações.
  const debouncedCheck = debounce(performCheck, 500);

  return { checkCompliance: performCheck, debouncedCheck };
};
