'use client'

import { useFirebaseCollection } from "./use-firebase"
import type { OcorrenciaCompliance } from "@/lib/store"

export function useOcorrenciasCompliance() {
  return useFirebaseCollection<OcorrenciaCompliance>("compliance")
}
