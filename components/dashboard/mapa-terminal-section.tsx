'use client'

import { useMemo } from 'react';
import Image from 'next/image';
import { useVisitantes, useTPAs, useRefeicoes, useConsumos } from "@/hooks/use-firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, User } from 'lucide-react';

const destinoCoordenadas: Record<string, { top: string; left: string; color: string }> = {
  "Portaria": { top: "25%", left: "28%", color: "#3b82f6" },
  "Recepção": { top: "21%", left: "30%", color: "#22c55e" },
  "Supervisão": { top: "23%", left: "30%", color: "#ef4444" },
  "Almoxarifado": { top: "24%", left: "25%", color: "#f97316" },
  "Classificação": { top: "39%", left: "32%", color: "#8b5cf6" },
  "Pier TEG": { top: "60%", left: "75%", color: "#eab308" },
  "Pier TEAG": { top: "71%", left: "50%", color: "#14b8a6" },
  "Segurança": { top: "30%", left: "29%", color: "#d946ef" },
  "Central de Resíduos": { top: "30%", left: "25%", color: "#6b7280" },
  "RH": { top: "34%", left: "32%", color: "#ec4899" },
  "Refeitório": { top: "24%", left: "28%", color: "#6366f1" },
  "Outros": { top: "40%", left: "50%", color: "#a855f7" },
};

