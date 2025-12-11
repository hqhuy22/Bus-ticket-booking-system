export interface Route {
  id: string;
  operator_id?: string | null;
  origin: string;
  destination: string;
  distance_km?: number;
  estimated_minutes?: number;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_name: string;
  stop_order: number;
  pickup_time_offset?: number;
  stop_type?: 'pickup' | 'dropoff' | 'both';
  is_active?: boolean;
  created_at?: string;
}
