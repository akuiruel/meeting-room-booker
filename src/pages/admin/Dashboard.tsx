import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Calendar,
  Download,
  Filter,
  Home,
  LogOut,
  MoreHorizontal,
  Search,
  Users,
  X,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Menu
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAllBookings, useCancelBooking } from '@/hooks/useBookings';
import { ROOMS, DEPARTMENTS, getRoomLabel, Booking, RoomType, DepartmentType } from '@/types/booking';
import { formatDate, formatTime, getTodayDateString } from '@/lib/dateUtils';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { data: bookings = [], isLoading } = useAllBookings();
  const cancelBooking = useCancelBooking();

  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Helper to determine real-time status
  const getComputedStatus = (booking: Booking): 'confirmed' | 'cancelled' | 'completed' => {
    if (booking.status === 'cancelled') return 'cancelled';

    const now = new Date();
    // Create Date object for booking end time
    // ISO string format YYYY-MM-DDTHH:mm is standard
    const bookingEnd = new Date(`${booking.usage_date}T${booking.end_time}`);

    if (now > bookingEnd) return 'completed';
    return 'confirmed';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Aktif';
      case 'cancelled': return 'Dibatalkan';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.booker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoom = roomFilter === 'all' || booking.room === roomFilter;
    const matchesDepartment = departmentFilter === 'all' || booking.department === departmentFilter;

    const computedStatus = getComputedStatus(booking);
    const matchesStatus = statusFilter === 'all' || computedStatus === statusFilter;

    return matchesSearch && matchesRoom && matchesDepartment && matchesStatus;
  });

  // Statistics
  const todayBookings = bookings.filter(
    (b) => b.usage_date === getTodayDateString() && b.status === 'confirmed'
  ).length;

  const totalConfirmed = bookings.filter((b) => b.status === 'confirmed').length;

  const roomStats = ROOMS.map((room) => ({
    ...room,
    count: bookings.filter((b) => b.room === room.value && b.status === 'confirmed').length,
    percentage: totalConfirmed > 0
      ? Math.round((bookings.filter((b) => b.room === room.value && b.status === 'confirmed').length / totalConfirmed) * 100)
      : 0,
  }));

  // Chart Data Grouped by Month
  const monthlyData = useMemo(() => {
    const data: Record<string, any> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    bookings.forEach(booking => {
      if (booking.status === 'confirmed') {
        const date = new Date(booking.usage_date);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

        if (!data[monthKey]) {
          data[monthKey] = { name: monthKey };
          ROOMS.forEach(r => data[monthKey][r.value] = 0);
        }

        data[monthKey][booking.room] = (data[monthKey][booking.room] || 0) + 1;
      }
    });

    // Convert to array and take last 6 months or entries
    return Object.values(data).sort((a: any, b: any) => {
      return new Date(a.name).getTime() - new Date(b.name).getTime();
    }).slice(-6); // Last 6 months
  }, [bookings]);

  const handleCancelBooking = async () => {
    if (selectedBooking) {
      await cancelBooking.mutateAsync(selectedBooking.id);
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['No', 'Tanggal Booking', 'Tanggal Penggunaan', 'Ruang', 'Nama', 'Unit Kerja', 'Jam', 'Peserta', 'Status'];
    const rows = filteredBookings.map((booking, index) => {
      const status = getComputedStatus(booking);
      return [
        index + 1,
        formatDate(booking.booking_date, 'dd/MM/yyyy HH:mm'),
        formatDate(booking.usage_date),
        getRoomLabel(booking.room),
        booking.booker_name,
        booking.department,
        `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
        booking.participant_count,
        getStatusLabel(status),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Laporan Booking Ruang Diskusi', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, 30);

    // Table content
    const tableColumn = ["No", "Tanggal", "Ruang", "Nama", "Unit", "Jam", "Status"];
    const tableRows = filteredBookings.map((booking, index) => {
      const status = getComputedStatus(booking);
      return [
        index + 1,
        formatDate(booking.usage_date),
        getRoomLabel(booking.room),
        booking.booker_name,
        booking.department,
        `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
        getStatusLabel(status),
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    doc.save(`booking-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark hidden lg:block shadow-sm">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-400 text-white shadow-lg shadow-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight">RuangBook</span>
        </div>

        <nav className="flex flex-col gap-2 p-4 mt-2">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 bg-blue-50 dark:bg-blue-900/20 text-primary font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Home className="h-5 w-5" />
              Kembali ke Beranda
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 p-6">
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" onClick={signOut}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="container max-w-7xl mx-auto py-10 px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola semua booking ruang diskusi dengan mudah</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportToPDF} className="gap-2 hidden sm:flex">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToCSV} className="gap-2 hidden sm:flex">
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="sm:hidden">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      Beranda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Booking Hari Ini
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Booking Aktif
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConfirmed}</div>
              </CardContent>
            </Card>
            {roomStats.map((room) => (
              <Card key={room.value}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {room.label}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{room.percentage}%</div>
                  <p className="text-xs text-muted-foreground">{room.count} booking</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Statistics Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Statistik Penggunaan Bulanan</CardTitle>
              <CardDescription>Grafik penggunaan ruang diskusi per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {ROOMS.map((room, index) => (
                      <Bar
                        key={room.value}
                        dataKey={room.value}
                        name={room.label}
                        fill={index === 0 ? '#3b82f6' : index === 1 ? '#06b6d4' : '#8b5cf6'}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau unit kerja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Ruang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Ruang</SelectItem>
                    {ROOMS.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="confirmed">Aktif</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Booking</CardTitle>
              <CardDescription>
                Menampilkan {filteredBookings.length} dari {bookings.length} booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Tanggal Booking</TableHead>
                      <TableHead>Tanggal Penggunaan</TableHead>
                      <TableHead>Ruang</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Peserta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Memuat data...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Tidak ada data booking
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking, index) => {
                        const status = getComputedStatus(booking);
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(booking.booking_date, 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>{formatDate(booking.usage_date)}</TableCell>
                            <TableCell>{getRoomLabel(booking.room)}</TableCell>
                            <TableCell className="font-medium">{booking.booker_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{booking.department}</Badge>
                            </TableCell>
                            <TableCell>
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </TableCell>
                            <TableCell>{booking.participant_count}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  status === 'confirmed' ? 'default' :
                                    status === 'completed' ? 'outline' : 'secondary'
                                }
                                className={
                                  status === 'confirmed'
                                    ? 'bg-success/10 text-success border-success/20'
                                    : status === 'completed'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-muted text-muted-foreground'
                                }
                              >
                                {getStatusLabel(status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {status === 'confirmed' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setCancelDialogOpen(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Batalkan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan booking ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
