
'use client'

'use client'

import { useEffect, useState } from "react"
import { ParticlesBackground } from "@/components/ui/particles-background"
import { LoginForm } from "@/components/login/login-form"

export default function LoginPage() {
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroComplete(true), 850)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <ParticlesBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <LoginForm introComplete={introComplete} />
      </div>
      <footer className="absolute left-1/2 bottom-4 z-10 -translate-x-1/2 text-center text-sm text-white/70">
        <p>
          ©{' '}
          <a
            href="https://baltech-tau.vercel.app/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sky-300 hover:text-sky-200"
          >
            BalTech Solutions
          </a>
          . Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
