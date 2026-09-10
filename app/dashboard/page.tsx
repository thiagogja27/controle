'use client'

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useVisitantes, useRefeicoes, useConsumos, useTPAs } from "@/hooks/use-firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building, UserCheck, UserMinus, Users, Ship, Anchor, AlertTriangle, User, Sailboat, FileText } from "lucide-react";
import { useSettingsStore } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4dff4d', '#4d4dff'];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Empresa</span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Total</span>
            <span className="font-bold">{payload[0].value}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function formatarNome(nome: string) {
    if (nome.length <= 18) {
        return nome;
    }
    const partes = nome.split(" ");
    if (partes.length > 1) {
        return `${partes[0]} ${partes[partes.length - 1][0]}.`;
    }
    return nome.substring(0, 15) + "...";
}

export default function DashboardPage() {
  const { data: visitantes, loading: loadingVisitantes } = useVisitantes();
  const { data: consumo, loading: loadingConsumo } = useConsumos();
  const { data: refeicoes, loading: loadingRefeicoes } = useRefeicoes();
  const { data: tpas, loading: loadingTPAs } = useTPAs();
  const maxPermanenceHours = useSettingsStore(state => state.maxPermanenceHours);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const limitDate = new Date(now.getTime() - maxPermanenceHours * 60 * 60 * 1000);

    const visitantesPresentes = visitantes.filter(v => v.status && v.status.toLowerCase() === "presente");
    const visitantesPresentesTEG = visitantesPresentes.filter(v => v.terminal && v.terminal.toLowerCase() === 'teg').length;
    const visitantesPresentesTEAG = visitantesPresentes.filter(v => v.terminal && v.terminal.toLowerCase() === 'teag').length;

    const tpasPresentes = tpas.filter(t => t.status && t.status.toLowerCase() === "presente");
    const tpasPresentesTEG = tpasPresentes.filter(t => t.pier && t.pier.toLowerCase() === 'teg').length;
    const tpasPresentesTEAG = tpasPresentes.filter(t => t.pier && t.pier.toLowerCase() === 'teag').length;
    const tpasPresentesSemPier = tpasPresentes.filter(t => !t.pier).length;


    const sairamHoje = visitantes.filter(v => v.dataSaida && v.dataSaida.startsWith(todayStr));
    const visitantesDeHoje = visitantes.filter(v => v.dataEntrada && v.dataEntrada.startsWith(todayStr));
    const empresasDeHoje = [...new Set(visitantesDeHoje.map(v => v.empresa))];
    const permanenciaExcedida = visitantesPresentes.filter(v => v.dataEntrada && new Date(v.dataEntrada) < limitDate);

    const consumoPorEmpresa = consumo.reduce((acc, item) => {
      const empresa = item.empresa || 'desconhecida';
      const quantidade = item.individuos ? item.individuos.length : 0;
      acc[empresa] = (acc[empresa] || 0) + quantidade;
      return acc;
    }, {} as Record<string, number>);
    const consumoData = Object.entries(consumoPorEmpresa).map(([name, value]) => ({ name, value }));
    
    const allIndividuos = refeicoes.flatMap(r => r.individuos?.map(i => ({ ...i, categoria: r.categoria })) || []);
    const policiaisPresentes = allIndividuos.filter(i => i.status === "presente").length;

    const acessoNavio = visitantesPresentes.filter(v => v.destino && v.destino.toLowerCase().includes('navio')).length;
    const acessoPier = visitantesPresentes.filter(v => v.destino && v.destino.toLowerCase().includes('pier')).length;

    return {
      visitantesPresentesTEG,
      visitantesPresentesTEAG,
      tpasPresentesTEG,
      tpasPresentesTEAG,
      tpasPresentesSemPier,
      totalPresentes: visitantesPresentes.length,
      sairamHoje: sairamHoje.length,
      visitantesDeHoje: visitantesDeHoje.length,
      empresasDeHoje: empresasDeHoje.length,
      permanenciaExcedida,
      consumoData,
      policiaisPresentes,
      acessoNavio,
      acessoPier,
    };
  }, [visitantes, consumo, refeicoes, tpas, maxPermanenceHours]);
  
  const visitantesPorDestino = useMemo(() => {
    const presentes = visitantes.filter(v => v.status && v.status.toLowerCase() === 'presente');
    const porDestino = presentes.reduce((acc, visitante) => {
        const destino = visitante.destino || 'Não especificado';
        acc[destino] = (acc[destino] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(porDestino).map(([name, value]) => ({ name, value }));
}, [visitantes]);

  const loading = loadingVisitantes || loadingConsumo || loadingRefeicoes || loadingTPAs;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Visitantes no TEG</CardTitle><Ship className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.visitantesPresentesTEG}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Visitantes no TEAG</CardTitle><Anchor className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.visitantesPresentesTEAG}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TPAs no TEG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.tpasPresentesTEG}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TPAs no TEAG</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.tpasPresentesTEAG}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TPAs (Sem Píer)</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.tpasPresentesSemPier}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Policiais Presentes</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.policiaisPresentes}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className={cn("lg:col-span-1", stats.permanenciaExcedida.length > 0 ? "border-destructive bg-destructive/10" : "")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permanência Excedida</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", stats.permanenciaExcedida.length > 0 ? "text-destructive" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.permanenciaExcedida.length}</div>
               <div className="text-xs text-muted-foreground mt-1 space-y-1">
                {stats.permanenciaExcedida.slice(0, 3).map(v => (
                  <p key={v.id} className="truncate">{formatarNome(v.nome)} há mais de {maxPermanenceHours}h</p>
                ))}
                {stats.permanenciaExcedida.length > 3 && <p>e mais {stats.permanenciaExcedida.length - 3}...</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Credenciais (Presentes)</CardTitle><Sailboat className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Acesso ao Navio</div>
              <div className="text-lg font-bold">{stats.acessoNavio}</div>
              <div className="text-sm text-muted-foreground mt-2">Acesso ao Píer</div>
              <div className="text-lg font-bold">{stats.acessoPier}</div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Visitantes de Hoje</CardTitle><User className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.visitantesDeHoje}</div><p className="text-xs text-muted-foreground">Novos registros no dia.</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Empresas de Hoje</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.empresasDeHoje}</div><p className="text-xs text-muted-foreground">Empresas a(s) qual(is) os visitantes pertencem.</p></CardContent></Card>
          </div>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Consumo de Bordo por Empresa</CardTitle></CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.consumoData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
                    <Bar dataKey="value" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
         <Card>
            <CardHeader><CardTitle>Visitantes por Destino</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={visitantesPorDestino} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            if (midAngle === undefined || midAngle === null || percent === undefined || percent === null) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{`${(percent * 100).toFixed(0)}%`}</text>;
                        }}>
                        {visitantesPorDestino.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
