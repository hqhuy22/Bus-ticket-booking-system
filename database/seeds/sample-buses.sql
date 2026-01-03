-- =====================================================
-- Seed: Sample Buses
-- Description: Sample bus fleet for testing
-- Date: 2026-01-03
-- =====================================================

-- Insert sample buses
INSERT INTO buses (
  "busNumber",
  "plateNumber",
  "busType",
  model,
  "totalSeats",
  "seatMapConfig",
  amenities,
  status,
  "depotName",
  photos,
  "createdAt",
  "updatedAt"
) VALUES
  -- Sleeper buses
  (
    'BUS001',
    '51B-12345',
    'Sleeper',
    'Hyundai Universe',
    40,
    '{"rows": 10, "columns": 4, "layout": "2x1", "type": "sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Blanket', 'Reading Light'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/sleeper-1.jpg'],
    NOW(),
    NOW()
  ),
  (
    'BUS002',
    '51B-23456',
    'Sleeper',
    'Thaco Universe',
    36,
    '{"rows": 9, "columns": 4, "layout": "2x1", "type": "sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Blanket', 'Entertainment'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/sleeper-2.jpg'],
    NOW(),
    NOW()
  ),
  (
    'BUS003',
    '29B-34567',
    'Sleeper',
    'Hyundai Universe Premium',
    32,
    '{"rows": 8, "columns": 4, "layout": "2x1", "type": "sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Blanket', 'Massage Seat', 'TV'],
    'active',
    'Hanoi North Depot',
    ARRAY['/uploads/buses/sleeper-3.jpg'],
    NOW(),
    NOW()
  ),
  
  -- Semi-Sleeper buses
  (
    'BUS004',
    '51C-45678',
    'Semi-Sleeper',
    'Samco Felix',
    45,
    '{"rows": 15, "columns": 3, "layout": "2x1", "type": "semi-sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/semi-sleeper-1.jpg'],
    NOW(),
    NOW()
  ),
  (
    'BUS005',
    '43A-56789',
    'Semi-Sleeper',
    'Thaco Mobihome',
    42,
    '{"rows": 14, "columns": 3, "layout": "2x1", "type": "semi-sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Snack'],
    'active',
    'Da Nang Central Depot',
    ARRAY['/uploads/buses/semi-sleeper-2.jpg'],
    NOW(),
    NOW()
  ),
  
  -- Seater buses
  (
    'BUS006',
    '51D-67890',
    'Seater',
    'Hyundai County',
    29,
    '{"rows": 10, "columns": 3, "layout": "2x1", "type": "seater"}',
    ARRAY['AC', 'USB Charging'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/seater-1.jpg'],
    NOW(),
    NOW()
  ),
  (
    'BUS007',
    '30B-78901',
    'Seater',
    'Thaco TB85S',
    35,
    '{"rows": 12, "columns": 3, "layout": "2x1", "type": "seater"}',
    ARRAY['AC', 'WiFi', 'USB Charging'],
    'active',
    'Hanoi North Depot',
    ARRAY['/uploads/buses/seater-2.jpg'],
    NOW(),
    NOW()
  ),
  
  -- Limousine buses
  (
    'BUS008',
    '51E-89012',
    'Limousine',
    'Ford Transit Limousine',
    16,
    '{"rows": 4, "columns": 4, "layout": "2x2", "type": "limousine"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Premium Seat', 'Entertainment', 'Snack'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/limousine-1.jpg'],
    NOW(),
    NOW()
  ),
  (
    'BUS009',
    '51F-90123',
    'Limousine',
    'Mercedes Sprinter',
    18,
    '{"rows": 5, "columns": 4, "layout": "2x2", "type": "limousine"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Massage Seat', 'Entertainment'],
    'active',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/limousine-2.jpg'],
    NOW(),
    NOW()
  ),
  
  -- Buses in maintenance
  (
    'BUS010',
    '51G-01234',
    'Sleeper',
    'Hyundai Universe',
    40,
    '{"rows": 10, "columns": 4, "layout": "2x1", "type": "sleeper"}',
    ARRAY['WiFi', 'AC', 'USB Charging', 'Water', 'Blanket'],
    'maintenance',
    'Ho Chi Minh Central Depot',
    ARRAY['/uploads/buses/maintenance-1.jpg'],
    NOW(),
    NOW()
  )
ON CONFLICT ("busNumber") DO NOTHING;

-- Verify insertion
SELECT 
  "busNumber",
  "plateNumber",
  "busType",
  model,
  "totalSeats",
  status,
  "depotName"
FROM buses
ORDER BY "busNumber";

-- Show bus statistics
SELECT 
  "busType",
  COUNT(*) as count,
  SUM("totalSeats") as "totalCapacity"
FROM buses
WHERE status = 'active'
GROUP BY "busType"
ORDER BY count DESC;

-- Success message
DO $$
DECLARE
  bus_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bus_count FROM buses;
  SELECT COUNT(*) INTO active_count FROM buses WHERE status = 'active';
  
  RAISE NOTICE '✅ Sample buses created successfully!';
  RAISE NOTICE '   Total buses: %', bus_count;
  RAISE NOTICE '   Active buses: %', active_count;
END $$;
