import { useState } from 'react';
import { ArrowRight, Settings, CheckCircle } from 'lucide-react';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { CountdownTimer } from '@/components/schedule/CountdownTimer';
import { BookingForm } from '@/components/booking/BookingForm';
import { useTodayBookings, useTomorrowBookings } from '@/hooks/useBookings';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { isBookingWindowOpen } from '@/lib/dateUtils';
import { Link } from 'react-router-dom';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const { data: todayBookings = [], isLoading: todayLoading } = useTodayBookings();
  const { data: tomorrowBookings = [], isLoading: tomorrowLoading } = useTomorrowBookings();

  useRealtimeBookings();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display transition-colors duration-300 antialiased selection:bg-primary selection:text-white min-h-screen">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-glow transform transition-transform hover:scale-105">
                <span className="material-symbols-outlined text-2xl font-bold">calendar_month</span>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white block leading-none">RuangBook</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-1.5 rounded-2xl shadow-sm">
              <a href="#" className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-md transition-all transform hover:scale-[1.02]">Beranda</a>
              <a href="#jadwal" className="px-6 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">Jadwal</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/admin/auth" className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all">
                <Settings className="h-5 w-5" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-sm font-bold mb-8 border border-blue-200 dark:border-blue-800 backdrop-blur-sm shadow-sm">
                <span className="material-symbols-outlined text-lg filled">bolt</span>
                Sistem Booking Cepat & Instan
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                Booking Ruang <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Tanpa Ribet.</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
                Platform manajemen ruang diskusi modern untuk tim Anda. Cek ketersediaan real-time dan amankan ruangan meeting hanya dengan beberapa klik.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a href="#form-booking" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group transform hover:-translate-y-1">
                  <span>Mulai Booking</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#jadwal" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 border border-border-light dark:border-border-dark font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  Cek Jadwal
                </a>
              </div>
            </div>

            <div className="relative animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-[3rem] transform rotate-3 scale-95 blur-xl"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-soft flex flex-col items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">meeting_room</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">3</h3>
                    <p className="text-sm font-medium text-slate-500">Ruangan Aktif</p>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-soft flex flex-col items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300 sm:translate-y-8">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">08-16</h3>
                    <p className="text-sm font-medium text-slate-500">Jam Operasional</p>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-soft flex flex-col items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">groups</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">15+</h3>
                    <p className="text-sm font-medium text-slate-500">Kapasitas Orang</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary to-blue-600 text-white p-6 rounded-3xl shadow-glow flex flex-col justify-center items-start gap-2 transform hover:-translate-y-1 transition-transform duration-300 sm:translate-y-8">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-80">verified_user</span>
                  <h3 className="text-xl font-bold">Siap Pakai</h3>
                  <p className="text-sm text-blue-100">Fasilitas Lengkap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="jadwal" className="py-20 bg-white dark:bg-surface-dark border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Jadwal Ruangan</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Pantau ketersediaan secara real-time</p>
            </div>
            <div className="bg-slate-100 dark:bg-background-dark p-1.5 rounded-2xl inline-flex self-start md:self-auto">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'today'
                    ? 'bg-white dark:bg-surface-dark shadow-sm text-primary dark:text-white border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setActiveTab('tomorrow')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'tomorrow'
                    ? 'bg-white dark:bg-surface-dark shadow-sm text-primary dark:text-white border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                Besok
              </button>
            </div>
          </div>

          <div className="bg-background-light dark:bg-background-dark rounded-3xl p-6 md:p-8 border border-border-light dark:border-border-dark overflow-hidden">
            {activeTab === 'tomorrow' && !isBookingWindowOpen() && (
              <div className="mb-6 flex justify-center">
                <CountdownTimer />
              </div>
            )}

            <ScheduleGrid
              bookings={activeTab === 'today' ? todayBookings : tomorrowBookings}
              isLoading={activeTab === 'today' ? todayLoading : tomorrowLoading}
            />
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="form-booking" className="max-w-6xl mx-auto px-4 sm:px-6 my-24 scroll-mt-28">
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl shadow-blue-900/10 dark:shadow-none border border-slate-100 dark:border-border-dark overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-8 md:p-12 lg:p-16">
            <div className="mb-10">
              <span className="text-primary font-bold tracking-wider uppercase text-xs mb-2 block">Formulir Pemesanan</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Book Ruangan</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Lengkapi data untuk memesan ruang diskusi.</p>
            </div>

            {/* Real Booking Form */}
            <BookingForm />
          </div>

          {/* Tips Sidebar */}
          <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-2xl">tips_and_updates</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 leading-tight">Tips Efisien Menggunakan Ruang Diskusi</h3>
              <ul className="space-y-4 text-blue-100">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-xl mt-0.5 shrink-0" />
                  <span className="text-sm leading-relaxed">Booking H-1 untuk memastikan ketersediaan ruangan favorit Anda.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-xl mt-0.5 shrink-0" />
                  <span className="text-sm leading-relaxed">Pastikan durasi meeting sesuai kebutuhan agar tidak mengganggu jadwal lain.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-xl mt-0.5 shrink-0" />
                  <span className="text-sm leading-relaxed">Jaga kebersihan ruangan setelah digunakan untuk kenyamanan bersama.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-border-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">RuangBook</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2024 RuangBook System. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
