'use client'

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      router.push("/") // Redirect to dashboard on successful login
    } catch (err) {
      setError("Falha no login. Verifique seu e-mail e senha.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center justify-center gap-8">
        <Image 
          src="/teag-logo.png" 
          alt="TEG/TEAG Logo" 
          width={350} 
          height={98}
        />
        <Image 
          src="/baltech-logo.png" 
          alt="BalTech Solutions Logo" 
          width={350} 
          height={98}
        />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="pt-8 text-2xl font-bold">Acesso Restrito</CardTitle>
          <CardDescription>Faça login para gerenciar o sistema de controle patrimonial.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-center text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>© 2026 BalTech Solutions. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
