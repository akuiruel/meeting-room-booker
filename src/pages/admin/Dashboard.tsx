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
  LayoutDashboard,
  Home,
  LogOut,
  MoreVertical,
  Search,
  FileText,
  Download,
  Filter
} from 'lucide-react'; // Fallback icons if material symbols fail, but we prioritize material classes

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ROOMS, DEPARTMENTS, getRoomLabel, Booking } from '@/types/booking';
import { formatDate, formatTime, getTodayDateString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

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
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Laporan Booking Ruang Diskusi', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, 30);
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
    <div className="flex h-screen overflow-hidden bg-slate-50/50 font-display">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/80 flex-shrink-0 z-30 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-1 ring-white/20">
              <span className="material-symbols-outlined text-white text-xl">calendar_month</span>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block leading-none">RuangBook</span>
              <span className="text-[10px] font-semibold text-primary-600 tracking-wider uppercase">Premium</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-8 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Menu Utama</div>
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border-r-4 border-primary-600 transition-all group relative overflow-hidden">
            <span className="material-symbols-outlined text-primary-700">dashboard</span>
            <span className="font-semibold text-primary-800">Dashboard</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 px-8 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-primary-700 transition-all duration-200 group relative">
            <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover:bg-slate-200 rounded-r-full transition-colors"></div>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">home</span>
            <span className="font-medium">Kembali ke Beranda</span>
          </Link>
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4 rounded-xl shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">AD</div>
              <div>
                <p className="text-sm font-bold text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors group border border-transparent hover:border-red-100">
            <span className="material-symbols-outlined group-hover:text-red-500 transition-colors">logout</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative bg-[#F8FAFC] bg-subtle-grid">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-white/60 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm text-slate-500 font-medium">Real-time update statistics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all shadow-sm hover:shadow-md">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-95 ring-1 ring-white/20">
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        <div className="px-8 py-8 space-y-8 max-w-[1600px] mx-auto pb-20">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group relative overflow-hidden border border-slate-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-100/50 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner-light border border-primary-200/50">
                  <span className="material-symbols-outlined text-primary-600 text-2xl">calendar_today</span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Booking Hari Ini</h3>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">{todayBookingsCount}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group relative overflow-hidden border border-slate-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100/50 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner-light border border-indigo-200/50">
                  <span className="material-symbols-outlined text-indigo-600 text-2xl">groups</span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Total Booking Aktif</h3>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalConfirmed}</div>
              </div>
            </div>

            {/* Room Usage Stats */}
            {roomStats.map((room) => (
              <div key={room.value} className="bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-slate-700">{room.label}</h3>
                  <div className="p-1 rounded-md bg-slate-50 text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-2xl font-bold text-slate-900">{room.percentage}%</div>
                    <div className="text-xs font-semibold text-slate-400 mb-1.5">Usage</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full shadow-lg shadow-primary-500/50 transition-all duration-500"
                      style={{ width: `${room.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span> {room.count} booking total
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-9xl text-slate-300">bar_chart</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 relative z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <span className="material-symbols-outlined text-lg">monitoring</span>
                  </span>
                  Statistik Penggunaan Bulanan
                </h2>
                <p className="text-sm text-slate-500 mt-1 pl-11">Visualisasi data okupansi ruang diskusi</p>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {ROOMS.map((room, index) => (
                    <Bar
                      key={room.value}
                      dataKey={room.value}
                      name={room.label}
                      fill={index === 0 ? '#3b82f6' : index === 1 ? '#0ea5e9' : '#6366f1'}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                    <span className="material-symbols-outlined text-[24px]">table_view</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Daftar Booking</h2>
                    <p className="text-sm text-slate-500">Menampilkan {filteredBookings.length} booking dari total {bookings.length}</p>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex-1 lg:max-w-3xl">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="md:col-span-5 relative group">
                      <span className="absolute left-3 top-3 material-symbols-outlined text-slate-400 text-[20px] group-focus-within:text-primary-500 transition-colors">search</span>
                      <input
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all placeholder-slate-400 font-medium outline-none"
                        placeholder="Cari nama atau unit..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3 border-l border-slate-100 pl-2">
                      <select
                        className="w-full px-3 py-2.5 bg-transparent border-0 text-sm font-medium text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
                        value={roomFilter}
                        onChange={(e) => setRoomFilter(e.target.value)}
                      >
                        <option value="all">Semua Ruang</option>
                        {ROOMS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 border-l border-slate-100 pl-2">
                      <select
                        className="w-full px-3 py-2.5 bg-transparent border-0 text-sm font-medium text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                      >
                        <option value="all">Semua Unit</option>
                        {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 border-l border-slate-100 pl-2">
                      <select
                        className="w-full px-3 py-2.5 bg-transparent border-0 text-sm font-medium text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Semua Status</option>
                        <option value="confirmed">Aktif</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">No</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Booking</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ruang</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pemohon</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Pax</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr><td colSpan={9} className="text-center py-8">Memuat data...</td></tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8">Tidak ada data booking</td></tr>
                  ) : (
                    filteredBookings.map((booking, index) => {
                      const status = getComputedStatus(booking);
                      return (
                        <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-8 py-5 text-sm text-slate-500 font-medium">{index + 1}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{formatDate(booking.usage_date)}</span>
                              <span className="text-xs text-slate-400 font-medium mt-0.5">{formatDate(booking.booking_date, 'HH:mm')} WIB</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${booking.room === 'diskusi-1' ? 'bg-primary-500' :
                                  booking.room === 'diskusi-2' ? 'bg-teal-500' : 'bg-indigo-500'
                                }`}></span>
                              <span className="text-sm font-semibold text-slate-700">{getRoomLabel(booking.room)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white shadow-sm">
                                {booking.booker_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">{booking.booker_name}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{booking.department}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg text-slate-600">
                              {booking.department}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-700 font-medium font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-700 text-center font-bold">{booking.participant_count}</td>
                          <td className="px-6 py-5 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border",
                              status === 'confirmed' ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                                status === 'completed' ? "text-blue-700 bg-blue-50 border-blue-100" :
                                  "text-rose-600 bg-rose-50 border-rose-100"
                            )}>
                              {status === 'confirmed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {status === 'confirmed' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                    <span className="material-symbols-outlined text-xl">more_vert</span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedBooking(booking); setCancelDialogOpen(true); }} className="text-destructive">
                                    Batalkan
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Booking?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-red-600 hover:bg-red-700">Ya, Batalkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