export function MapaTerminalSection() {
  const { data: visitantes, loading: loadingVisitantes } = useVisitantes()
  const { data: tpas, loading: loadingTPAs } = useTPAs()
  const { data: refeicoes, loading: loadingRefeicoes } = useRefeicoes()
  const { data: consumos, loading: loadingConsumos } = useConsumos()

  const pessoasPresentes = useMemo(() => {
    const visitantesPresentes = visitantes
      .filter(v => v.status === "presente")
      .map(v => ({
        nome: v.nome,
        empresa: v.empresa,
        credencial: v.credencial,
        dataEntrada: v.dataEntrada,
        horaEntrada: v.horaEntrada,
        type: 'Visitante',
        local: v.destino,
      }));

    const tpasPresentes = tpas
      .filter(t => t.status === "presente")
      .map(t => {
        let local;
        if (t.funcao === "Vigia") { local = "Portaria"; }
        else if (t.funcao === "Tripper") { local = "Classificação"; }
        else if (t.pier === 'teg') { local = "Pier TEG"; }
        else if (t.pier === 'teag') { local = "Pier TEAG"; }
        else if (["Operador de grabe", "Operador de shiploader"].includes(t.funcao)) { local = "Pier TEG"; }
        else if (["Rechego", "Contramestre geral", "Contramestre de porão", "Contramestre do rechego"].includes(t.funcao)) { local = "Pier TEAG"; }
        else { local = "Outros"; }

        return {
          nome: t.nome,
          empresa: t.funcao,
          credencial: t.credencial,
          dataEntrada: t.data,
          horaEntrada: t.hora,
          type: 'TPA',
          local: local,
        };
      });

    const refeicoesPresentes = refeicoes.flatMap(refeicao =>
      (refeicao.individuos || [])
        .filter(individuo => individuo.status === "presente")
        .map(individuo => ({
          nome: individuo.nome,
          empresa: refeicao.categoria === 'pm' ? 'Polícia Militar' : 'Polícia Civil',
          credencial: 'N/A',
          dataEntrada: refeicao.data,
          horaEntrada: refeicao.hora,
          type: 'Refeição',
          local: "Refeitório",
        }))
    );

    const consumosPresentes = consumos.flatMap(consumo =>
      (consumo.individuos || [])
        .filter(individuo => individuo.status === "presente")
        .map(individuo => ({
          nome: individuo.nome,
          empresa: consumo.empresa,
          credencial: individuo.credencial,
          dataEntrada: consumo.data,
          horaEntrada: consumo.hora,
          type: 'Consumo de Bordo',
          local: consumo.terminal === 'teg' ? 'Pier TEG' : 'Pier TEAG',
        }))
    );

    return [...visitantesPresentes, ...tpasPresentes, ...refeicoesPresentes, ...consumosPresentes];
  }, [visitantes, tpas, refeicoes, consumos]);

  const locais = useMemo(() => {
    const agrupado: Record<string, { count: number; pessoas: any[] }> = {};

    pessoasPresentes.forEach(pessoa => {
      const key = pessoa.local || "Outros";
      const localValido = Object.keys(destinoCoordenadas).includes(key) ? key : "Outros";

      if (!agrupado[localValido]) {
        agrupado[localValido] = { count: 0, pessoas: [] };
      }
      agrupado[localValido].count++;
      agrupado[localValido].pessoas.push(pessoa);
    });

    return agrupado;
  }, [pessoasPresentes]);

  const isLoading = loadingVisitantes || loadingTPAs || loadingRefeicoes || loadingConsumos;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa do Terminal - Pessoas Presentes</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="relative w-full aspect-[16/9]">
            <Image
              src="/terminal-ilustracao.jpg"
              alt="Ilustração do Terminal"
              fill
              className="object-cover rounded-md"
              priority
            />
            {Object.entries(locais).map(([local, data]) => {
              const config = destinoCoordenadas[local];
              if (!config || data.count === 0) return null;

              return (
                <Tooltip key={local}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ top: config.top, left: config.left }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div 
                            className="absolute inline-flex h-8 w-8 animate-ping rounded-full opacity-75"
                            style={{ backgroundColor: config.color }}
                        />
                        <div 
                            className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white shadow-md"
                            style={{ backgroundColor: config.color }}
                        >
                          {data.count}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-background border shadow-lg rounded-xl p-3 max-w-xs">
                    <p className="font-bold text-lg mb-2 flex items-center text-foreground">
                        <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: config.color }}/>
                        {local}
                    </p>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {data.pessoas.map((pessoa: any, i: number) => {
                        let tempoPermanencia = 'N/A';
                        let entrada: Date | null = null;

                        if (pessoa.dataEntrada) {
                            if (typeof pessoa.dataEntrada === 'string' && pessoa.horaEntrada) {
                                entrada = new Date(`${pessoa.dataEntrada}T${pessoa.horaEntrada}`);
                            } else if (pessoa.dataEntrada.seconds) {
                                entrada = new Date(pessoa.dataEntrada.seconds * 1000);
                            }
                        }

                        if (entrada && !isNaN(entrada.getTime())) {
                          const agora = new Date();
                          const diffMs = agora.getTime() - entrada.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          tempoPermanencia = `${diffHours}h ${diffMins}m`;
                        }

                        const credencialClassName = {
                          azul: 'text-blue-500 dark:text-blue-400',
                          vermelho: 'text-red-500 dark:text-red-400',
                          verde: 'text-green-500 dark:text-green-400',
                        }[pessoa.credencial] || 'text-muted-foreground';

                        return (
                          <li key={i} className="text-sm border-b border-dashed pb-2 last:border-b-0 last:pb-0">
                            <div className="font-semibold flex items-center text-foreground">
                              <User className="h-3 w-3 mr-2 text-primary"/> {pessoa.nome}
                            </div>
                            <div className="pl-5 text-muted-foreground space-y-0.5 mt-1">
                              <p><strong>Tipo:</strong> {pessoa.type || 'N/A'}</p>
                              <p><strong>{pessoa.type === 'TPA' ? 'Função' : 'Empresa'}:</strong> {pessoa.empresa || 'N/A'}</p>
                              <p>
                                <strong>Credencial:</strong>
                                <span className={`${credencialClassName} font-semibold`}>
                                  {' '}{pessoa.credencial ? pessoa.credencial.charAt(0).toUpperCase() + pessoa.credencial.slice(1) : 'N/A'}
                                </span>
                              </p>
                              <p><strong>Permanência:</strong> {tempoPermanencia}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="font-bold text-right mt-2 text-foreground">Total: {data.count}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
        
        <div className="mt-6">
            <h3 className="font-semibold mb-3 text-lg">Legenda</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
                {Object.entries(destinoCoordenadas).map(([nome, { color }]) => (
                    <div key={nome} className="flex items-center gap-2">
                        <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-sm font-medium text-muted-foreground">{nome}</span>
                    </div>
                ))}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
