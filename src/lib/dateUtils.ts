import { format, addDays, isAfter, isBefore, parseISO, startOfDay, setHours, setMinutes } from 'date-fns';
import { id } from 'date-fns/locale';

export const BOOKING_CUTOFF_HOUR = 15;
export const BOOKING_CUTOFF_MINUTE = 30;

export const formatDate = (date: Date | string, formatStr: string = 'dd MMMM yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: id });
};

export const formatTime = (time: string): string => {
  return time.slice(0, 5);
};

export const getToday = (): Date => {
  return startOfDay(new Date());
};

export const getTomorrow = (): Date => {
  return startOfDay(addDays(new Date(), 1));
};

export const getTomorrowDateString = (): string => {
  return format(getTomorrow(), 'yyyy-MM-dd');
};

export const getTodayDateString = (): string => {
  return format(getToday(), 'yyyy-MM-dd');
};

export const isBookingWindowOpen = (): boolean => {
  const now = new Date();
  const cutoffTime = setMinutes(setHours(startOfDay(now), BOOKING_CUTOFF_HOUR), BOOKING_CUTOFF_MINUTE);
  return isAfter(now, cutoffTime) || format(now, 'HH:mm') === `${BOOKING_CUTOFF_HOUR}:${BOOKING_CUTOFF_MINUTE}`;
};

export const getTimeUntilBookingOpens = (): { hours: number; minutes: number; seconds: number } | null => {
  const now = new Date();
  const cutoffTime = setMinutes(setHours(startOfDay(now), BOOKING_CUTOFF_HOUR), BOOKING_CUTOFF_MINUTE);
  
  if (isAfter(now, cutoffTime)) {
    return null;
  }
  
  const diff = cutoffTime.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
};

export const isValidBookingDate = (date: Date): boolean => {
  const tomorrow = getTomorrow();
  const today = getToday();
  
  // Allow today's booking if within operating hours and tomorrow's booking
  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < 16; // Can book today if before 4 PM
  }
  
  return format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
};

export const isTimeSlotPast = (date: string, time: string): boolean => {
  const today = getTodayDateString();
  if (date !== today) return false;
  
  const now = new Date();
  const [hours] = time.split(':').map(Number);
  return hours <= now.getHours();
};
