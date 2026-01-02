-- Migration: Add fullName column to customers table
-- Created: 2026-01-01
-- Description: Add fullName field to support full name storage for users

-- Add fullName column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'fullName'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN "fullName" VARCHAR(255);
        
        RAISE NOTICE 'Column fullName added successfully';
    ELSE
        RAISE NOTICE 'Column fullName already exists';
    END IF;
END $$;

-- Optional: Update existing records with Google users to have fullName from their display name
-- This can be run if you have existing Google OAuth users
COMMENT ON COLUMN customers."fullName" IS 'Full name of the user';
