
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function AgendaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda</CardTitle>
        <CardDescription>
          Gerencie seus compromissos e agendamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
          <Calendar className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold mt-4">Módulo de Agenda em Construção</h3>
          <p className="text-muted-foreground">
            Este espaço será usado para visualizar e gerenciar sua agenda de compromissos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
