-- Migration: Add status field to bus_schedules table
-- Date: 2026-01-01

-- Add status column with ENUM type
ALTER TABLE bus_schedules 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled'));

-- Add cancellation-related columns
ALTER TABLE bus_schedules 
ADD COLUMN IF NOT EXISTS cancelledAt TIMESTAMP;

ALTER TABLE bus_schedules 
ADD COLUMN IF NOT EXISTS cancelledBy INTEGER REFERENCES users(id);

ALTER TABLE bus_schedules 
ADD COLUMN IF NOT EXISTS cancellationReason TEXT;

-- Migrate existing data: Set status based on isCompleted field
UPDATE bus_schedules 
SET status = 'Completed' 
WHERE isCompleted = true AND (status IS NULL OR status = 'Scheduled');

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_bus_schedules_status ON bus_schedules(status);

-- Comments
COMMENT ON COLUMN bus_schedules.status IS 'Schedule status: Scheduled, In Progress, Completed, or Cancelled';
COMMENT ON COLUMN bus_schedules.cancelledAt IS 'Timestamp when schedule was cancelled';
COMMENT ON COLUMN bus_schedules.cancelledBy IS 'Admin user ID who cancelled the schedule';
COMMENT ON COLUMN bus_schedules.cancellationReason IS 'Reason for schedule cancellation';
