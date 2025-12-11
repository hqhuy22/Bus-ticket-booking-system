export interface Trip {
  id: string;
  route_id?: string | null;
  bus_id?: string | null;
  departure_time?: string;
  arrival_time?: string;
  base_price?: number;
  status?: string;
}

// Placeholders for related objects. Consumers can narrow these types as needed.
export interface RouteInfo {
  id: string;
  origin: string;
  destination: string;
  distance_km?: number;
  estimated_minutes?: number;
}

export interface BusInfo {
  id: string;
  plate_number?: string;
  model?: string;
  seat_capacity?: number;
}

export interface TripWithDetails extends Trip {
  route_info?: RouteInfo | null;
  bus_info?: BusInfo | null;
  available_seats?: number;
}
