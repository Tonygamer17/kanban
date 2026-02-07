-- Fix for RLS Issues - Execute in Supabase SQL Editor
-- This will disable RLS temporarily to identify if the problem is RLS related

-- Step 1: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('boards', 'columns', 'cards');

-- Step 2: Temporarily disable RLS for testing
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;

-- Step 3: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Step 4: Test basic insert manually (run this to see if it works)
INSERT INTO boards (title) VALUES ('Test Board') RETURNING *;

-- After testing, you can re-enable RLS with these commands:
-- ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cards ENABLE ROW LEVEL SECURITY;