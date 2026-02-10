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
-- 1. Rename the column if it hasn't been renamed yet


-- 1. Make visit_time optional and set a default
ALTER TABLE visits ALTER COLUMN visit_time DROP NOT NULL;
ALTER TABLE visits ALTER COLUMN visit_time SET DEFAULT CURRENT_TIME;

-- 2. Rename findings to diagnosis (if not already done)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='findings') THEN
    ALTER TABLE visits RENAME COLUMN findings TO diagnosis;
  END IF;
END $$;

-- 3. FORCE Supabase to see the changes
NOTIFY pgrst, 'reload schema';


-- 1. UNLINK old constraints from Visits
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_patient_id_fkey;
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_doctor_id_fkey;
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_created_by_fkey;

-- 2. RELINK Visits to the new Unified Users table
ALTER TABLE visits 
  ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT visits_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Modernize Prescriptions too (to prevent the next error)
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey;
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. FORCE REFRESH
NOTIFY pgrst, 'reload schema';