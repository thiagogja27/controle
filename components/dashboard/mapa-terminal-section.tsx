'use client'

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useVisitantes, useTPAs, useRefeicoes, useConsumos, useNavios, useHistoricoNavios } from "@/hooks/use-firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, User, Sun, Wind, Droplets, Moon, Ship, Anchor, Calendar, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type Navio, type Individuo } from "@/lib/store";
import { toast } from "sonner"

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

const WeatherWidget = () => {
  const currentHour = new Date().getHours();
  const isDay = currentHour >= 6 && currentHour < 18;

  const weather = {
    condition: isDay ? 'Ensolarado' : 'Noite',
    temperature: isDay ? 28 : 22, // Temperatura diferente para dia/noite
    windSpeed: isDay ? 15 : 10,
    humidity: 65,
  };

  return (
    <div className="absolute top-4 right-4 z-10 w-60 rounded-xl bg-black/30 p-4 shadow-lg backdrop-blur-md border border-white/20 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Porto de Santos</p>
          <p className="text-lg font-semibold">{weather.condition}</p>
        </div>
        {isDay ? (
            <Sun className="h-12 w-12 text-yellow-300 drop-shadow-lg" />
        ) : (
            <Moon className="h-12 w-12 text-blue-200 drop-shadow-lg" />
        )}
      </div>
      <div className="mt-4">
        <p className="text-5xl font-bold tracking-tighter">{weather.temperature}°C</p>
      </div>
      <div className="mt-4 flex justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <Wind className="h-4 w-4" />
          <span>{weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-4 w-4" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};

export function MapaTerminalSection() {
  const { data: visitantes, loading: loadingVisitantes } = useVisitantes()
  const { data: tpas, loading: loadingTPAs } = useTPAs()
  const { data: refeicoes, loading: loadingRefeicoes } = useRefeicoes()
  const { data: consumos, loading: loadingConsumos } = useConsumos()
  const { data: navios, updateItem: updateNavio, loading: loadingNavios } = useNavios();
  const { addItem: addHistoricoNavio } = useHistoricoNavios();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNavio, setSelectedNavio] = useState<"teg" | "teag" | null>(null);
  const [formState, setFormState] = useState<Partial<Navio>>({});

  const handleOpenForm = (pier: "teg" | "teag") => {
    setSelectedNavio(pier);
    const navioAtual = navios.find(n => n.id === pier);
    setFormState(navioAtual || { id: pier, nome: "" });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!selectedNavio) return;
    setIsSaving(true);

    try {
        const navioData = { ...formState, pier: selectedNavio };

        if (formState.dataDesatracacao && formState.horaDesatracacao) {
            // 1. Mover para o histórico
            // @ts-ignore
            await addHistoricoNavio(navioData);

            // 2. Limpar o registro do píer atual
            const resetData: Partial<Navio> = {
                nome: "",
                dataAtracacao: "",
                horaAtracacao: "",
                dataDesatracacao: "",
                horaDesatracacao: "",
            };
            await updateNavio(selectedNavio, resetData);
            toast.success(`Navio ${formState.nome} desatracado e movido para o histórico.`);
        } else {
            // Apenas atualiza as informações do navio atual
            await updateNavio(selectedNavio, navioData);
            toast.success(`Informações do navio no píer ${selectedNavio.toUpperCase()} atualizadas.`);
        }

        setIsFormOpen(false);
        setSelectedNavio(null);
    } catch (error) {
        console.error("Erro ao salvar navio:", error);
        toast.error("Falha ao salvar as informações do navio.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const pessoasPresentes = useMemo(() => {
    const visitantesPresentes = visitantes
      .filter(v => v.status === "presente")
      .map(v => ({
        nome: v.nome,
        empresa: v.empresa,
        credencial: v.credencial,
        dataEntrada: v.dataEntrada,
        horaEntrada: (v as any).horaEntrada, // Temporary any
        type: 'Visitante',
        local: (v as any).destino, // Temporary any
      }));

    const tpasPresentes = tpas
      .filter(t => t.status === "presente")
      .map(t => {
        let local;
        if (t.funcao === "Vigia") { local = "Portaria"; }
        else if (t.funcao === "Tripper") { local = "Classificação"; }
        // @ts-ignore
        else if (t.pier === 'teg') { local = "Pier TEG"; }
        // @ts-ignore
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
        .filter((individuo: Individuo) => individuo.status === "presente")
        .map((individuo: Individuo) => ({
          nome: individuo.nome,
          // @ts-ignore
          empresa: refeicao.categoria === 'pm' ? 'Polícia Militar' : 'Polícia Civil',
          credencial: 'N/A',
          // @ts-ignore
          dataEntrada: refeicao.data,
          // @ts-ignore
          horaEntrada: refeicao.hora,
          type: 'Refeição',
          local: "Refeitório",
        }))
    );

    const consumosPresentes = consumos.flatMap(consumo =>
      (consumo.individuos || [])
        .filter((individuo: Individuo) => individuo.status === "presente")
        .map((individuo: Individuo) => ({
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

  const isLoading = loadingVisitantes || loadingTPAs || loadingRefeicoes || loadingConsumos || loadingNavios;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const navioTeg = navios.find(n => n.id === 'teg');
  const navioTeag = navios.find(n => n.id === 'teag');

  const formatDate = (date?: string, time?: string) => {
    if (!date) return "-";
    const datePart = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
    return `${datePart}${time ? ' ' + time : ''}`;
  }
  
  const imageSrc = '/terminal-ilustracao.jpg';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa do Terminal - Pessoas Presentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6 sm:grid-cols-1 lg:grid-cols-2">
            <Card className="bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-teal-800 dark:text-teal-200">Navio Atracado - Píer TEG</CardTitle>
                    <Ship className="h-5 w-5 text-teal-600 dark:text-teal-400"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">{navioTeg?.nome || "Sem navio atracado"}</div>
                    {navioTeg?.nome && (
                        <div className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                           <p><strong>Atracação:</strong> {formatDate(navioTeg.dataAtracacao, navioTeg.horaAtracacao)}</p>
                           <p><strong>Previsão Desatracação:</strong> {formatDate(navioTeg.dataDesatracacao, navioTeg.horaDesatracacao)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-sky-800 dark:text-sky-200">Navio Atracado - Píer TEAG</CardTitle>
                    <Ship className="h-5 w-5 text-sky-600 dark:text-sky-400"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-sky-900 dark:text-sky-100">{navioTeag?.nome || "Sem navio atracado"}</div>
                     {navioTeag?.nome && (
                        <div className="text-xs text-sky-700 dark:text-sky-300 mt-1">
                           <p><strong>Atracação:</strong> {formatDate(navioTeag.dataAtracacao, navioTeag.horaAtracacao)}</p>
                           <p><strong>Previsão Desatracação:</strong> {formatDate(navioTeag.dataDesatracacao, navioTeag.horaDesatracacao)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <TooltipProvider delayDuration={100}>
          <div className="relative w-full aspect-[16/9]">
            <WeatherWidget />
            <Image
              src={imageSrc}
              alt="Ilustração do Terminal"
              fill
              className="object-cover rounded-md"
              priority
            />

            {/* Navio TEG */}
            <div className="absolute" style={{ top: '55%', left: '80%' }}>
              <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={() => handleOpenForm('teg')} className="flex items-center gap-2 animate-pulse-slow">
                        <Ship className="h-12 w-12 text-white/80 drop-shadow-lg -rotate-12" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>Clique para editar informações do navio no TEG.</TooltipContent>
              </Tooltip>
              {navioTeg && navioTeg.nome && (
                <div className="absolute -bottom-20 -left-10 w-48 bg-black/40 text-white p-2 rounded-lg text-xs backdrop-blur-sm border border-white/20">
                    <p className="font-bold text-center border-b border-white/20 pb-1 mb-1 flex items-center justify-center gap-1"><Anchor className="h-3 w-3"/> {navioTeg.nome}</p>
                    <p><strong>Atracação:</strong> {formatDate(navioTeg.dataAtracacao, navioTeg.horaAtracacao)}</p>
                    <p><strong>Desatracação:</strong> {formatDate(navioTeg.dataDesatracacao, navioTeg.horaDesatracacao)}</p>
                </div>
              )}
            </div>

            {/* Navio TEAG */}
            <div className="absolute" style={{ top: '65%', left: '55%' }}>
               <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={() => handleOpenForm('teag')} className="flex items-center gap-2 animate-pulse-slow">
                        <Ship className="h-12 w-12 text-white/80 drop-shadow-lg -rotate-12" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>Clique para editar informações do navio no TEAG.</TooltipContent>
              </Tooltip>
               {navioTeag && navioTeag.nome && (
                <div className="absolute -bottom-20 -left-10 w-48 bg-black/40 text-white p-2 rounded-lg text-xs backdrop-blur-sm border border-white/20">
                    <p className="font-bold text-center border-b border-white/20 pb-1 mb-1 flex items-center justify-center gap-1"><Anchor className="h-3 w-3"/> {navioTeag.nome}</p>
                    <p><strong>Atracação:</strong> {formatDate(navioTeag.dataAtracacao, navioTeag.horaAtracacao)}</p>
                    <p><strong>Desatracação:</strong> {formatDate(navioTeag.dataDesatracacao, navioTeag.horaDesatracacao)}</p>
                </div>
              )}
            </div>

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
                            } else if ((pessoa.dataEntrada as any).seconds) { // Temp any
                                entrada = new Date((pessoa.dataEntrada as any).seconds * 1000); // Temp any
                            }
                        }

                        if (entrada && !isNaN(entrada.getTime())) {
                          const agora = new Date();
                          const diffMs = agora.getTime() - entrada.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          tempoPermanencia = `${diffHours}h ${diffMins}m`;
                        }

                        const credencialClassName = ({
                          azul: 'text-blue-500 dark:text-blue-400',
                          vermelho: 'text-red-500 dark:text-red-400',
                          verde: 'text-green-500 dark:text-green-400',
                        } as Record<string, string>)[pessoa.credencial?.toLowerCase() ?? ''] || 'text-muted-foreground';

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
        
        {/* Navio Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Informações do Navio - Píer {selectedNavio?.toUpperCase()}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nome"><Ship className="h-4 w-4 inline-block mr-2"/>Nome do Navio</Label>
                        <Input id="nome" value={formState.nome || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dataAtracacao"><Calendar className="h-4 w-4 inline-block mr-2"/>Data de Atracação</Label>
                            <Input id="dataAtracacao" type="date" value={formState.dataAtracacao || ''} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="horaAtracacao"><Clock className="h-4 w-4 inline-block mr-2"/>Hora de Atracação</Label>
                            <Input id="horaAtracacao" type="time" value={formState.horaAtracacao || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dataDesatracacao"><Calendar className="h-4 w-4 inline-block mr-2"/>Data de Desatracação</Label>
                            <Input id="dataDesatracacao" type="date" value={formState.dataDesatracacao || ''} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="horaDesatracacao"><Clock className="h-4 w-4 inline-block mr-2"/>Hora de Desatracação</Label>
                            <Input id="horaDesatracacao" type="time" value={formState.horaDesatracacao || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
