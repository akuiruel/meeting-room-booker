import { useState, useEffect } from 'react';
import { getTimeUntilBookingOpens, isBookingWindowOpen } from '@/lib/dateUtils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  onWindowOpen?: () => void;
}

export const CountdownTimer = ({ onWindowOpen }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilBookingOpens());
  const [isOpen, setIsOpen] = useState(isBookingWindowOpen());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeUntilBookingOpens();
      setTimeRemaining(remaining);
      
      const windowOpen = isBookingWindowOpen();
      if (windowOpen && !isOpen) {
        setIsOpen(true);
        onWindowOpen?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onWindowOpen]);

  if (isOpen || !timeRemaining) {
    return null;
  }

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
      <Clock className="h-5 w-5 animate-pulse-slow" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          Booking untuk besok akan dibuka dalam:
        </p>
        <p className="text-2xl font-bold font-mono mt-1">
          {pad(timeRemaining.hours)}:{pad(timeRemaining.minutes)}:{pad(timeRemaining.seconds)}
        </p>
      </div>
    </div>
  );
};
