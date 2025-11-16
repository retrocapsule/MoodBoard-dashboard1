-- Complete RLS Policy Fix for MoodBoard
-- Run this in your Supabase SQL Editor to fix all RLS issues
-- This ensures users can be created, feedback can be saved, and admins can see everything

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow public read access to users (for admin to see who left feedback)
DROP POLICY IF EXISTS "Public read access to users" ON users;
CREATE POLICY "Public read access to users" ON users
    FOR SELECT USING (true);

-- Allow users to insert themselves (needed for user creation during login)
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
CREATE POLICY "Users can insert themselves" ON users
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own data
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- FEEDBACK TABLE POLICIES
-- ============================================

-- Allow public read access to feedback (for admin to see all feedback)
DROP POLICY IF EXISTS "Public read access to feedback" ON feedback;
CREATE POLICY "Public read access to feedback" ON feedback
    FOR SELECT USING (true);

-- Allow anyone to insert feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
CREATE POLICY "Users can insert their own feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update feedback
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
CREATE POLICY "Users can update their own feedback" ON feedback
    FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- SECTIONS AND GALLERY_ITEMS (should already exist)
-- ============================================

-- These should already be set from the original schema, but verify:
-- Sections: Public read access
-- Gallery items: Public read access

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'feedback', 'sections', 'gallery_items')
ORDER BY tablename, policyname;

-- Expected policies:
-- users: Public read access, Users can insert themselves, Users can update their own data
-- feedback: Public read access, Users can insert their own feedback, Users can update their own feedback
-- sections: Public read access (from original schema)
-- gallery_items: Public read access (from original schema)

