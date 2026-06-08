'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface LoginFormProps {
  introComplete: boolean
}

export function LoginForm({ introComplete }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showLogos, setShowLogos] = useState(false)
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
      setError("Falha no login. Verifique seu e-mail ou senha.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let subtitleTimeout: ReturnType<typeof setTimeout> | undefined
    let logosTimeout: ReturnType<typeof setTimeout> | undefined

    if (introComplete) {
      subtitleTimeout = setTimeout(() => setShowSubtitle(true), 350)
      logosTimeout = setTimeout(() => setShowLogos(true), 650)
    } else {
      setShowSubtitle(false)
      setShowLogos(false)
    }

    return () => {
      if (subtitleTimeout) clearTimeout(subtitleTimeout)
      if (logosTimeout) clearTimeout(logosTimeout)
    }
  }, [introComplete])

  return (
    <>
      <div className="z-10 mb-8 flex w-full max-w-md flex-col items-center justify-center text-center gap-6">
        <div className={`space-y-4 ${introComplete ? 'animate-rdsp-soft' : 'opacity-100'}`}>
          <h1 className="text-6xl font-black tracking-tight text-white sm:text-7xl md:text-8xl">
            RDSP
          </h1>
          <p className={`text-sm text-slate-300 ${showSubtitle ? 'animate-fade-up-soft' : 'opacity-0 pointer-events-none'}`}>
            Registro de Dados de Segurança Patrimonial
          </p>
        </div>
      </div>
      <Card className={`origin-top z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl ${introComplete ? 'animate-card-drop' : 'opacity-0 pointer-events-none'}`}>
        <CardHeader className="text-center px-6 pt-8">
          <CardTitle className="text-3xl font-bold text-white">Acesso Restrito</CardTitle>
          <CardDescription className="text-slate-200/80">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-100">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-100">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-center text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" variant="ghost" className="w-full py-3 bg-slate-600/60 text-white hover:bg-slate-600/80" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className={`mt-8 flex flex-wrap items-center justify-center gap-8 transition-all duration-700 ease-out ${showLogos ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <img
          src="/teag-logo.png"
          alt="TEAG Logo"
          width={150}
          height={42}
          className="object-contain pointer-events-none select-none"
        />
        <img
          src="/baltech-logo.png"
          alt="BalTech Solutions Logo"
          width={150}
          height={42}
          className="object-contain pointer-events-none select-none"
        />
      </div>
    </>
  )
}
