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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Helper to determine real-time status
  const getComputedStatus = (booking: Booking): 'confirmed' | 'cancelled' | 'completed' => {
    if (booking.status === 'cancelled') return 'cancelled';
    const now = new Date();
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

    // Date Range Filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && booking.usage_date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && booking.usage_date <= endDate;
    }

    return matchesSearch && matchesRoom && matchesDepartment && matchesStatus && matchesDate;
  });

  // Statistics (tetap global, tidak terpengaruh filter tanggal untuk gambaran umum, atau mau ikut filter? 
  // Biasanya overview dashboard itu hari ini/global. Kita biarkan global dulu untuk stats cards, 
  // tapi export mengikuti filteredBookings).

  const todayBookingsCount = bookings.filter(
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

  // Chart Data (ikut filtered atau global? Biasanya global untuk overview. Kita biarkan global)
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
    const headers = ['No', 'Tanggal Booking', 'Tanggal Penggunaan', 'Ruang', 'Nama', 'Unit Kerja', 'Jam', 'Peserta', 'Status', 'Catatan'];
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
        booking.notes || '-'
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Modern Blue Theme Config
    const bluePrimary = [37, 99, 235]; // blue-600
    const blueLight = [239, 246, 255]; // blue-50
    const textDark = [30, 41, 59];     // slate-800

    // Header Background
    doc.setFillColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Text
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RuangBook Report', 14, 20);

    // Subheader
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 255);
    const periodeInfo = startDate && endDate
      ? `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`
      : 'Periode: Semua Data';
    doc.text(periodeInfo, 14, 30);
    doc.text(`Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 200, 30, { align: 'right' });

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
      startY: 45,
      theme: 'grid',
      headStyles: {
        fillColor: bluePrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 4
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle',
        textColor: textDark
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // No
        1: { cellWidth: 30 }, // Tanggal
        2: { cellWidth: 30 }, // Ruang
        5: { halign: 'center' }, // Jam
        6: { halign: 'center', fontStyle: 'bold' }  // Status
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          const status = data.cell.raw;
          if (status === 'Aktif') {
            data.cell.styles.textColor = [16, 185, 129]; // Emerald Green
          } else if (status === 'Selesai') {
            data.cell.styles.textColor = bluePrimary; // Blue
          } else if (status === 'Dibatalkan') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      },
      alternateRowStyles: {
        fillColor: blueLight
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('RuangBook - Sistem Booking Ruang Diskusi', 14, 287);
      doc.text(`Halaman ${i} dari ${pageCount}`, 200, 287, { align: 'right' });
    }

    doc.save(`RuangBook-Report-${startDate || 'all'}-${endDate || 'all'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-display">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-blue-600 text-white hidden lg:flex flex-col shadow-xl">
        <div className="flex h-20 items-center gap-3 px-6 border-b border-blue-500/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">RuangBook</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-4 mt-2">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 bg-white/10 text-white font-bold hover:bg-white/20 rounded-xl transition-all shadow-sm ring-1 ring-white/5">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 text-blue-100 hover:text-white hover:bg-blue-500/50 rounded-xl transition-all">
              <Home className="h-5 w-5" />
              Kembali ke Beranda
            </Button>
          </Link>
        </nav>

        <div className="p-6 border-t border-blue-500/30">
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 text-blue-100 hover:text-white hover:bg-red-500/20 hover:ring-1 hover:ring-red-400/50 rounded-xl transition-all" onClick={signOut}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 mt-1 font-medium">Kelola semua booking ruang diskusi dengan mudah</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToPDF} className="gap-2 hidden sm:flex border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold h-10 px-5">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={exportToCSV} className="gap-2 hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-5 shadow-lg shadow-blue-600/20">
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>

              {/* Mobile Menu Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden border-blue-200 text-blue-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF}>Export PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV}>Export CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-slate-600">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center cursor-pointer p-3">
                      <Home className="h-4 w-4 mr-3" /> Kembali ke Beranda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer p-3">
                    <LogOut className="h-4 w-4 mr-3" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
            {/* Booking Hari Ini - Blue Gradient */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 text-white group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-100">Booking Hari Ini</span>
                </div>
                <div className="text-4xl font-extrabold tracking-tight">{todayBookingsCount}</div>
              </div>
            </div>

            {/* Total Booking Aktif - Cyan Gradient */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/20 text-white group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-cyan-50">Total Booking Aktif</span>
                </div>
                <div className="text-4xl font-extrabold tracking-tight">{totalConfirmed}</div>
              </div>
            </div>

            {/* Room Stats - Dynamic Gradients */}
            {roomStats.map((room, index) => {
              // Define gradients based on index
              const gradients = [
                'from-purple-500 to-purple-700 shadow-purple-500/20', // Room 1
                'from-indigo-500 to-indigo-700 shadow-indigo-500/20', // Room 2
                'from-sky-400 to-sky-600 shadow-sky-500/20'           // Room 3
              ];
              const currentGradient = gradients[index % gradients.length];

              return (
                <div key={room.value} className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${currentGradient} shadow-lg text-white group hover:scale-[1.02] transition-transform duration-300`}>
                  <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="absolute bottom-0 right-0 -mb-6 -mr-6 h-32 w-32 rounded-full bg-white/5 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/90">{room.label}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-extrabold tracking-tight">{room.percentage}%</div>
                      <div className="text-sm font-medium text-white/70 mb-1.5">Terpakai</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              {/* Search & Filters */}
              <div className="flex-1 lg:max-w-3xl">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <div className="md:col-span-12 lg:col-span-4 relative group">
                      <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-slate-400 font-medium outline-none"
                        placeholder="Cari nama atau unit..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Date Filters - Integrated into the grid or separate row depending on space? Let's keep them here for now but clearer */}
                    <div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Room Filter */}
                      <Select value={roomFilter} onValueChange={setRoomFilter}>
                        <SelectTrigger className="w-full border-0 bg-slate-50 rounded-2xl px-4 py-6 h-auto text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                          <SelectValue placeholder="Semua Ruang" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="all">Semua Ruang</SelectItem>
                          {ROOMS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* Unit Filter */}
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full border-0 bg-slate-50 rounded-2xl px-4 py-6 h-auto text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                          <SelectValue placeholder="Semua Unit" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="all">Semua Unit</SelectItem>
                          {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full border-0 bg-slate-50 rounded-2xl px-4 py-6 h-auto text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="confirmed">Aktif</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Range - Separate Row for clarity */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4 group focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500">Mulai</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-transparent border-none text-sm p-0 focus:ring-0 text-slate-700 font-medium"
                      />
                    </div>
                    <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4 group focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-blue-500">Sampai</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-transparent border-none text-sm p-0 focus:ring-0 text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>
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
                  <TableHeader className="bg-blue-600 hover:bg-blue-600 border-none">
                    <TableRow className="hover:bg-blue-600 border-none">
                      <TableHead className="w-12 text-white font-bold h-12 uppercase first:rounded-tl-2xl pl-6">No</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Tanggal Booking</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Tanggal Penggunaan</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Ruang</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Nama</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Unit Kerja</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Jam</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Peserta</TableHead>
                      <TableHead className="text-white font-bold h-12 uppercase">Status</TableHead>
                      <TableHead className="w-12 text-white font-bold h-12 uppercase last:rounded-tr-2xl"></TableHead>
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
