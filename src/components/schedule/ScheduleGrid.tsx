import { useMemo } from 'react';
import { Booking, ROOMS, RoomType, TIME_SLOTS, getRoomLabel } from '@/types/booking';
import { formatTime } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScheduleGridProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export const ScheduleGrid = ({ bookings, isLoading }: ScheduleGridProps) => {
  const timeSlots = TIME_SLOTS.slice(0, -1); // 08:00 to 15:00 (start times only)

  const getBookingForSlot = (room: RoomType, time: string): Booking | undefined => {
    return bookings.find((booking) => {
      const bookingStart = formatTime(booking.start_time);
      const bookingEnd = formatTime(booking.end_time);
      return (
        booking.room === room &&
        time >= bookingStart &&
        time < bookingEnd
      );
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-[100px_repeat(8,1fr)] gap-1">
          <div className="h-10" />
          {timeSlots.map((time) => (
            <div key={time} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
        {ROOMS.map((room) => (
          <div key={room.value} className="grid grid-cols-[100px_repeat(8,1fr)] gap-1">
            <div className="h-14 rounded-md bg-muted animate-pulse" />
            {timeSlots.map((time) => (
              <div key={time} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-max">
          {/* Header Row */}
          <div
            className="grid gap-1 mb-2"
            style={{
              gridTemplateColumns: `150px repeat(${timeSlots.length}, minmax(80px, 1fr))`
            }}
          >
            <div className="p-2 text-sm font-medium text-muted-foreground sticky left-0 bg-background z-10 shadow-sm border-r">Ruang</div>
            {timeSlots.map((time) => (
              <div
                key={time}
                className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-md whitespace-nowrap"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Room Rows */}
          {ROOMS.map((room, roomIndex) => (
            <div
              key={room.value}
              className="grid gap-1 mb-1"
              style={{
                gridTemplateColumns: `150px repeat(${timeSlots.length}, minmax(80px, 1fr))`,
                animationDelay: `${roomIndex * 100}ms`
              }}
            >
              <div className="p-3 text-sm font-medium bg-card rounded-md border border-border flex items-center sticky left-0 z-10 shadow-sm">
                {room.label}
              </div>
              {timeSlots.map((time) => {
                const booking = getBookingForSlot(room.value, time);
                const isBooked = !!booking;

                return (
                  <Tooltip key={time}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'time-slot flex flex-col items-center justify-center min-h-[56px] rounded-md transition-all duration-200 p-1',
                          isBooked
                            ? 'time-slot-booked bg-destructive/15 border border-destructive/20'
                            : 'time-slot-available bg-success/15 border border-success/20 hover:bg-success/25'
                        )}
                      >
                        <span className={cn(
                          'text-xs font-bold block mb-0.5',
                          isBooked ? 'text-destructive' : 'text-success'
                        )}>
                          {isBooked ? 'Terisi' : 'Tersedia'}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {isBooked && booking && (
                      <TooltipContent side="top" className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">{booking.booker_name}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded">{booking.department}</span>
                            <span className="bg-muted px-1.5 py-0.5 rounded">{booking.participant_count} Org</span>
                          </div>
                          <p className="text-xs font-mono bg-accent/50 px-2 py-1 rounded mt-1">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </p>
                          {booking.notes && (
                            <p className="text-xs italic text-muted-foreground border-t pt-1 mt-1">"{booking.notes}"</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
          <span className="text-sm text-muted-foreground">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
          <span className="text-sm text-muted-foreground">Terisi</span>
        </div>
      </div>
    </TooltipProvider>
  );
};
