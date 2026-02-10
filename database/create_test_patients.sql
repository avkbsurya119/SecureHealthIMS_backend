-- Quick diagnostic and fix for patient search issue
-- This script will:
-- 1. Check existing patient data
-- 2. Create test patients if none exist
-- 3. Ensure data is searchable

-- First, let's see what we have
SELECT 'Users with role=patient:' as info;
SELECT id, full_name, email, phone, role 
FROM users 
WHERE role = 'patient';

SELECT 'Records in patients table:' as info;
SELECT id, user_id, name, email, phone 
FROM patients;

-- Create test patient data if none exists
-- We'll create a few test patients directly in the users table

DO $$
DECLARE
    test_patient_id UUID;
BEGIN
    -- Check if we already have test patients
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'patient' LIMIT 1) THEN
        RAISE NOTICE 'No patients found. Creating test patients...';
        
        -- Create Test Patient 1
        INSERT INTO users (
            id,
            email,
            full_name,
            phone,
            date_of_birth,
            gender,
            blood_group,
            role,
            is_active,
            profile_completed,
            approval_status
        ) VALUES (
            gen_random_uuid(),
            'test.patient1@example.com',
            'Test Patient One',
            '+1-555-0001',
            '1990-01-15',
            'male',
            'O+',
            'patient',
            true,
            true,
            'approved'
        );
        
        -- Create Test Patient 2
        INSERT INTO users (
            id,
            email,
            full_name,
            phone,
            date_of_birth,
            gender,
            blood_group,
            role,
            is_active,
            profile_completed,
            approval_status
        ) VALUES (
            gen_random_uuid(),
            'test.patient2@example.com',
            'Test Patient Two',
            '+1-555-0002',
            '1985-05-20',
            'female',
            'A+',
            'patient',
            true,
            true,
            'approved'
        );
        
        -- Create Test Patient 3
        INSERT INTO users (
            id,
            email,
            full_name,
            phone,
            date_of_birth,
            gender,
            blood_group,
            role,
            is_active,
            profile_completed,
            approval_status
        ) VALUES (
            gen_random_uuid(),
            'john.doe@example.com',
            'John Doe',
            '+1-555-0003',
            '1995-03-10',
            'male',
            'B+',
            'patient',
            true,
            true,
            'approved'
        );
        
        RAISE NOTICE 'Created 3 test patients';
    ELSE
        RAISE NOTICE 'Patients already exist. Skipping creation.';
    END IF;
END $$;

-- Verify the data was created
SELECT 'Final patient count:' as info;
SELECT COUNT(*) as patient_count 
FROM users 
WHERE role = 'patient';

-- Show all patients with searchable fields
SELECT 'All patients with searchable fields:' as info;
SELECT id, full_name, email, phone, gender, blood_group
FROM users 
WHERE role = 'patient'
ORDER BY full_name;
