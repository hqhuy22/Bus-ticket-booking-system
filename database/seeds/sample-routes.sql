-- =====================================================
-- Seed: Sample Routes
-- Description: Popular bus routes in Vietnam
-- Date: 2026-01-03
-- =====================================================

-- Insert popular routes
INSERT INTO routes (
  "routeName",
  "routeNo",
  origin,
  destination,
  distance,
  "estimatedDuration",
  status,
  "createdAt",
  "updatedAt"
) VALUES
  -- North-South routes
  ('Ho Chi Minh - Hanoi Express', 101, 'Ho Chi Minh', 'Hanoi', 1710.00, '30:00', 'active', NOW(), NOW()),
  ('Ho Chi Minh - Da Nang', 102, 'Ho Chi Minh', 'Da Nang', 964.00, '18:00', 'active', NOW(), NOW()),
  ('Hanoi - Da Nang', 103, 'Hanoi', 'Da Nang', 764.00, '14:00', 'active', NOW(), NOW()),
  
  -- Southern routes
  ('Ho Chi Minh - Nha Trang', 201, 'Ho Chi Minh', 'Nha Trang', 448.00, '9:00', 'active', NOW(), NOW()),
  ('Ho Chi Minh - Vung Tau', 202, 'Ho Chi Minh', 'Vung Tau', 125.00, '2:30', 'active', NOW(), NOW()),
  ('Ho Chi Minh - Can Tho', 203, 'Ho Chi Minh', 'Can Tho', 169.00, '3:30', 'active', NOW(), NOW()),
  ('Ho Chi Minh - Dalat', 204, 'Ho Chi Minh', 'Dalat', 308.00, '7:00', 'active', NOW(), NOW()),
  
  -- Central routes
  ('Da Nang - Hue', 301, 'Da Nang', 'Hue', 108.00, '2:30', 'active', NOW(), NOW()),
  ('Da Nang - Hoi An', 302, 'Da Nang', 'Hoi An', 30.00, '0:45', 'active', NOW(), NOW()),
  ('Nha Trang - Dalat', 303, 'Nha Trang', 'Dalat', 137.00, '3:30', 'active', NOW(), NOW()),
  
  -- Northern routes
  ('Hanoi - Haiphong', 401, 'Hanoi', 'Haiphong', 120.00, '2:00', 'active', NOW(), NOW()),
  ('Hanoi - Ninh Binh', 402, 'Hanoi', 'Ninh Binh', 95.00, '2:00', 'active', NOW(), NOW()),
  ('Hanoi - Ha Long', 403, 'Hanoi', 'Ha Long', 165.00, '3:30', 'active', NOW(), NOW())
ON CONFLICT ("routeNo") DO NOTHING;

-- Insert route stops for Ho Chi Minh - Da Nang route
INSERT INTO route_stops (
  "routeId",
  "stopOrder",
  "stopName",
  "stopType",
  "arrivalTime",
  "departureTime",
  "createdAt",
  "updatedAt"
)
SELECT 
  r.id,
  stop_data.order,
  stop_data.name,
  stop_data.type,
  stop_data.arrival,
  stop_data.departure,
  NOW(),
  NOW()
FROM routes r
CROSS JOIN (
  VALUES
    (1, 'Ho Chi Minh Central Station', 'pickup', NULL, '00:00'),
    (2, 'Bien Hoa Stop', 'both', '01:00', '01:15'),
    (3, 'Phan Thiet Rest Area', 'both', '04:00', '04:30'),
    (4, 'Nha Trang Station', 'both', '08:00', '08:30'),
    (5, 'Quy Nhon Stop', 'both', '12:00', '12:30'),
    (6, 'Da Nang Central Station', 'dropoff', '18:00', NULL)
) AS stop_data(order, name, type, arrival, departure)
WHERE r."routeNo" = 102;

-- Insert route stops for Ho Chi Minh - Nha Trang route
INSERT INTO route_stops (
  "routeId",
  "stopOrder",
  "stopName",
  "stopType",
  "arrivalTime",
  "departureTime",
  "createdAt",
  "updatedAt"
)
SELECT 
  r.id,
  stop_data.order,
  stop_data.name,
  stop_data.type,
  stop_data.arrival,
  stop_data.departure,
  NOW(),
  NOW()
FROM routes r
CROSS JOIN (
  VALUES
    (1, 'Ho Chi Minh Central Station', 'pickup', NULL, '00:00'),
    (2, 'Long Thanh Stop', 'both', '01:00', '01:15'),
    (3, 'Phan Thiet Station', 'both', '03:30', '04:00'),
    (4, 'Nha Trang Central Station', 'dropoff', '09:00', NULL)
) AS stop_data(order, name, type, arrival, departure)
WHERE r."routeNo" = 201;

-- Verify insertion
SELECT 
  "routeNo",
  "routeName",
  origin,
  destination,
  distance,
  "estimatedDuration",
  status
FROM routes
ORDER BY "routeNo";

-- Show route stops
SELECT 
  r."routeNo",
  r."routeName",
  rs."stopOrder",
  rs."stopName",
  rs."stopType",
  rs."arrivalTime",
  rs."departureTime"
FROM routes r
JOIN route_stops rs ON r.id = rs."routeId"
ORDER BY r."routeNo", rs."stopOrder";

-- Success message
DO $$
DECLARE
  route_count INTEGER;
  stop_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO route_count FROM routes;
  SELECT COUNT(*) INTO stop_count FROM route_stops;
  
  RAISE NOTICE '✅ Sample routes created successfully!';
  RAISE NOTICE '   Total routes: %', route_count;
  RAISE NOTICE '   Total route stops: %', stop_count;
END $$;
