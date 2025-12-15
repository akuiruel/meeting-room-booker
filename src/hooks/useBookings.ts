import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingFormData, RoomType } from '@/types/booking';
import { getTodayDateString, getTomorrowDateString } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

export const useBookings = (date?: string) => {
  return useQuery({
    queryKey: ['bookings', date],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .order('usage_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (date) {
        query = query.eq('usage_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useTodayBookings = () => {
  return useBookings(getTodayDateString());
};

export const useTomorrowBookings = () => {
  return useBookings(getTomorrowDateString());
};

export const useAllBookings = () => {
  return useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('usage_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useCheckAvailability = (
  date: string,
  startTime: string,
  endTime: string,
  room: RoomType
) => {
  return useQuery({
    queryKey: ['availability', date, startTime, endTime, room],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('usage_date', date)
        .eq('room', room)
        .eq('status', 'confirmed')
        .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

      if (error) throw error;
      return data.length === 0;
    },
    enabled: !!date && !!startTime && !!endTime && !!room,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Check for conflicts first
      const { data: conflicts, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('usage_date', data.usage_date)
        .eq('room', data.room)
        .eq('status', 'confirmed')
        .or(`and(start_time.lt.${data.end_time},end_time.gt.${data.start_time})`);

      if (checkError) throw checkError;
      if (conflicts && conflicts.length > 0) {
        throw new Error('Ruang sudah dibooking pada jam tersebut');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{
          ...data,
          status: 'confirmed' as const,
        }])
        .select()
        .single();

      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Berhasil!',
        description: 'Ruang diskusi telah berhasil dibooking.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' as const })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Dibatalkan',
        description: 'Booking telah berhasil dibatalkan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membatalkan Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
