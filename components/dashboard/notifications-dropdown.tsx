'use client'

import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { useNotificationStore, hydrateUnreadCount } from "@/lib/notifications/store"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    // On initial client-side load, sync the unread count
    // based on the persisted state.
    hydrateUnreadCount();
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative rounded-full">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Notificações</span>
            {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs text-muted-foreground">
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Marcar todas como lidas
                </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</p>
            ) : (
                notifications.map(n => (
                    <DropdownMenuItem 
                        key={n.id} 
                        onSelect={() => handleMarkAsRead(n.id)}
                        className={cn("flex flex-col items-start gap-1 p-3 cursor-pointer", !n.isRead && "bg-secondary/50")}
                    >
                        <div className="flex items-center justify-between w-full">
                            <p className="font-semibold">{n.title}</p>
                            {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <p className="text-xs text-muted-foreground w-full whitespace-normal">{n.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(n.timestamp, { addSuffix: true, locale: ptBR })}</p>
                    </DropdownMenuItem>
                ))
            )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
