-- Run this in Supabase SQL Editor to add columns without losing data

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT,
ADD COLUMN IF NOT EXISTS nursing_license TEXT,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
