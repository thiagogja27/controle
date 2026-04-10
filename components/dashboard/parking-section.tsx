'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParking } from "@/hooks/use-parking";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ParkingSection() {
  const { spaces, loading } = useParking();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estacionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {spaces.map((space) => (
              <Tooltip key={space.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-md text-center font-bold text-white cursor-pointer transition-colors ${
                      space.status === 'available' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {space.id}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {space.status === 'occupied' ? (
                    <p>Ocupado por: {space.occupied_by_plate}</p>
                  ) : (
                    <p>Vaga disponível</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
