import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const services = [
  {
    id: '1',
    name: 'Consulta Inicial',
    description: 'Primera visita para evaluación y diagnóstico completo',
    duration: 60,
    price: 50,
    category: 'Consultas',
    active: true,
  },
  {
    id: '2',
    name: 'Seguimiento',
    description: 'Visita de seguimiento para revisar evolución',
    duration: 30,
    price: 30,
    category: 'Consultas',
    active: true,
  },
  {
    id: '3',
    name: 'Tratamiento Completo',
    description: 'Sesión de tratamiento intensivo',
    duration: 120,
    price: 120,
    category: 'Tratamientos',
    active: true,
  },
  {
    id: '4',
    name: 'Revisión Mensual',
    description: 'Control mensual de mantenimiento',
    duration: 45,
    price: 40,
    category: 'Revisiones',
    active: true,
  },
  {
    id: '5',
    name: 'Terapia Grupal',
    description: 'Sesión de terapia en grupo reducido',
    duration: 90,
    price: 25,
    category: 'Tratamientos',
    active: false,
  },
];

const categories = ['Consultas', 'Tratamientos', 'Revisiones'];

export function ServicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">
            Configura los servicios que ofreces a tus clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del servicio</Label>
                <Input id="name" placeholder="Ej: Consulta inicial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe brevemente el servicio..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input id="duration" type="number" placeholder="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input id="price" type="number" placeholder="50" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Servicio</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.map((category) => {
        const categoryServices = services.filter((s) => s.category === category);
        if (categoryServices.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-medium">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryServices.map((service) => (
                <Card key={service.id} className={!service.active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      {!service.active && (
                        <Badge variant="outline" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDuration(service.duration)}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <DollarSign className="h-4 w-4" />
                        €{service.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
