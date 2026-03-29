'use client'

import { Bell, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from 'next/navigation'
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import Image from "next/image"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login') // Redirect to login page after logout
    } catch (error) {
      console.error("Failed to log out:", error)
      // Optionally, show an error message to the user
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center">
            <Image
                src="/teag-logo.png"
                alt="TEG/TEAG Logo"
                width={150}
                height={42}
                priority
            />
        </div>
      
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" className="relative rounded-full">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            3
          </span>
        </Button>
                
        {isClient && 
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative rounded-full">
                    <User className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Minha Conta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user?.email ?? 'Usuário'}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        }
      </div>
    </header>
  )
}
