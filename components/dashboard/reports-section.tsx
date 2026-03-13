'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTPAs, useConsumos, useVisitantes, useRefeicoes } from "@/hooks/use-firebase"
import * as XLSX from 'xlsx'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ReportsSection() {
  const { data: tpas, loading: tpasLoading } = useTPAs();
  const { data: consumos, loading: consumosLoading } = useConsumos();
  const { data: visitantes, loading: visitantesLoading } = useVisitantes();
  const { data: refeicoes, loading: refeicoesLoading } = useRefeicoes();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const filterByDate = (data: any[]) => {
    if (!startDate || !endDate) return data;
    
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    return data.filter(item => {
      const itemDateStr = item.data || item.dataEntrada;
      if (!itemDateStr) return false;
      
      const itemDate = new Date(`${itemDateStr}T00:00:00Z`);
      
      return itemDate.getTime() >= start.getTime() && itemDate.getTime() <= end.getTime();
    });
  };

  const handleExport = async (section: string) => {
    setIsExporting(section);
    await sleep(1000); 

    const dataMap: { [key: string]: any[] } = {
      TPAs: filterByDate(tpas),
      Consumos: filterByDate(consumos),
      Visitantes: filterByDate(visitantes),
      Refeicoes: filterByDate(refeicoes),
    };

    const wb = XLSX.utils.book_new();
    const fileName = (startDate && endDate)
      ? `${section}_${startDate}_a_${endDate}.xlsx`
      : `${section}_completo.xlsx`;

    if (section === 'geral') {
      Object.keys(dataMap).forEach(key => {
        if (dataMap[key] && dataMap[key].length > 0) {
          const ws = XLSX.utils.json_to_sheet(dataMap[key]);
          XLSX.utils.book_append_sheet(wb, ws, key);
        }
      });
    } else if (dataMap[section]) {
      if (dataMap[section].length > 0) {
        const ws = XLSX.utils.json_to_sheet(dataMap[section]);
        XLSX.utils.book_append_sheet(wb, ws, section);
      }
    }

    if (wb.SheetNames.length > 0) {
        XLSX.writeFile(wb, fileName);
    } else {
        alert("Nenhum dado encontrado para o período selecionado.");
    }

    setIsExporting(null);
  };
  
  const isLoading = tpasLoading || consumosLoading || visitantesLoading || refeicoesLoading;

  const reportCards = [
    { id: 'geral', title: 'Consolidado Geral' },
    { id: 'TPAs', title: 'Relatórios de TPA' },
    { id: 'Consumos', title: 'Relatórios de Consumo' },
    { id: 'Visitantes', title: 'Relatórios de Visitantes' },
    { id: 'Refeicoes', title: 'Relatórios de Refeições' },
  ];

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="start-date">Data Inicial</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={!!isExporting} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="end-date">Data Final</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!!isExporting} />
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCards.map(report => (
            <Card key={report.id}>
                <CardContent className="p-6 flex items-center justify-between">
                    <h3 className="font-medium">{report.title}</h3>
                    <Button 
                        onClick={() => handleExport(report.id)} 
                        size="sm" 
                        variant="default"
                        disabled={isLoading || !!isExporting}
                    >
                        {(isExporting === report.id) ? (
                        <Download className="mr-2 h-4 w-4 animate-bounce"/>
                        ) : (
                        <Download className="mr-2 h-4 w-4"/>
                        )}
                        {isExporting === report.id ? 'Exportando...' : 'Exportar'}
                    </Button>
                </CardContent>
            </Card>
            ))}
        </div>
    </div>
  )
}
