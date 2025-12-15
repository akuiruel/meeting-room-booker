import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Users, Building2, Clock, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCreateBooking } from '@/hooks/useBookings';
import { BookingFormData, ROOMS, DEPARTMENTS, START_TIMES, END_TIMES, getRoomLabel, DepartmentType, RoomType } from '@/types/booking';
import { getTomorrow, getTodayDateString, getTomorrowDateString, isBookingWindowOpen, formatDate } from '@/lib/dateUtils';

const bookingSchema = z.object({
  booker_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  department: z.enum(['IT', 'HR', 'Marketing', 'Finance', 'Operations'], {
    required_error: 'Pilih unit kerja',
  }),
  participant_count: z.coerce.number().min(1, 'Minimal 1 peserta').max(20, 'Maksimal 20 peserta'),
  usage_date: z.string({ required_error: 'Pilih tanggal' }),
  start_time: z.string({ required_error: 'Pilih jam mulai' }),
  end_time: z.string({ required_error: 'Pilih jam selesai' }),
  room: z.enum(['ruang_diskusi_1', 'ruang_diskusi_2', 'ruang_diskusi_3'], {
    required_error: 'Pilih ruang diskusi',
  }),
  notes: z.string().max(500, 'Keterangan maksimal 500 karakter').optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: 'Jam selesai harus setelah jam mulai',
  path: ['end_time'],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export const BookingForm = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<BookingFormValues | null>(null);
  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      booker_name: '',
      participant_count: 1,
      usage_date: getTomorrowDateString(),
      notes: '',
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;

    await createBooking.mutateAsync({
      booker_name: formData.booker_name,
      department: formData.department,
      participant_count: formData.participant_count,
      usage_date: formData.usage_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room,
      notes: formData.notes || undefined,
    });

    setShowConfirmation(false);
    form.reset();
  };

  const selectedDate = form.watch('usage_date');
  const isWindowOpen = isBookingWindowOpen();

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Pembooking */}
            <FormField
              control={form.control}
              name="booker_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nama Pembooking
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Kerja */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Unit Kerja
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit kerja" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jumlah Peserta */}
            <FormField
              control={form.control}
              name="participant_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Jumlah Peserta
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="1-20 peserta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tanggal Penggunaan */}
            <FormField
              control={form.control}
              name="usage_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Tanggal Penggunaan
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? formatDate(field.value, 'dd MMMM yyyy')
                            : 'Pilih tanggal'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, 'yyyy-MM-dd'));
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const tomorrow = addDays(today, 1);
                          return date < today || date > tomorrow;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jam Mulai */}
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Jam Mulai
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jam mulai" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {START_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jam Selesai */}
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Jam Selesai
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jam selesai" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {END_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Ruang Pilihan */}
          <FormField
            control={form.control}
            name="room"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Ruang Diskusi</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                  >
                    {ROOMS.map((room) => (
                      <div key={room.value}>
                        <RadioGroupItem
                          value={room.value}
                          id={room.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={room.value}
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <span className="text-sm font-medium">{room.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Keterangan */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Keterangan (Opsional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tambahkan catatan jika diperlukan..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? 'Memproses...' : 'Booking Sekarang'}
          </Button>
        </form>
      </Form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Booking</DialogTitle>
            <DialogDescription>
              Periksa kembali detail booking Anda sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama</p>
                  <p className="font-medium">{formData.booker_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit Kerja</p>
                  <p className="font-medium">{formData.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ruang</p>
                  <p className="font-medium">{getRoomLabel(formData.room)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peserta</p>
                  <p className="font-medium">{formData.participant_count} orang</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(formData.usage_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Waktu</p>
                  <p className="font-medium">{formData.start_time} - {formData.end_time}</p>
                </div>
              </div>
              {formData.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Keterangan</p>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={createBooking.isPending}>
              {createBooking.isPending ? 'Memproses...' : 'Konfirmasi Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
