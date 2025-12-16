import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
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
  FileText
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

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.booker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoom = roomFilter === 'all' || booking.room === roomFilter;
    const matchesDepartment = departmentFilter === 'all' || booking.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
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

  const handleCancelBooking = async () => {
    if (selectedBooking) {
      await cancelBooking.mutateAsync(selectedBooking.id);
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['No', 'Tanggal Booking', 'Tanggal Penggunaan', 'Ruang', 'Nama', 'Unit Kerja', 'Jam', 'Peserta', 'Status'];
    const rows = filteredBookings.map((booking, index) => [
      index + 1,
      formatDate(booking.booking_date, 'dd/MM/yyyy HH:mm'),
      formatDate(booking.usage_date),
      getRoomLabel(booking.room),
      booking.booker_name,
      booking.department,
      `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
      booking.participant_count,
      booking.status === 'confirmed' ? 'Aktif' : 'Dibatalkan',
    ]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">RuangBook Admin</span>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          <Link to="/admin/dashboard">
            <Button variant="secondary" className="w-full justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Kelola semua booking ruang diskusi</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportToCSV} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="ghost" className="lg:hidden" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
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
                      filteredBookings.map((booking, index) => (
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
                              variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                              className={
                                booking.status === 'confirmed'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-muted text-muted-foreground'
                              }
                            >
                              {booking.status === 'confirmed' ? 'Aktif' : 'Dibatalkan'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booking.status === 'confirmed' && (
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
                      ))
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
