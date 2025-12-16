import { TripWithDetails } from './trip';

export interface Booking {
  id: string;
  user_id?: string | null;
  trip_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  total_amount: number;
  booking_reference: string;
  contact_email?: string;
  contact_phone?: string;
  booked_at: string;
  expires_at?: string | null;
}

export interface PassengerDetail {
  id: string;
  booking_id: string;
  full_name: string;
  document_id?: string | null;
  seat_code: string;
  phone?: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: 'cash' | 'bank_transfer' | 'momo' | 'vnpay';
  transaction_ref?: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  processed_at?: string | null;
}

export interface BookingWithDetails extends Booking {
  passengers?: PassengerDetail[];
  payment?: Payment | null;
  trip_info?: TripWithDetails | null;
}
