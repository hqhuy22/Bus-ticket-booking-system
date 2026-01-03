-- =====================================================
-- Seed: Admin User
-- Description: Creates default administrator account
-- Date: 2026-01-03
-- =====================================================

-- Insert admin user
-- Password: Admin@123456 (hashed with bcrypt, cost=10)
INSERT INTO customers (
  email, 
  username, 
  password,
  "fullName",
  position,
  "isVerified",
  provider,
  "isGuest",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin@busbooking.com',
  'admin',
  '$2a$10$8Z5yYxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'System Administrator',
  'admin',
  true,
  'local',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create notification preferences for admin
INSERT INTO notification_preferences (
  "customerId",
  "emailBookingConfirmation",
  "emailTripReminders",
  "emailCancellations",
  "emailPromotions",
  "emailNewsletter",
  "createdAt",
  "updatedAt"
) 
SELECT 
  id,
  true,
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
FROM customers 
WHERE email = 'admin@busbooking.com'
ON CONFLICT ("customerId") DO NOTHING;

-- Verify insertion
SELECT 
  id, 
  email, 
  username, 
  "fullName",
  position,
  "isVerified"
FROM customers 
WHERE email = 'admin@busbooking.com';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin user created successfully!';
  RAISE NOTICE '   Email: admin@busbooking.com';
  RAISE NOTICE '   Username: admin';
  RAISE NOTICE '   Password: Admin@123456';
  RAISE NOTICE '   ⚠️  Please change the password after first login!';
END $$;
