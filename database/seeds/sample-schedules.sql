-- =====================================================
-- Seed: Sample Bus Schedules
-- Description: Sample bus schedules for testing
-- Date: 2026-01-03
-- =====================================================

-- Insert sample schedules for the next 7 days
DO $$
DECLARE
  day_offset INTEGER;
  schedule_date DATE;
  bus_record RECORD;
  route_record RECORD;
  schedule_counter INTEGER := 0;
BEGIN
  -- Loop through next 7 days
  FOR day_offset IN 0..6 LOOP
    schedule_date := CURRENT_DATE + day_offset;
    
    -- Ho Chi Minh - Da Nang schedules (Route 102)
    SELECT * INTO route_record FROM routes WHERE "routeNo" = 102;
    
    -- Morning departure with BUS001
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS001';
    INSERT INTO bus_schedules (
      "routeNo", "busId", "routeId",
      "departure_city", "departure_date", "departure_time",
      "arrival_city", "arrival_date", "arrival_time",
      duration, "busType", model,
      "busScheduleID", "depotName",
      "bookingClosingDate", "bookingClosingTime",
      price, "availableSeats", status,
      "createdAt", "updatedAt"
    ) VALUES (
      route_record."routeNo", bus_record.id, route_record.id,
      route_record.origin, schedule_date, '08:00',
      route_record.destination, schedule_date, '02:00',
      route_record."estimatedDuration", bus_record."busType", bus_record.model,
      'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-102-0800',
      bus_record."depotName",
      schedule_date, '07:00',
      450000, bus_record."totalSeats", 'Scheduled',
      NOW(), NOW()
    );
    schedule_counter := schedule_counter + 1;
    
    -- Evening departure with BUS002
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS002';
    INSERT INTO bus_schedules (
      "routeNo", "busId", "routeId",
      "departure_city", "departure_date", "departure_time",
      "arrival_city", "arrival_date", "arrival_time",
      duration, "busType", model,
      "busScheduleID", "depotName",
      "bookingClosingDate", "bookingClosingTime",
      price, "availableSeats", status,
      "createdAt", "updatedAt"
    ) VALUES (
      route_record."routeNo", bus_record.id, route_record.id,
      route_record.origin, schedule_date, '20:00',
      route_record.destination, schedule_date + 1, '14:00',
      route_record."estimatedDuration", bus_record."busType", bus_record.model,
      'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-102-2000',
      bus_record."depotName",
      schedule_date, '19:00',
      480000, bus_record."totalSeats", 'Scheduled',
      NOW(), NOW()
    );
    schedule_counter := schedule_counter + 1;
    
    -- Ho Chi Minh - Nha Trang schedules (Route 201)
    SELECT * INTO route_record FROM routes WHERE "routeNo" = 201;
    
    -- Morning departure with BUS004
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS004';
    INSERT INTO bus_schedules (
      "routeNo", "busId", "routeId",
      "departure_city", "departure_date", "departure_time",
      "arrival_city", "arrival_date", "arrival_time",
      duration, "busType", model,
      "busScheduleID", "depotName",
      "bookingClosingDate", "bookingClosingTime",
      price, "availableSeats", status,
      "createdAt", "updatedAt"
    ) VALUES (
      route_record."routeNo", bus_record.id, route_record.id,
      route_record.origin, schedule_date, '07:00',
      route_record.destination, schedule_date, '16:00',
      route_record."estimatedDuration", bus_record."busType", bus_record.model,
      'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-201-0700',
      bus_record."depotName",
      schedule_date, '06:00',
      280000, bus_record."totalSeats", 'Scheduled',
      NOW(), NOW()
    );
    schedule_counter := schedule_counter + 1;
    
    -- Night departure with BUS003
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS003';
    INSERT INTO bus_schedules (
      "routeNo", "busId", "routeId",
      "departure_city", "departure_date", "departure_time",
      "arrival_city", "arrival_date", "arrival_time",
      duration, "busType", model,
      "busScheduleID", "depotName",
      "bookingClosingDate", "bookingClosingTime",
      price, "availableSeats", status,
      "createdAt", "updatedAt"
    ) VALUES (
      route_record."routeNo", bus_record.id, route_record.id,
      route_record.origin, schedule_date, '22:00',
      route_record.destination, schedule_date + 1, '07:00',
      route_record."estimatedDuration", bus_record."busType", bus_record.model,
      'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-201-2200',
      bus_record."depotName",
      schedule_date, '21:00',
      320000, bus_record."totalSeats", 'Scheduled',
      NOW(), NOW()
    );
    schedule_counter := schedule_counter + 1;
    
    -- Ho Chi Minh - Vung Tau schedules (Route 202)
    SELECT * INTO route_record FROM routes WHERE "routeNo" = 202;
    
    -- Multiple daily departures with BUS006
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS006';
    
    FOR hour_offset IN 0..2 LOOP
      INSERT INTO bus_schedules (
        "routeNo", "busId", "routeId",
        "departure_city", "departure_date", "departure_time",
        "arrival_city", "arrival_date", "arrival_time",
        duration, "busType", model,
        "busScheduleID", "depotName",
        "bookingClosingDate", "bookingClosingTime",
        price, "availableSeats", status,
        "createdAt", "updatedAt"
      ) VALUES (
        route_record."routeNo", bus_record.id, route_record.id,
        route_record.origin, schedule_date, LPAD((8 + hour_offset * 4)::TEXT, 2, '0') || ':00',
        route_record.destination, schedule_date, LPAD((10 + hour_offset * 4)::TEXT, 2, '0') || ':30',
        route_record."estimatedDuration", bus_record."busType", bus_record.model,
        'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-202-' || LPAD((8 + hour_offset * 4)::TEXT, 2, '0') || '00',
        bus_record."depotName",
        schedule_date, LPAD((7 + hour_offset * 4)::TEXT, 2, '0') || ':00',
        120000, bus_record."totalSeats", 'Scheduled',
        NOW(), NOW()
      );
      schedule_counter := schedule_counter + 1;
    END LOOP;
    
    -- Limousine route: Ho Chi Minh - Dalat (Route 204)
    SELECT * INTO route_record FROM routes WHERE "routeNo" = 204;
    SELECT * INTO bus_record FROM buses WHERE "busNumber" = 'BUS008';
    
    INSERT INTO bus_schedules (
      "routeNo", "busId", "routeId",
      "departure_city", "departure_date", "departure_time",
      "arrival_city", "arrival_date", "arrival_time",
      duration, "busType", model,
      "busScheduleID", "depotName",
      "bookingClosingDate", "bookingClosingTime",
      price, "availableSeats", status,
      "createdAt", "updatedAt"
    ) VALUES (
      route_record."routeNo", bus_record.id, route_record.id,
      route_record.origin, schedule_date, '06:00',
      route_record.destination, schedule_date, '13:00',
      route_record."estimatedDuration", bus_record."busType", bus_record.model,
      'SCH-' || TO_CHAR(schedule_date, 'YYYYMMDD') || '-204-0600',
      bus_record."depotName",
      schedule_date, '05:00',
      380000, bus_record."totalSeats", 'Scheduled',
      NOW(), NOW()
    );
    schedule_counter := schedule_counter + 1;
    
  END LOOP;
  
  RAISE NOTICE '✅ Created % schedules for the next 7 days', schedule_counter;
END $$;

-- Verify insertion
SELECT 
  "busScheduleID",
  "departure_city",
  "arrival_city",
  "departure_date",
  "departure_time",
  "busType",
  price,
  "availableSeats",
  status
FROM bus_schedules
ORDER BY "departure_date", "departure_time"
LIMIT 20;

-- Show schedule statistics
SELECT 
  "departure_date",
  COUNT(*) as "scheduleCount",
  SUM("availableSeats") as "totalSeats"
FROM bus_schedules
GROUP BY "departure_date"
ORDER BY "departure_date";

-- Success message
DO $$
DECLARE
  schedule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO schedule_count FROM bus_schedules;
  
  RAISE NOTICE '✅ Sample schedules created successfully!';
  RAISE NOTICE '   Total schedules: %', schedule_count;
  RAISE NOTICE '   Date range: % to %', CURRENT_DATE, CURRENT_DATE + 6;
END $$;
