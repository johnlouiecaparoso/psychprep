-- ========================================
-- FIX USER ROLES ISSUE
-- ========================================

-- 1. Check if trigger exists
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as action_statement,
    t.tgtype::text as action_timing,
    'ROW' as action_orientation
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'users' AND n.nspname = 'auth'
AND NOT t.tgisinternal
AND t.tgname = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
    proname,
    prosrc
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'handle_new_user' AND n.nspname = 'public';

-- 3. Check existing profiles and their roles
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    u.email as auth_email,
    u.raw_user_meta_data
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 4. Fix existing users who have wrong roles
-- This will update profiles to match the auth metadata
UPDATE profiles 
SET role = (raw_user_meta_data ->> 'role')::public.user_role
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND raw_user_meta_data ->> 'role' IS NOT NULL
AND profiles.role != (raw_user_meta_data ->> 'role')::public.user_role;

-- 5. Create/Recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- 6. Create/Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Test the trigger by checking recent users
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data ->> 'full_name' as full_name,
    u.raw_user_meta_data ->> 'role' as selected_role,
    p.role as profile_role,
    CASE 
        WHEN p.role = (u.raw_user_meta_data ->> 'role')::public.user_role THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- ========================================
-- HOW TO USE:
-- ========================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Run it to fix the role assignment issue
-- ========================================
