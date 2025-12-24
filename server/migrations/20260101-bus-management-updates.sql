-- Migration: Bus Management Updates
-- Date: 2026-01-01
-- Description: Add plateNumber and photos to buses, remove seatMapConfig from bus_schedules

-- 1. Add plateNumber to buses
ALTER TABLE buses ADD COLUMN IF NOT EXISTS "plateNumber" VARCHAR(20) UNIQUE;

-- 2. Add photos to buses
ALTER TABLE buses ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- 3. Create index on plateNumber
CREATE INDEX IF NOT EXISTS idx_buses_plate_number ON buses("plateNumber");

-- 4. Remove seatMapConfig from bus_schedules
ALTER TABLE bus_schedules DROP COLUMN IF EXISTS "seatMapConfig";

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buses' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bus_schedules' 
ORDER BY ordinal_position;
