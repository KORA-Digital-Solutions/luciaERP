import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { NewAppointmentModal } from '@/components/new-appointment-modal';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

// Sample appointments data
const appointments = [
  { id: 1, day: 0, startHour: 9, duration: 1, client: 'María García', service: 'Consulta', status: 'confirmed' },
  { id: 2, day: 0, startHour: 11, duration: 1.5, client: 'Pedro López', service: 'Seguimiento', status: 'scheduled' },
  { id: 3, day: 1, startHour: 10, duration: 1, client: 'Ana Martínez', service: 'Revisión', status: 'confirmed' },
  { id: 4, day: 1, startHour: 14, duration: 2, client: 'Luis Fernández', service: 'Tratamiento', status: 'scheduled' },
  { id: 5, day: 2, startHour: 9, duration: 0.75, client: 'Carmen Ruiz', service: 'Consulta', status: 'confirmed' },
  { id: 6, day: 3, startHour: 11, duration: 1, client: 'Juan Pérez', service: 'Control', status: 'scheduled' },
  { id: 7, day: 3, startHour: 15, duration: 1.5, client: 'Laura Sánchez', service: 'Tratamiento', status: 'confirmed' },
  { id: 8, day: 4, startHour: 10, duration: 1, client: 'Carlos Ruiz', service: 'Consulta', status: 'scheduled' },
];

const statusStyles = {
  confirmed: 'bg-secondary/20 border-secondary text-secondary-foreground',
  scheduled: 'bg-primary/20 border-primary text-primary-foreground',
};

export function AppointmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'week' | 'day' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const monthName = currentWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground capitalize">{monthName}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentWeek);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeek(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentWeek);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentWeek(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Día</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Profesional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="maria">María García</SelectItem>
              <SelectItem value="carlos">Carlos López</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="h-full overflow-hidden">
          <div className="grid grid-cols-8 h-full">
            {/* Time Column */}
            <div className="border-r">
              <div className="h-14 border-b" /> {/* Empty header cell */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b px-3 py-1 text-xs text-muted-foreground"
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayAppointments = appointments.filter((apt) => apt.day === dayIndex);

              return (
                <div key={dayIndex} className="border-r last:border-r-0 relative">
                  {/* Day Header */}
                  <div
                    className={cn(
                      'h-14 border-b flex flex-col items-center justify-center',
                      isToday && 'bg-primary/5'
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{days[dayIndex]}</span>
                    <span
                      className={cn(
                        'text-lg font-medium',
                        isToday && 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center'
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Time Slots */}
                  <div className="relative">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className={cn('h-16 border-b', isToday && 'bg-primary/5')}
                      />
                    ))}

                    {/* Appointments */}
                    {dayAppointments.map((apt) => {
                      const top = (apt.startHour - 8) * 64; // 64px per hour (h-16)
                      const height = apt.duration * 64;

                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            'absolute left-1 right-1 rounded-md border-l-4 p-2 cursor-pointer hover:opacity-90 transition-opacity',
                            statusStyles[apt.status as keyof typeof statusStyles]
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <p className="text-xs font-medium truncate">{apt.client}</p>
                          <p className="text-xs opacity-80 truncate">{apt.service}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <NewAppointmentModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
