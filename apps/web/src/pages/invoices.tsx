import { useState } from 'react';
import { Search, Filter, Plus, Download, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const invoices = [
  {
    id: 'FV-2026-001',
    client: 'María García',
    date: '28 Ene 2026',
    dueDate: '28 Feb 2026',
    amount: 125.0,
    status: 'paid',
  },
  {
    id: 'FV-2026-002',
    client: 'Pedro López',
    date: '25 Ene 2026',
    dueDate: '25 Feb 2026',
    amount: 89.0,
    status: 'pending',
  },
  {
    id: 'FV-2026-003',
    client: 'Ana Martínez',
    date: '22 Ene 2026',
    dueDate: '22 Feb 2026',
    amount: 240.0,
    status: 'paid',
  },
  {
    id: 'FV-2026-004',
    client: 'Luis Fernández',
    date: '20 Ene 2026',
    dueDate: '20 Feb 2026',
    amount: 50.0,
    status: 'overdue',
  },
  {
    id: 'FV-2026-005',
    client: 'Carmen Ruiz',
    date: '18 Ene 2026',
    dueDate: '18 Feb 2026',
    amount: 175.0,
    status: 'paid',
  },
  {
    id: 'FV-2026-006',
    client: 'Juan Pérez',
    date: '15 Ene 2026',
    dueDate: '15 Feb 2026',
    amount: 120.0,
    status: 'pending',
  },
  {
    id: 'FV-2025-098',
    client: 'Laura Sánchez',
    date: '28 Dic 2025',
    dueDate: '28 Ene 2026',
    amount: 89.0,
    status: 'paid',
  },
  {
    id: 'FV-2025-097',
    client: 'Carlos Ruiz',
    date: '20 Dic 2025',
    dueDate: '20 Ene 2026',
    amount: 150.0,
    status: 'overdue',
  },
];

const statusConfig = {
  paid: { label: 'Pagada', className: 'border-secondary text-secondary bg-secondary/10' },
  pending: { label: 'Pendiente', className: 'border-amber-500 text-amber-600 bg-amber-500/10' },
  overdue: { label: 'Vencida', className: 'border-destructive text-destructive bg-destructive/10' },
};

export function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = invoices
    .filter((i) => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas y pagos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pendiente</p>
            <p className="text-2xl font-bold text-amber-600">€{totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Cobrado (Mes)</p>
            <p className="text-2xl font-bold text-secondary">€{totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Facturas Este Mes</p>
            <p className="text-2xl font-bold">{invoices.filter(i => i.date.includes('2026')).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.date}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.dueDate}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        statusConfig[invoice.status as keyof typeof statusConfig].className
                      )}
                    >
                      {statusConfig[invoice.status as keyof typeof statusConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver factura
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
