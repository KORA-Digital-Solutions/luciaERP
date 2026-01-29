import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const services = [
  { id: '1', name: 'Consulta inicial', duration: '1h', price: '€50' },
  { id: '2', name: 'Seguimiento', duration: '30m', price: '€30' },
  { id: '3', name: 'Tratamiento completo', duration: '2h', price: '€120' },
  { id: '4', name: 'Revisión mensual', duration: '45m', price: '€40' },
];

const professionals = [
  { id: '1', name: 'María García' },
  { id: '2', name: 'Carlos López' },
  { id: '3', name: 'Ana Rodríguez' },
];

export function NewAppointmentModal({ open, onOpenChange }: NewAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              placeholder="Buscar cliente por nombre o email..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Escribe para buscar clientes existentes o{' '}
              <button type="button" className="text-primary hover:underline">
                crear uno nuevo
              </button>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Servicio</Label>
            <Select>
              <SelectTrigger id="service">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {service.duration} · {service.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional">Profesional (Opcional)</Label>
            <Select>
              <SelectTrigger id="professional">
                <SelectValue placeholder="Asignar automáticamente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Asignar automáticamente</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              placeholder="Añadir notas sobre la cita..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Confirmar Reserva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
