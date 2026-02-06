-- Fix schema to support auth controller logic

-- 1. Add user_id to patients (links to users table)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 2. Add email to patients (controller tries to insert it)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Add user_id to doctors (links to users table)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 4. Ensure dob column exists (logic maps date_of_birth -> dob)
-- This is just a check, schema.sql says it exists.
