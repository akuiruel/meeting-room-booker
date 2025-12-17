import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { Booking, BookingFormData, RoomType } from '@/types/booking';
import { getTodayDateString, getTomorrowDateString } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

const BOOKINGS_COLLECTION = 'bookings';

// Helper to convert Firestore doc to Booking
const docToBooking = (doc: any): Booking => {
  const data = doc.data();
  return {
    id: doc.id,
    booking_date: data.booking_date,
    usage_date: data.usage_date,
    room: data.room,
    booker_name: data.booker_name,
    department: data.department,
    participant_count: data.participant_count,
    start_time: data.start_time,
    end_time: data.end_time,
    notes: data.notes,
    status: data.status,
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
  };
};

export const useBookings = (date?: string) => {
  return useQuery({
    queryKey: ['bookings', date],
    queryFn: async () => {
      let q;

      if (date) {
        q = query(
          collection(db, BOOKINGS_COLLECTION),
          where('status', '==', 'confirmed'),
          where('usage_date', '==', date),
          orderBy('start_time', 'asc')
        );
      } else {
        q = query(
          collection(db, BOOKINGS_COLLECTION),
          where('status', '==', 'confirmed'),
          orderBy('usage_date', 'asc'),
          orderBy('start_time', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToBooking);
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
      const q = query(
        collection(db, BOOKINGS_COLLECTION),
        orderBy('usage_date', 'desc'),
        orderBy('start_time', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToBooking);
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
      // Query bookings for the same date, room, and confirmed status
      const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where('usage_date', '==', date),
        where('room', '==', room),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(q);

      // Check for time conflicts client-side
      const conflicts = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Check if times overlap
        return data.start_time < endTime && data.end_time > startTime;
      });

      return conflicts.length === 0;
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
      const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where('usage_date', '==', data.usage_date),
        where('room', '==', data.room),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(q);

      const conflicts = snapshot.docs.filter(doc => {
        const bookingData = doc.data();
        return bookingData.start_time < data.end_time && bookingData.end_time > data.start_time;
      });

      if (conflicts.length > 0) {
        throw new Error('Ruang sudah dibooking pada jam tersebut');
      }

      // Create the booking
      const today = new Date().toISOString().split('T')[0];

      // Remove undefined values (Firebase doesn't accept undefined)
      const bookingData: Record<string, any> = {
        booker_name: data.booker_name,
        department: data.department,
        participant_count: data.participant_count,
        usage_date: data.usage_date,
        start_time: data.start_time,
        end_time: data.end_time,
        room: data.room,
        booking_date: today,
        status: 'confirmed' as const,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      // Only add notes if it has a value
      if (data.notes !== undefined && data.notes !== '') {
        bookingData.notes = data.notes;
      }

      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingData);

      return {
        id: docRef.id,
        ...bookingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
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
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updated_at: serverTimestamp(),
      });
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });

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
