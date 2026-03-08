"use client"

import { useState } from "react"
import { LogOut, Plus, Search, Ship, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { type TPA } from "@/lib/store"
import { useTPAs } from "@/hooks/use-firebase"

const empty = {
  nome: "",
  funcao: "",
  documento: "",
  destino: "",
  navio: "",
  pier: "teg" as "teg" | "teag",
  observacao: "",
  vigilante: "",
}

export function TPAsSection() {
  const { data: registros, loading, addItem, updateItem } = useTPAs()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(empty)

  const totalPresentes = registros.filter((r) => r.status === "presente").length
  const totalTeg = registros.filter((r) => r.pier === "teg").length
  const totalTeag = registros.filter((r) => r.pier === "teag").length

  const filtered = registros.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) ||
    r.documento.toLowerCase().includes(search.toLowerCase()) ||
    r.navio.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    setIsSaving(true)
    try {
      const now = new Date()
      const entry: Omit<TPA, "id"> = {
        ...form,
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        status: "presente",
      }
      await addItem(entry)
      setForm(empty)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar TPA:", error)
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

  const formatDate = (data: string, hora: string) => {
    const [y, m, d] = data.split("-")
    return `${d}/${m}/${y} ${hora}`
  }

  const isFormValid =
    form.nome.trim() &&
    form.funcao.trim() &&
    form.documento.trim() &&
    form.destino.trim() &&
    form.navio.trim() &&
    form.vigilante.trim()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registros.length}</p>
              <p className="text-sm text-muted-foreground">Total do Dia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Ship className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalPresentes}</p>
              <p className="text-sm text-muted-foreground">A Bordo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
              <span className="text-xs font-bold text-muted-foreground">TEG</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTeg}</p>
              <p className="text-sm text-muted-foreground">Pier TEG</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
              <span className="text-xs font-bold text-muted-foreground">TEAG</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTeag}</p>
              <p className="text-sm text-muted-foreground">Pier TEAG</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou navio..."
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Entrada TPA</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    id="funcao"
                    placeholder="Ex: Operador, Técnico"
                    value={form.funcao}
                    onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="documento">Documento</Label>
                  <Input
                    id="documento"
                    placeholder="CPF / RG"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destino">Destino</Label>
                  <Input
                    id="destino"
                    placeholder="Ex: Convés Principal"
                    value={form.destino}
                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="navio">Navio</Label>
                  <Input
                    id="navio"
                    placeholder="Nome do navio"
                    value={form.navio}
                    onChange={(e) => setForm({ ...form, navio: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pier">Pier</Label>
                  <Select
                    value={form.pier}
                    onValueChange={(v: "teg" | "teag") => setForm({ ...form, pier: v })}
                  >
                    <SelectTrigger id="pier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teg">TEG</SelectItem>
                      <SelectItem value="teag">TEAG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vigilante">Vigilante</Label>
                <Input
                  id="vigilante"
                  placeholder="Nome do vigilante responsável"
                  value={form.vigilante}
                  onChange={(e) => setForm({ ...form, vigilante: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  placeholder="Observações adicionais (opcional)"
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                />
              </div>
              <Button onClick={handleAdd} disabled={!isFormValid || isSaving} className="mt-2">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Entrada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Data / Hora</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Função</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Destino</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Navio</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Pier</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Observação</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Vigilante</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Hora Saída</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatDate(r.data, r.hora)}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{r.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.funcao}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.documento}</td>
                  <td className="px-4 py-3">{r.destino}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.navio}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.pier === "teg"
                        ? "bg-primary/10 text-primary"
                        : "bg-info/10 text-info"
                    }`}>
                      {r.pier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-muted-foreground">
                    {r.observacao || <span className="text-border">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.vigilante}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                    {r.horaSaida ?? <span className="text-border">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "presente" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaida(r.id)}
                        className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
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
    </div>
  )
}
