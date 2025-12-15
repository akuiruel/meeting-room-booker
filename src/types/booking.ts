export type RoomType = 'ruang_diskusi_1' | 'ruang_diskusi_2' | 'ruang_diskusi_3';
export type DepartmentType = 'IT' | 'HR' | 'Marketing' | 'Finance' | 'Operations';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  booking_date: string;
  usage_date: string;
  room: RoomType;
  booker_name: string;
  department: DepartmentType;
  participant_count: number;
  start_time: string;
  end_time: string;
  notes?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingFormData {
  booker_name: string;
  department: DepartmentType;
  participant_count: number;
  usage_date: string;
  start_time: string;
  end_time: string;
  room: RoomType;
  notes?: string;
}

export const ROOMS: { value: RoomType; label: string }[] = [
  { value: 'ruang_diskusi_1', label: 'Ruang Diskusi 1' },
  { value: 'ruang_diskusi_2', label: 'Ruang Diskusi 2' },
  { value: 'ruang_diskusi_3', label: 'Ruang Diskusi 3' },
];

export const DEPARTMENTS: { value: DepartmentType; label: string }[] = [
  { value: 'IT', label: 'IT' },
  { value: 'HR', label: 'HR' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

export const START_TIMES = TIME_SLOTS.slice(0, -1);
export const END_TIMES = TIME_SLOTS.slice(1);

export const getRoomLabel = (room: RoomType): string => {
  return ROOMS.find(r => r.value === room)?.label || room;
};
