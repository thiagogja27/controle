'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTPAs, useConsumos, useVisitantes, useRefeicoes } from "@/hooks/use-firebase"
import * as XLSX from 'xlsx'

export function ReportsSection() {
  const { data: tpas } = useTPAs()
  const { data: consumos } = useConsumos()
  const { data: visitantes } = useVisitantes()
  const { data: refeicoes } = useRefeicoes()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filterByDate = (data: any[]) => {
    if (!startDate || !endDate) return data
    return data.filter(item => {
      const itemDate = new Date(item.data || item.dataEntrada).getTime()
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      return itemDate >= start && itemDate <= end
    })
  }

  const handleExport = (section: string) => {
    const dataMap: { [key: string]: any[] } = {
      tpas: filterByDate(tpas),
      consumos: filterByDate(consumos),
      visitantes: filterByDate(visitantes),
      refeicoes: filterByDate(refeicoes),
    }

    const wb = XLSX.utils.book_new()

    if (section === 'geral') {
      Object.keys(dataMap).forEach(key => {
        if (dataMap[key].length > 0) {
          const ws = XLSX.utils.json_to_sheet(dataMap[key])
          XLSX.utils.book_append_sheet(wb, ws, key)
        }
      })
    } else {
      if (dataMap[section].length > 0) {
        const ws = XLSX.utils.json_to_sheet(dataMap[section])
        XLSX.utils.book_append_sheet(wb, ws, section)
      }
    }

    XLSX.writeFile(wb, `${section}_report.xlsx`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Relatórios</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Consolidado Geral</CardTitle>
            <Button onClick={() => handleExport('geral')} size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatórios de TPA</CardTitle>
            <Button onClick={() => handleExport('tpas')} size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatórios de Consumo</CardTitle>
            <Button onClick={() => handleExport('consumos')} size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatórios de Visitantes</CardTitle>
            <Button onClick={() => handleExport('visitantes')} size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Relatórios de Refeições</CardTitle>
            <Button onClick={() => handleExport('refeicoes')} size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
