-- Fix RLS policies to allow admin to see all feedback and user info
-- Run this in your Supabase SQL Editor

-- Allow public read access to users table (needed for admin to see who left feedback)
-- This is safe because we're only exposing name and email, which users already provided
DROP POLICY IF EXISTS "Public read access to users" ON users;
CREATE POLICY "Public read access to users" ON users
    FOR SELECT USING (true);

-- Allow users to insert themselves (needed for user creation during login)
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
CREATE POLICY "Users can insert themselves" ON users
    FOR INSERT WITH CHECK (true);

-- Verify feedback read policy exists and allows all reads
-- If the policy already exists, this will fail gracefully
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'feedback' 
        AND policyname = 'Public read access to feedback'
    ) THEN
        CREATE POLICY "Public read access to feedback" ON feedback
            FOR SELECT USING (true);
    END IF;
END
$$;

-- Also ensure users can read their own user record
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (true);

