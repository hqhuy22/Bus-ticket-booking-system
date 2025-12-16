export interface SeatTemplate {
  id: string;
  bus_id: string;
  seat_code: string;
  row_number?: number | null;
  column_number?: number | null;
  seat_type?: 'standard' | 'vip' | 'sleeper';
  position?: 'window' | 'aisle' | 'middle' | null;
  price_modifier?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface SeatStatus {
  id: string;
  trip_id: string;
  seat_id: string;
  state?: string;
  booking_id?: string | null;
  locked_until?: string | null;
  lock_owner?: string | null;
}
