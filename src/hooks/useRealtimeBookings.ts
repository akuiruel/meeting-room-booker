import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export const useRealtimeBookings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time listener for bookings collection
    const q = query(collection(db, 'bookings'));

    const unsubscribe = onSnapshot(q, () => {
      // Invalidate all booking queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }, (error) => {
      console.error('Error listening to bookings:', error);
    });

    return () => unsubscribe();
  }, [queryClient]);
};
