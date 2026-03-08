"use client"

import { useState } from "react"
import { Plus, Search, UserCheck, UserX, Clock, Building2, Loader2, FileText, Car, FilePenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { type Visitante } from "@/lib/store"
import { useVisitantes } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

export function VisitantesSection() {
  const { data: visitantes, loading, addItem, updateItem } = useVisitantes()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newVisitante, setNewVisitante] = useState({
    nome: "",
    documento: "",
    empresa: "",
    motivo: "",
    destino: "",
    notaFiscal: "",
    placa: "",
    observacoes: ""
  })

  const presentes = visitantes.filter(v => v.status === "presente").length
  const sairam = visitantes.filter(v => v.status === "saiu").length

  const filteredVisitantes = visitantes.filter(v =>
    v.nome.toLowerCase().includes(search.toLowerCase()) ||
    v.empresa.toLowerCase().includes(search.toLowerCase()) ||
    v.documento.includes(search)
  )

  const handleAddVisitante = async () => {
    setIsSaving(true)
    try {
      const now = new Date()
      const newV: Omit<Visitante, "id"> = {
        ...newVisitante,
        placa: newVisitante.placa || "N/A", // Set placa to "N/A" if empty
        dataEntrada: now.toISOString().split("T")[0],
        horaEntrada: now.toTimeString().slice(0, 5),
        status: "presente"
      }
      await addItem(newV)
      setNewVisitante({ nome: "", documento: "", empresa: "", motivo: "", destino: "", notaFiscal: "", placa: "", observacoes: "" })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar visitante:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegistrarSaida = async (id: string) => {
    try {
      await updateItem(id, {
        status: "saiu",
        horaSaida: new Date().toTimeString().slice(0, 5)
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presentes}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <UserX className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sairam}</p>
              <p className="text-sm text-muted-foreground">Saíram Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{visitantes.length}</p>
              <p className="text-sm text-muted-foreground">Total Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(visitantes.map(v => v.empresa)).size}</p>
              <p className="text-sm text-muted-foreground">Empresas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Novo Visitante</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={newVisitante.nome}
                  onChange={(e) => setNewVisitante({ ...newVisitante, nome: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documento">Documento (CPF)</Label>
                <Input
                  id="documento"
                  value={newVisitante.documento}
                  onChange={(e) => setNewVisitante({ ...newVisitante, documento: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={newVisitante.empresa}
                  onChange={(e) => setNewVisitante({ ...newVisitante, empresa: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo da Visita</Label>
                <Input
                  id="motivo"
                  value={newVisitante.motivo}
                  onChange={(e) => setNewVisitante({ ...newVisitante, motivo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destino">Destino</Label>
                <Input
                  id="destino"
                  value={newVisitante.destino}
                  onChange={(e) => setNewVisitante({ ...newVisitante, destino: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                <Input
                  id="notaFiscal"
                  value={newVisitante.notaFiscal}
                  onChange={(e) => setNewVisitante({ ...newVisitante, notaFiscal: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="N/A se não houver"
                  value={newVisitante.placa}
                  onChange={(e) => setNewVisitante({ ...newVisitante, placa: e.target.value })}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={newVisitante.observacoes}
                  onChange={(e) => setNewVisitante({ ...newVisitante, observacoes: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddVisitante} className="mt-2 w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Entrada
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visitors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Visitantes de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Visitante</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Nota Fiscal</th>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Data & Hora</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredVisitantes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Nenhum visitante registrado.
                    </td>
                  </tr>
                ) : (
                  filteredVisitantes.map((visitante) => (
                    <tr key={visitante.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{visitante.nome}</div>
                        <div className="text-xs text-muted-foreground">{visitante.motivo}</div>
                      </td>
                      <td className="px-4 py-3">{visitante.documento}</td>
                      <td className="px-4 py-3">{visitante.empresa}</td>
                      <td className="px-4 py-3">{visitante.notaFiscal || "-"}</td>
                      <td className="px-4 py-3">{visitante.placa || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">{new Date(visitante.dataEntrada + 'T00:00:00-03:00').toLocaleDateString('pt-BR')}</div>
                        <div><span className="font-medium">Ent:</span> {visitante.horaEntrada}</div>
                        <div><span className="font-medium">Saí:</span> {visitante.horaSaida || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                          visitante.status === "presente"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        )}>
                          {visitante.status === "presente" ? "Presente" : "Saiu"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{visitante.observacoes || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {visitante.status === "presente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegistrarSaida(visitante.id)}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            <span>Sair</span>
                          </Button>
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
