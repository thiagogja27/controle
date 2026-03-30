'use client'

import { useMemo, useState } from 'react'
import { Users, Utensils, Ship, FileText, ArrowRight, Clock, Shield, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter, DialogClose 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useVisitantes, useRefeicoes, useTPAs, useConsumos } from "@/hooks/use-firebase"
import { useSync } from '@/hooks/use-sync'
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, TooltipProps 
} from 'recharts'
import { type RefeicaoPolicial, type OldRefeicaoPolicial } from './refeicoes-section'
import { cn } from "@/lib/utils"
import { type Visitante } from '@/lib/store'

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
            <span className="font-bold text-muted-foreground">{payload[0].value}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, backgroundColor: payload[0].color }} className="rounded-full"/>
                    <span className="text-sm text-muted-foreground">{data.name}</span>
                    <span className="ml-auto font-bold">{data.value}</span>
                </div>
            </div>
        );
    }
    return null;
}

export function DashboardSection() {
  const { data: visitantes = [] } = useVisitantes()
  const { data: rawRefeicoes = [] } = useRefeicoes()
  const { data: tpas = [] } = useTPAs()
  const { data: consumos = [] } = useConsumos()
  const { syncOutbox, isSyncing, pendingCount } = useSync()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', data: [] as any[] });

  const openModal = (title: string, data: any[]) => {
    setModalData({ title, data });
    setIsModalOpen(true);
  };

  const refeicoes = useMemo(() => {
    return (rawRefeicoes as Array<OldRefeicaoPolicial | RefeicaoPolicial>).map(r => {
      if ('individuos' in r && Array.isArray(r.individuos)) return r as RefeicaoPolicial
      const oldRecord = r as OldRefeicaoPolicial
      return {
        ...oldRecord,
        individuos: [{
          id: oldRecord.id,
          nome: oldRecord.nome || 'N/A',
          status: oldRecord.status || "presente",
          horaSaida: oldRecord.horaSaida || "",
        }]
      } as RefeicaoPolicial
    })
  }, [rawRefeicoes])

 const allPresentIndividuals = useMemo(() => {
    const presentVisitantes = (visitantes as Visitante[])
        .filter(v => v.status === 'presente')
        .map(v => ({
            id: v.id,
            nome: v.nome,
            type: 'Visitante',
            destino: v.terminal.toUpperCase(),
            details: [
                { label: 'Empresa', value: v.empresa },
                { label: 'Documento', value: v.documento },
                { label: 'Observação', value: v.observacao },
            ]
        }));

    const presentTPAs = tpas
        .filter(t => t.status === 'presente')
        .map(t => ({
            id: t.id,
            nome: t.nome,
            type: 'TPA',
            destino: t.pier.toUpperCase(),
            details: [
                { label: 'Função', value: t.funcao },
                { label: 'Documento', value: t.documento },
                { label: 'Navio', value: t.navio },
            ]
        }));

    const presentConsumos = consumos
        .flatMap(c =>
            (c.individuos || [])
                .filter(i => i.status === 'presente')
                .map(i => ({
                    id: i.id,
                    nome: i.nome,
                    type: 'Consumo de Bordo',
                    destino: c.terminal.toUpperCase(),
                    details: [
                        { label: 'Empresa', value: c.empresa },
                        { label: 'Veículo', value: `${c.veiculo} (${c.placa})` },
                        { label: 'Produto', value: c.produto },
                    ]
                }))
        );

    const presentRefeicoes = refeicoes
        .flatMap(r => 
            (r.individuos || [])
                .filter(i => i.status === 'presente')
                .map(i => ({ 
                    id: i.id, 
                    nome: i.nome, 
                    type: 'Refeição Policial', 
                    destino: 'Refeitório', 
                    details: [
                        { label: 'Categoria', value: r.categoria },
                        { label: 'Prefixo', value: r.prefixo },
                    ]
                }))
        );

    return [...presentVisitantes, ...presentTPAs, ...presentConsumos, ...presentRefeicoes];
  }, [visitantes, tpas, consumos, refeicoes]);

  const presentesTEG = useMemo(() => allPresentIndividuals.filter(p => p.destino === 'TEG'), [allPresentIndividuals]);
  const presentesTEAG = useMemo(() => allPresentIndividuals.filter(p => p.destino === 'TEAG'), [allPresentIndividuals]);

  const totalTEG = presentesTEG.length;
  const totalTEAG = presentesTEAG.length;

  const totalVisitantesPresentes = allPresentIndividuals.filter(p => p.type === 'Visitante').length;
  const totalPoliciaisPresentes = allPresentIndividuals.filter(p => p.type === 'Refeição Policial').length;
  const totalTPAsPresentes = allPresentIndividuals.filter(p => p.type === 'TPA').length;

  const consumoPorEmpresa = useMemo(() => {
    const counts = consumos.reduce((acc, curr) => {
      acc[curr.empresa] = (acc[curr.empresa] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [consumos])

  const visitantesPorTerminal = useMemo(() => {
    const counts = (visitantes as Visitante[]).reduce((acc, curr) => {
        const terminal = curr.terminal || 'Não especificado';
        acc[terminal] = (acc[terminal] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [visitantes]);

  const recentActivity = useMemo(() => {
    const allActivities: any[] = [
      ...visitantes.map(v => ({ ...v, type: 'Visitante', date: new Date(`${v.dataEntrada}T${(v as any).horaEntrada || '00:00'}`) })),
      ...refeicoes.map(r => ({ ...r, type: 'Refeição Policial', date: new Date(`${r.data}T${r.hora}`) })),
      ...tpas.map(t => ({ ...t, type: 'TPA', date: new Date(`${t.data}T${t.hora}`) })),
      ...consumos.map(c => ({ ...c, type: 'Consumo de Bordo', date: new Date(`${c.data}T${c.hora}`) })),
    ].filter(a => a.date && !isNaN(a.date.getTime()));
    return allActivities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }, [visitantes, refeicoes, tpas, consumos]);

  return (
    <div className="space-y-4 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Painel de Controle</h2>
                <p className="text-muted-foreground">Visão geral do tráfego e operações nos terminais.</p>
            </div>
            {pendingCount > 0 && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => syncOutbox()} 
                    disabled={isSyncing}
                    className={cn("gap-2 border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400", isSyncing && "cursor-not-allowed")}
                >
                    <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                    {isSyncing ? "Sincronizando..." : `Sincronizar ${pendingCount} pendente(s)`}
                </Button>
            )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card className="cursor-pointer sm:col-span-1 md:col-span-1 lg:col-span-1 hover:bg-muted/50" onClick={() => openModal('Presentes no TEG', presentesTEG)}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Presentes no TEG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTEG}</div></CardContent></Card>
            <Card className="cursor-pointer sm:col-span-1 md:col-span-1 lg:col-span-1 hover:bg-muted/50" onClick={() => openModal('Presentes no TEAG', presentesTEAG)}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Presentes no TEAG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTEAG}</div></CardContent></Card>
            <Card className="sm:col-span-1 md:col-span-1 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Visitantes Presentes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalVisitantesPresentes}</div></CardContent></Card>
            <Card className="sm:col-span-1 md:col-span-1 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Policiais Presentes</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalPoliciaisPresentes}</div></CardContent></Card>
            <Card className="sm:col-span-2 md:col-span-1 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TPAs Presentes</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTPAsPresentes}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Consumo de Bordo por Empresa</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={consumoPorEmpresa} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                             <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/>
                            <Bar dataKey="value" fill="url(#colorUv)" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Visitantes por Terminal</CardTitle></CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={visitantesPorTerminal} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                labelLine={false}
                                label={false}
                            >
                                {visitantesPorTerminal.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}/>
                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader><CardTitle>Atividades Recentes</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <ul className="space-y-4 md:space-y-0 md:divide-y md:divide-border">
                        {recentActivity.map((activity) => (
                            <li key={activity.id} className="flex flex-col gap-2 rounded-lg p-2 hover:bg-secondary/50 md:flex-row md:items-center md:gap-4">
                               <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground`}>
                                    {activity.type === 'Visitante' && <Users className="h-5 w-5" />}
                                    {activity.type === 'Refeição Policial' && <Utensils className="h-5 w-5" />}
                                    {activity.type === 'TPA' && <FileText className="h-5 w-5" />}
                                    {activity.type === 'Consumo de Bordo' && <Ship className="h-5 w-5" />}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">
                                        {activity.type === 'Visitante' ? activity.nome :
                                        activity.type === 'Refeição Policial' ? `${(activity as any).individuos.length} policial(s)` :
                                        activity.type === 'TPA' ? activity.nome :
                                        activity.type === 'Consumo de Bordo' ? `${(activity as any).individuos.length} pessoa(s) no veículo ${(activity as any).placa}` : ''}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="font-medium text-primary">{activity.type}</span>
                                        <ArrowRight className="h-3 w-3 hidden md:inline-block" /> 
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{activity.date.toLocaleString()}</span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-md mx-auto sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{modalData.title}</DialogTitle>
                    <DialogDescription>
                        Lista de todas as pessoas presentes no terminal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="max-h-[60vh] overflow-auto">
                        <ul className="space-y-3">
                            {modalData.data.map(person => (
                                <li key={person.id} className="rounded-lg border bg-card p-3 md:p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="font-semibold text-base md:text-lg">{person.nome}</span>
                                        <span className="self-start rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:self-auto">{person.type}</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                        {person.details.map((detail: { label: string; value: string | undefined }) => (
                                            detail.value && (
                                                <div key={detail.label} className="flex flex-col">
                                                    <span className="text-muted-foreground">{detail.label}</span>
                                                    <span className="font-medium">{detail.value}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Fechar
                        </Button
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
