import { useState } from 'react';
import { Calendar, Users, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { CountdownTimer } from '@/components/schedule/CountdownTimer';
import { BookingForm } from '@/components/booking/BookingForm';
import { useTodayBookings, useTomorrowBookings } from '@/hooks/useBookings';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { formatDate, getToday, getTomorrow, isBookingWindowOpen } from '@/lib/dateUtils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('today');
  const { data: todayBookings = [], isLoading: todayLoading } = useTodayBookings();
  const { data: tomorrowBookings = [], isLoading: tomorrowLoading } = useTomorrowBookings();
  
  useRealtimeBookings();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Calendar className="h-4 w-4" />
              Sistem Booking Ruang Diskusi
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Booking Ruang Diskusi
              <span className="block gradient-text">Lebih Mudah & Cepat</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Kelola reservasi 3 ruang diskusi dengan mudah. Cek ketersediaan real-time dan booking langsung dalam hitungan detik.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="gap-2" onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}>
                Booking Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' })}>
                Lihat Jadwal
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-12 border-b border-border">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: '3 Ruang Tersedia', desc: 'Ruang Diskusi 1, 2, dan 3 siap digunakan' },
              { icon: Clock, title: 'Jam 08:00 - 16:00', desc: 'Tersedia setiap hari kerja' },
              { icon: Users, title: 'Maks 20 Peserta', desc: 'Kapasitas fleksibel per ruang' },
            ].map((item, i) => (
              <Card key={i} className="border-0 bg-muted/50 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-12 lg:py-16">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">Jadwal Ruang Diskusi</h2>
            <p className="text-muted-foreground">Lihat ketersediaan ruang secara real-time</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                  <TabsTrigger value="today">Hari Ini ({formatDate(getToday(), 'dd MMM')})</TabsTrigger>
                  <TabsTrigger value="tomorrow">Besok ({formatDate(getTomorrow(), 'dd MMM')})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="today">
                  <ScheduleGrid bookings={todayBookings} isLoading={todayLoading} />
                </TabsContent>
                
                <TabsContent value="tomorrow">
                  {!isBookingWindowOpen() && (
                    <div className="mb-6">
                      <CountdownTimer />
                    </div>
                  )}
                  <ScheduleGrid bookings={tomorrowBookings} isLoading={tomorrowLoading} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="booking" className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">Form Booking</h2>
              <p className="text-muted-foreground">Isi form berikut untuk memesan ruang diskusi</p>
            </div>

            <Card>
              <CardContent className="p-6 lg:p-8">
                <BookingForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 RuangBook - Sistem Booking Ruang Diskusi</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
