'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Users, Utensils, Ship, FileText, AlertTriangle, BarChart2, List, Building2, Clock, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter, DialogClose 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useVisitantes, useRefeicoes, useTPAs, useConsumos } from "@/hooks/use-firebase"
import { 
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useSettingsStore } from "@/lib/settings-store"

// --- Helper Functions & Hooks ---
const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

const calculateDurationInHours = (isoDateTime: string): number => {
    if (!isoDateTime) return 0;
    const entryDateTime = new Date(isoDateTime);
    const now = new Date();
    const diff = now.getTime() - entryDateTime.getTime();
    return diff / (1000 * 60 * 60);
};

const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
};

const usePrevious = <T extends unknown>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
};


// --- Tooltip Components ---
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

// --- Main Component ---
export function PainelSection() {
    // --- Data & State Hooks ---
    const { data: visitantes = [], loading: loadingVisitantes } = useVisitantes()
    const { data: rawConsumos = [], loading: loadingConsumos } = useConsumos()
    const { data: rawRefeicoes = [], loading: loadingRefeicoes } = useRefeicoes()
    const { data: tpas = [], loading: loadingTpas } = useTPAs()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExceededStayModalOpen, setIsExceededStayModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', data: [] as any[] });
    const { toast } = useToast();
    
    // --- Settings Store ---
    const { 
        maxPermanenceHours, voiceAlerts, voiceAlertsRefeicoes, 
        voiceAlertsTPAs, voiceAlertsConsumo 
    } = useSettingsStore()

    // --- Previous State Refs ---
    const prevVisitantes = usePrevious(visitantes) ?? [];
    const prevRefeicoes = usePrevious(rawRefeicoes) ?? [];
    const prevTpas = usePrevious(tpas) ?? [];
    const prevConsumos = usePrevious(rawConsumos) ?? [];

    // --- Voice Alert Effects ---
    useEffect(() => {
        if (!loadingVisitantes && voiceAlerts && visitantes.length > prevVisitantes.length) {
            const newVisitor = visitantes.find(v => !prevVisitantes.some(pv => pv.id === v.id));
            if (newVisitor) {
                speak(`Novo visitante: ${newVisitor.nome} da empresa ${newVisitor.empresa}`);
                toast({ title: "Novo Visitante", description: `${newVisitor.nome} (${newVisitor.empresa}) entrou.` });
            }
        }
    }, [visitantes, prevVisitantes, voiceAlerts, toast, loadingVisitantes]);

    useEffect(() => {
        if (!loadingRefeicoes && voiceAlertsRefeicoes && rawRefeicoes.length > prevRefeicoes.length) {
            const newRefeicao = rawRefeicoes.find(r => !prevRefeicoes.some(pr => pr.id === r.id));
            if (newRefeicao) {
                // @ts-ignore
                const individual = (newRefeicao.individuos && newRefeicao.individuos[0]) ? newRefeicao.individuos[0].nome : 'Policial';
                speak(`Nova refeição registrada para ${individual}`);
                toast({ title: "Nova Refeição", description: `${individual} registrou uma refeição.` });
            }
        }
    }, [rawRefeicoes, prevRefeicoes, voiceAlertsRefeicoes, toast, loadingRefeicoes]);

    useEffect(() => {
        if (!loadingTpas && voiceAlertsTPAs && tpas.length > prevTpas.length) {
            const newTpa = tpas.find(t => !prevTpas.some(pt => pt.id === t.id));
            if (newTpa) {
                speak(`Novo TPA: ${newTpa.nome}`);
                toast({ title: "Novo TPA", description: `${newTpa.nome} (TPA) registrou entrada.` });
            }
        }
    }, [tpas, prevTpas, voiceAlertsTPAs, toast, loadingTpas]);

    useEffect(() => {
        if (!loadingConsumos && voiceAlertsConsumo && rawConsumos.length > prevConsumos.length) {
            const newConsumo = rawConsumos.find(c => !prevConsumos.some(pc => pc.id === c.id));
            if (newConsumo) {
                // @ts-ignore
                speak(`Novo consumo de bordo da empresa ${newConsumo.empresa}`);
                // @ts-ignore
                toast({ title: "Novo Consumo de Bordo", description: `Registro da empresa ${newConsumo.empresa} para o navio ${newConsumo.navio}.` });
            }
        }
    }, [rawConsumos, prevConsumos, voiceAlertsConsumo, toast, loadingConsumos]);

    // --- Memoized Data Processing ---
    const refeicoes = useMemo(() => {
        return (rawRefeicoes as Array<any>).map(r => {
            let dataString = r.data;
            if (typeof r.data === 'object' && r.data !== null && 'toDate' in r.data) {
                dataString = r.data.toDate().toISOString().split('T')[0];
            } else if (typeof r.data === 'string' && r.data.includes('T')) {
                dataString = r.data.split('T')[0];
            }
            if ('individuos' in r && Array.isArray(r.individuos)) return { ...r, data: dataString };
            const oldRecord = r as any;
            return { ...oldRecord, data: dataString, individuos: [{ id: oldRecord.id, nome: oldRecord.nome || 'N/A', status: oldRecord.status || "presente", horaSaida: oldRecord.horaSaida || "" }] };
        });
    }, [rawRefeicoes]);

    const visitantesPresentes = useMemo(() => visitantes.filter(v => v.status === "presente"), [visitantes]);
    const permanenciaExcedida = useMemo(() => 
        visitantesPresentes
            .map(v => ({ ...v, duration: calculateDurationInHours(v.dataEntrada) }))
            .filter(v => v.duration > maxPermanenceHours)
            .sort((a, b) => b.duration - a.duration)
    , [visitantesPresentes, maxPermanenceHours]);

    const credenciaisPresentes = useMemo(() => {
        return visitantesPresentes.reduce((acc, v) => {
            if (v.credencial === 'verde') acc.verde++;
            if (v.credencial === 'vermelho') acc.vermelho++;
            return acc;
        }, { verde: 0, vermelho: 0 });
    }, [visitantesPresentes]);

    const visitantesPorEmpresaHoje = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const counts = visitantes.filter(v => v.dataEntrada && v.dataEntrada.startsWith(today)).reduce((acc, v) => {
            acc[v.empresa] = (acc[v.empresa] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [visitantes]);

    const fluxoVisitantesPorHora = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const counts = visitantes.filter(v => v.dataEntrada && v.dataEntrada.startsWith(today)).reduce((acc, v) => {
            try {
                const hour = new Date(v.dataEntrada).getHours();
                const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                acc[hourLabel] = (acc[hourLabel] || 0) + 1;
            } catch (e) {
                console.error("Data de entrada inválida:", v.dataEntrada, e);
            }
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
    }, [visitantes]);
    
    const allPresentIndividuals = useMemo(() => {
        const presentVisitantes = visitantes.filter(v => v.status === 'presente').map(v => ({ id: v.id, nome: v.nome, type: 'Visitante', destino: (v.terminal || '').toUpperCase(), details: [{ label: 'Empresa', value: v.empresa }, { label: 'Documento', value: v.documento }] }));
        const presentTPAs = tpas.filter(t => t.status === 'presente').map(t => ({ id: t.id, nome: t.nome, type: 'TPA', destino: 'TEG', details: [{ label: 'Função', value: t.funcao }, { label: 'Documento', value: t.documento }] }));
        // @ts-ignore
        const presentConsumos = rawConsumos.flatMap(c => (c.individuos || []).filter(i => i.status === 'presente').map(i => ({ id: i.id, nome: i.nome, type: 'Consumo de Bordo', destino: (c.terminal || '').toUpperCase(), details: [{ label: 'Empresa', value: c.empresa }, { label: 'Veículo', value: `${c.veiculo} (${c.placa})` }, { label: 'Produto', value: c.produto }] })));
        return [...presentVisitantes, ...presentTPAs, ...presentConsumos];
    }, [visitantes, tpas, rawConsumos]);

    const presentesTEG = useMemo(() => allPresentIndividuals.filter(p => p.destino === 'TEG'), [allPresentIndividuals]);
    const presentesTEAG = useMemo(() => allPresentIndividuals.filter(p => p.destino === 'TEAG'), [allPresentIndividuals]);
    const totalTEG = presentesTEG.length;
    const totalTEAG = presentesTEAG.length;
    const totalVisitantesPresentes = visitantes.filter(v => v.status === 'presente').length;
    const totalPoliciaisPresentes = refeicoes.flatMap(r => r.individuos).filter(i => i.status === 'presente').length;
    const totalTPAsPresentes = tpas.filter(t => t.status === 'presente').length;

    const consumoPorEmpresa = useMemo(() => {
         // @ts-ignore
        const counts = rawConsumos.reduce((acc, curr) => { acc[curr.empresa] = (acc[curr.empresa] || 0) + 1; return acc; }, {} as { [key: string]: number });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [rawConsumos]);

    const visitantesPorDestino = useMemo(() => {
        const counts = visitantes.reduce((acc, curr) => { const destino = curr.terminal || 'Não especificado'; acc[destino] = (acc[destino] || 0) + 1; return acc; }, {} as { [key: string]: number });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [visitantes]);

     const unifiedFeed = useMemo(() => {
        const visitantesFeed = visitantes.map(v => ({ type: 'Visitante', icon: Users, description: `${v.nome} (${v.empresa}) entrou.`, time: new Date(v.dataEntrada), color: "text-blue-500" }));
        const refeicoesFeed = refeicoes.flatMap((r: any) => (r.individuos || []).map((i: any) => ({ type: 'Refeição', icon: Shield, description: `${i.nome} (Policial) registrou refeição.`, time: new Date(`${r.data}T${r.hora}`), color: "text-green-500" })));
        // @ts-ignore
        const consumosFeed = rawConsumos.flatMap((c: any) => (c.individuos || []).map((i: any) => ({ type: 'Consumo', icon: Ship, description: `${i.nome} acessou o navio ${c.navio}.`, time: new Date(`${c.data}T${c.hora}`), color: "text-purple-500" })));
        const tpasFeed = tpas.map((t: any) => ({ type: 'TPA', icon: FileText, description: `${t.nome} (TPA) registrou entrada.`, time: new Date(`${t.dataEntrada}T${t.horaEntrada}`), color: "text-orange-500" }));
        return [...visitantesFeed, ...refeicoesFeed, ...consumosFeed, ...tpasFeed]
            .filter(item => !isNaN(item.time.getTime()))
            .sort((a, b) => b.time.getTime() - a.time.getTime())
            .slice(0, 10);
    }, [visitantes, refeicoes, rawConsumos, tpas]);

    // --- Render Logic ---
    const openModal = (title: string, data: any[]) => {
        setModalData({ title, data });
        setIsModalOpen(true);
    };

    if (loadingVisitantes || loadingConsumos || loadingRefeicoes || loadingTpas) {
        return <div className="flex items-center justify-center py-12">Carregando dados do painel...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => openModal('Presentes no TEG', presentesTEG)}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Presentes no TEG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTEG}</div></CardContent></Card>
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => openModal('Presentes no TEAG', presentesTEAG)}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Presentes no TEAG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTEAG}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Visitantes Presentes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalVisitantesPresentes}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Policiais Presentes</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalPoliciaisPresentes}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">TPAs Presentes</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalTPAsPresentes}</div></CardContent></Card>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card 
                    className={cn(
                        "border-destructive bg-destructive/10 cursor-pointer hover:bg-destructive/20",
                        permanenciaExcedida.length > 0 && "animate-blink-warning"
                    )}
                    onClick={() => setIsExceededStayModalOpen(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-destructive">Permanência Excedida</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-destructive">{permanenciaExcedida.length}</div><p className="text-xs text-destructive/80">Visitantes há mais de {maxPermanenceHours}h.</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Credenciais (Presentes)</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent className="pt-4 space-y-3">
                       <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-green-500"></span><span>Acesso ao Navio</span></div><span className="font-bold">{credenciaisPresentes.verde}</span></div>
                       <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-red-500"></span><span>Acesso ao Pier</span></div><span className="font-bold">{credenciaisPresentes.vermelho}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Visitantes de Hoje</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{visitantes.filter(v => v.dataEntrada && v.dataEntrada.startsWith(new Date().toISOString().split('T')[0])).length}</div><p className="text-xs text-muted-foreground">Novos registros no dia.</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Empresas de Hoje</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{[...new Set(visitantes.filter(v => v.dataEntrada && v.dataEntrada.startsWith(new Date().toISOString().split('T')[0])).map(v => v.empresa))].length}</div><p className="text-xs text-muted-foreground">Empresas únicas no dia.</p></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Consumo de Bordo por Empresa</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={consumoPorEmpresa} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                <defs><linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0"><stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.4}/></linearGradient></defs>
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/>
                                <Bar dataKey="value" fill="url(#colorUv)" radius={[0, 4, 4, 0]} barSize={30} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Visitantes por Destino</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={visitantesPorDestino} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} labelLine={false} label={false}>
                                    {visitantesPorDestino.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                                </Pie>
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}/>
                                <Tooltip content={<CustomPieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                 <Card className="lg:col-span-4">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="h-4 w-4"/> Visitantes por Empresa (Top 5 de Hoje)</CardTitle></CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={visitantesPorEmpresaHoje} layout="vertical" margin={{ left: 50 }}>
                                    <CartesianGrid horizontal={false} /><XAxis type="number" dataKey="value" hide/>
                                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={120} />
                                    <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} formatter={(value, name) => [`${value} visitantes`, name]} />
                                    <Bar dataKey="value" fill="var(--color-primary)" radius={4} barSize={30} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4"/> Fluxo de Visitantes (Hoje)</CardTitle></CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={{}} className="h-[300px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={fluxoVisitantesPorHora}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" name="Visitantes" fill="var(--color-primary)" radius={4} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><List className="h-4 w-4" /> Feed de Atividades Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {unifiedFeed.map((item, index) => (
                            <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.color?.replace('text-','bg-')+'_10')}>
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">{item.time.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - {item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* --- Modals --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md mx-auto sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{modalData.title}</DialogTitle>
                        <DialogDescription>Lista de todas as pessoas presentes no terminal.</DialogDescription>
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
                                            {person.details.map((detail: { label: string; value: string | undefined }) => detail.value && (
                                                <div key={detail.label} className="flex flex-col">
                                                    <span className="text-muted-foreground">{detail.label}</span>
                                                    <span className="font-medium">{detail.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Fechar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isExceededStayModalOpen} onOpenChange={setIsExceededStayModalOpen}>
                <DialogContent className="max-w-md mx-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Visitantes com Permanência Excedida</DialogTitle>
                        <DialogDescription>Visitantes que estão no local há mais de {maxPermanenceHours} horas.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto py-4">
                        <ul className="space-y-3">
                            {permanenciaExcedida.map(visitor => (
                                <li key={visitor.id} className="rounded-lg border bg-card p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{visitor.nome}</p>
                                            <p className="text-sm text-muted-foreground">{visitor.empresa}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-destructive">{formatDuration(visitor.duration)}</p>
                                            <p className="text-xs text-muted-foreground">Entrada: {new Date(visitor.dataEntrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Fechar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
