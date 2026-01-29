import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, UserPlus, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/kpi-card';
import { ActivityItem } from '@/components/activity-item';

const kpis = [
  {
    title: 'Citas Hoy',
    value: '12',
    trend: '+2 vs ayer',
    trendUp: true,
    icon: Calendar,
  },
  {
    title: 'Ingresos Mes',
    value: '€4,250',
    trend: '+15% vs mes ant.',
    trendUp: true,
    icon: TrendingUp,
  },
  {
    title: 'Nuevos Clientes',
    value: '8',
    trend: 'Esta semana',
    trendUp: false,
    icon: UserPlus,
  },
];

const activities = [
  {
    title: 'Cita completada: Juan Pérez',
    description: 'Consulta general - 45 min',
    time: 'Hace 10 min',
    type: 'appointment' as const,
  },
  {
    title: 'Factura emitida: #FV-2024-001',
    description: '€125.00 - Ana Martínez',
    time: 'Hace 25 min',
    type: 'invoice' as const,
  },
  {
    title: 'Nuevo cliente registrado',
    description: 'Laura Sánchez - Referido',
    time: 'Hace 1 hora',
    type: 'client' as const,
  },
  {
    title: 'Cita confirmada: Pedro López',
    description: 'Revisión mensual - Mañana 10:00',
    time: 'Hace 2 horas',
    type: 'appointment' as const,
  },
  {
    title: 'Factura pagada: #FV-2024-098',
    description: '€89.00 - Carlos Ruiz',
    time: 'Hace 3 horas',
    type: 'invoice' as const,
  },
];

const upcomingAppointments = [
  { time: '09:00', client: 'María García', service: 'Consulta inicial', duration: '1h' },
  { time: '10:30', client: 'Pedro López', service: 'Seguimiento', duration: '30m' },
  { time: '11:30', client: 'Ana Martínez', service: 'Revisión', duration: '45m' },
  { time: '14:00', client: 'Luis Fernández', service: 'Tratamiento', duration: '1h' },
];

export function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de nuevo, María. Aquí está el resumen de hoy.
          </p>
        </div>
        <Button asChild>
          <Link to="/appointments/new">
            <Calendar className="mr-2 h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Próximas Citas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {upcomingAppointments.map((apt) => (
                <div
                  key={`${apt.time}-${apt.client}`}
                  className="flex items-center gap-4 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-16 shrink-0">
                    <span className="text-sm font-medium">{apt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{apt.client}</p>
                    <p className="text-xs text-muted-foreground">{apt.service}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {apt.duration}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Últimos Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {activities.map((activity, i) => (
                <ActivityItem key={i} {...activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
