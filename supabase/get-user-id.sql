-- ============================================
-- GET REAL USER IDs FOR TESTING
-- ============================================

-- 1. Get all users (if any exist)
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Get all profiles (if any exist)
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 3. After you register a user, run this to get their ID
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-registered-email@example.com'
ORDER BY u.created_at DESC;

-- ============================================
-- TESTING QUERIES WITH REAL USER ID
-- ============================================
-- Once you have a real user ID, replace 'YOUR_USER_ID' in dashboard-queries.sql
-- For example: WHERE student_id = '123e4567-e89b-12d3-a456-426614174000'
