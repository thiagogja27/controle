"use client"

import { useState } from "react"
import { LogOut, Plus, Search, Ship, Truck, Users, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { type ConsumoBordo, type Individuo } from "@/lib/store"
import { useConsumos } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

export function ConsumoSection() {
  const { data: consumos, loading, addItem, updateItem } = useConsumos()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newConsumo, setNewConsumo] = useState({
    individuos: [{ id: "temp-1", nome: "" }] as Individuo[],
    veiculo: "",
    placa: "",
    produto: "",
    notaFiscal: "",
    navio: "",
    terminal: "teg" as "teg" | "teag",
    empresa: "",
    vigilante: ""
  })

  const totalRegistros = consumos.length
  const presentes = consumos.filter(c => c.status === "presente").length
  const totalIndividuos = consumos.reduce((acc, c) => acc + (c.individuos?.length || 0), 0)

  const filteredConsumos = consumos.filter(c => {
    const searchLower = search.toLowerCase()
    return (
      (c.individuos?.some(ind => ind.nome.toLowerCase().includes(searchLower)) ?? false) ||
      c.veiculo.toLowerCase().includes(searchLower) ||
      c.placa.toLowerCase().includes(searchLower) ||
      c.produto.toLowerCase().includes(searchLower) ||
      c.navio.toLowerCase().includes(searchLower) ||
      c.empresa.toLowerCase().includes(searchLower)
    )
  })

  const handleAddIndividuo = () => {
    setNewConsumo({
      ...newConsumo,
      individuos: [...newConsumo.individuos, { id: `temp-${Date.now()}`, nome: "" }]
    })
  }

  const handleRemoveIndividuo = (id: string) => {
    if (newConsumo.individuos.length > 1) {
      setNewConsumo({
        ...newConsumo,
        individuos: newConsumo.individuos.filter(ind => ind.id !== id)
      })
    }
  }

  const handleIndividuoChange = (id: string, nome: string) => {
    setNewConsumo({
      ...newConsumo,
      individuos: newConsumo.individuos.map(ind =>
        ind.id === id ? { ...ind, nome } : ind
      )
    })
  }

  const handleAddConsumo = async () => {
    setIsSaving(true)
    try {
      const now = new Date()
      const entry: Omit<ConsumoBordo, "id"> = {
        individuos: newConsumo.individuos.filter(ind => ind.nome.trim() !== ""),
        veiculo: newConsumo.veiculo,
        placa: newConsumo.placa,
        produto: newConsumo.produto,
        notaFiscal: newConsumo.notaFiscal,
        navio: newConsumo.navio,
        terminal: newConsumo.terminal,
        empresa: newConsumo.empresa,
        vigilante: newConsumo.vigilante,
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        status: "presente"
      }
      await addItem(entry)
      setNewConsumo({
        individuos: [{ id: "temp-1", nome: "" }],
        veiculo: "",
        placa: "",
        produto: "",
        notaFiscal: "",
        navio: "",
        terminal: "teg",
        empresa: "",
        vigilante: ""
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar consumo:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaida = async (id: string) => {
    try {
      const now = new Date()
      await updateItem(id, {
        horaSaida: now.toTimeString().slice(0, 5),
        status: "saiu"
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
  }

  const formatDateTime = (data: string, hora: string) => {
    const [year, month, day] = data.split("-")
    return `${day}/${month}/${year} ${hora}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRegistros}</p>
              <p className="text-sm text-muted-foreground">Total Registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/10">
              <Ship className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presentes}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-400/10">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalIndividuos}</p>
              <p className="text-sm text-muted-foreground">Total Indivíduos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, veículo, placa, navio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Consumo de Bordo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Individuos */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Indivíduos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddIndividuo}>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newConsumo.individuos.map((ind, index) => (
                    <div key={ind.id} className="flex gap-2">
                      <Input
                        placeholder={`Nome do indivíduo ${index + 1}`}
                        value={ind.nome}
                        onChange={(e) => handleIndividuoChange(ind.id, e.target.value)}
                      />
                      {newConsumo.individuos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIndividuo(ind.id)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="veiculo">Veículo</Label>
                  <Input
                    id="veiculo"
                    placeholder="Ex: Caminhão Baú"
                    value={newConsumo.veiculo}
                    onChange={(e) => setNewConsumo({ ...newConsumo, veiculo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="placa">Placa</Label>
                  <Input
                    id="placa"
                    placeholder="Ex: ABC-1234"
                    value={newConsumo.placa}
                    onChange={(e) => setNewConsumo({ ...newConsumo, placa: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="produto">Produto</Label>
                  <Input
                    id="produto"
                    placeholder="Ex: Água Mineral"
                    value={newConsumo.produto}
                    onChange={(e) => setNewConsumo({ ...newConsumo, produto: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                  <Input
                    id="notaFiscal"
                    placeholder="Ex: NF-001234"
                    value={newConsumo.notaFiscal}
                    onChange={(e) => setNewConsumo({ ...newConsumo, notaFiscal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="navio">Navio</Label>
                  <Input
                    id="navio"
                    placeholder="Nome do navio"
                    value={newConsumo.navio}
                    onChange={(e) => setNewConsumo({ ...newConsumo, navio: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="terminal">Terminal</Label>
                  <Select
                    value={newConsumo.terminal}
                    onValueChange={(value: "teg" | "teag") =>
                      setNewConsumo({ ...newConsumo, terminal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teg">TEG</SelectItem>
                      <SelectItem value="teag">TEAG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Nome da empresa"
                    value={newConsumo.empresa}
                    onChange={(e) => setNewConsumo({ ...newConsumo, empresa: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vigilante">Vigilante</Label>
                  <Input
                    id="vigilante"
                    placeholder="Nome do vigilante"
                    value={newConsumo.vigilante}
                    onChange={(e) => setNewConsumo({ ...newConsumo, vigilante: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleAddConsumo} className="mt-2" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Entrada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Consumo Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Consumo de Bordo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Data / Hora</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Nome(s)</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Veículo</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Placa</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Produto</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Nota Fiscal</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Navio</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Terminal</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Empresa</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Vigilante</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Saída</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsumos.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredConsumos.map((consumo) => (
                    <tr key={consumo.id} className="border-b border-border/50">
                      <td className="py-4 text-sm tabular-nums">
                        {formatDateTime(consumo.data, consumo.hora)}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-0.5">
                          {(consumo.individuos || []).map((ind, idx) => (
                            <span key={ind.id || idx} className="text-sm font-medium">
                              {ind.nome}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-sm">{consumo.veiculo}</td>
                      <td className="py-4 text-sm font-mono">{consumo.placa}</td>
                      <td className="py-4 text-sm">{consumo.produto}</td>
                      <td className="py-4 text-sm font-mono">{consumo.notaFiscal}</td>
                      <td className="py-4 text-sm">{consumo.navio}</td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            consumo.terminal === "teg"
                              ? "bg-primary/10 text-primary"
                              : "bg-blue-400/10 text-blue-400"
                          )}
                        >
                          {consumo.terminal.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-sm">{consumo.empresa}</td>
                      <td className="py-4 text-sm">{consumo.vigilante}</td>
                      <td className="py-4">
                        {consumo.horaSaida ? (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {consumo.horaSaida}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4">
                        {consumo.status === "presente" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaida(consumo.id)}
                            className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Dar Saída
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Finalizado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
