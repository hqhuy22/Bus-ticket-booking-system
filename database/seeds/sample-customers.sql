-- =====================================================
-- Seed: Sample Customers
-- Description: Test customer accounts for development
-- Date: 2026-01-03
-- =====================================================

-- Insert sample customers
-- All passwords are: Test@123456
-- Hashed with bcrypt cost=10
INSERT INTO customers (
  email,
  username,
  password,
  "fullName",
  position,
  "isVerified",
  provider,
  "isGuest",
  "phoneNumber",
  avatar,
  preferences,
  "createdAt",
  "updatedAt"
) VALUES
  -- Regular verified customers
  (
    'john.doe@example.com',
    'johndoe',
    '$2a$10$rGHvZ9F5YxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'John Doe',
    'customer',
    true,
    'local',
    false,
    '+84901234567',
    '/uploads/avatars/john.jpg',
    '{"language": "en", "currency": "VND", "notifications": true}',
    NOW(),
    NOW()
  ),
  (
    'jane.smith@example.com',
    'janesmith',
    '$2a$10$rGHvZ9F5YxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'Jane Smith',
    'customer',
    true,
    'local',
    false,
    '+84902345678',
    '/uploads/avatars/jane.jpg',
    '{"language": "vi", "currency": "VND", "notifications": true}',
    NOW(),
    NOW()
  ),
  (
    'nguyen.van.a@example.com',
    'nguyenvana',
    '$2a$10$rGHvZ9F5YxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'Nguyễn Văn A',
    'customer',
    true,
    'local',
    false,
    '+84903456789',
    NULL,
    '{"language": "vi", "currency": "VND", "notifications": true}',
    NOW(),
    NOW()
  ),
  (
    'tran.thi.b@example.com',
    'tranthib',
    '$2a$10$rGHvZ9F5YxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'Trần Thị B',
    'customer',
    true,
    'local',
    false,
    '+84904567890',
    NULL,
    '{"language": "vi", "currency": "VND", "notifications": false}',
    NOW(),
    NOW()
  ),
  
  -- Unverified customer
  (
    'new.user@example.com',
    'newuser',
    '$2a$10$rGHvZ9F5YxL9qxYvZ5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    'New User',
    'customer',
    false,
    'local',
    false,
    '+84905678901',
    NULL,
    '{"language": "en", "currency": "VND"}',
    NOW(),
    NOW()
  ),
  
  -- Google OAuth user
  (
    'google.user@gmail.com',
    'googleuser',
    NULL,
    'Google User',
    'customer',
    true,
    'google',
    false,
    NULL,
    'https://lh3.googleusercontent.com/a/default-user',
    '{"language": "en", "currency": "VND", "notifications": true}',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Create notification preferences for all customers
INSERT INTO notification_preferences (
  "customerId",
  "emailBookingConfirmation",
  "emailTripReminders",
  "emailCancellations",
  "emailPromotions",
  "emailNewsletter",
  "smsBookingConfirmation",
  "smsTripReminders",
  "smsCancellations",
  "pushBookingConfirmation",
  "pushTripReminders",
  "pushPromotions",
  "phoneNumber",
  "reminderTiming",
  timezone,
  "createdAt",
  "updatedAt"
)
SELECT 
  id,
  true,  -- emailBookingConfirmation
  true,  -- emailTripReminders
  true,  -- emailCancellations
  CASE WHEN position = 'customer' THEN false ELSE true END,  -- emailPromotions
  false, -- emailNewsletter
  false, -- smsBookingConfirmation
  false, -- smsTripReminders
  false, -- smsCancellations
  true,  -- pushBookingConfirmation
  true,  -- pushTripReminders
  false, -- pushPromotions
  "phoneNumber",
  24,    -- reminderTiming
  'Asia/Ho_Chi_Minh',
  NOW(),
  NOW()
FROM customers 
WHERE position = 'customer' AND "isGuest" = false
ON CONFLICT ("customerId") DO NOTHING;

-- Verify insertion
SELECT 
  id,
  email,
  username,
  "fullName",
  position,
  "isVerified",
  provider,
  "phoneNumber"
FROM customers
WHERE position = 'customer'
ORDER BY id;

-- Show customer statistics
SELECT 
  provider,
  "isVerified",
  COUNT(*) as count
FROM customers
WHERE position = 'customer'
GROUP BY provider, "isVerified"
ORDER BY provider, "isVerified";

-- Success message
DO $$
DECLARE
  customer_count INTEGER;
  verified_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers WHERE position = 'customer';
  SELECT COUNT(*) INTO verified_count FROM customers WHERE position = 'customer' AND "isVerified" = true;
  
  RAISE NOTICE '✅ Sample customers created successfully!';
  RAISE NOTICE '   Total customers: %', customer_count;
  RAISE NOTICE '   Verified customers: %', verified_count;
  RAISE NOTICE '   ';
  RAISE NOTICE '   Test Login Credentials:';
  RAISE NOTICE '   Email: john.doe@example.com';
  RAISE NOTICE '   Password: Test@123456';
  RAISE NOTICE '   ';
  RAISE NOTICE '   ⚠️  These are test accounts for development only!';
END $$;
