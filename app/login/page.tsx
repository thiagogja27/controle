
import { ParticlesBackground } from "@/components/ui/particles-background"
import { LoginForm } from "@/components/login/login-form"

export default function LoginPage() {
  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center p-4">
      <ParticlesBackground />
      <LoginForm />
      <footer className="absolute bottom-4 z-10 text-center text-sm text-muted-foreground">
        <p>© 2026 BalTech Solutions. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
