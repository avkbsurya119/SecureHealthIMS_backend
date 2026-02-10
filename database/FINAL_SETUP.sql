-- ==========================================
-- RESET & INIT DATABASE (No RLS / Development Mode)
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS lab_tests CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS patient_consents CASCADE;
DROP TABLE IF EXISTS consent_history CASCADE;
DROP TABLE IF EXISTS consents CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE SKILLS (Triggers Function)
CREATE OR REPLACE FUNCTION public.handle_user_id_sync() 
RETURNS TRIGGER AS $$
BEGIN
    -- If id is provided but user_id is missing, sync it
    IF NEW.id IS NOT NULL AND NEW.user_id IS NULL THEN
        NEW.user_id := NEW.id;
    -- If user_id is provided but id is missing, sync it
    ELSIF NEW.user_id IS NOT NULL AND NEW.id IS NULL THEN
        NEW.id := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREATE USERS TABLE (Hybrid)
CREATE TABLE users (
  id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile fields
  email           TEXT UNIQUE,
  full_name       TEXT,
  phone           TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  address         TEXT,
  
  -- Role Management
  role            TEXT NOT NULL DEFAULT 'patient'
                  CHECK (role IN ('patient','doctor','nurse','admin')),
  
  -- Status fields
  is_active       BOOLEAN DEFAULT true,
  profile_completed BOOLEAN DEFAULT false,
  approval_status  TEXT DEFAULT 'approved'
                   CHECK (approval_status IN ('pending','approved','declined')),

  -- Patient Profile Fields (Requested by Frontend)
  allergies         TEXT,
  blood_group       TEXT,
  medical_history   TEXT,
  emergency_contact TEXT,
  emergency_phone   TEXT,

  -- Doctor/Nurse Profile Fields (Requested by Frontend)
  specialization    TEXT,
  license_number    TEXT,
  education         TEXT,
  experience_years  INTEGER,
  hospital_affiliation TEXT,
  nursing_license   TEXT,
  department        TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (id)
);

-- Trigger to keep id and user_id in sync
CREATE TRIGGER on_user_insert
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_id_sync();

-- 4. PATIENTS TABLE
CREATE TABLE patients (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE, 
  name            TEXT NOT NULL,
  dob             DATE,
  gender          TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  verified        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. DEPARTMENTS TABLE
CREATE TABLE departments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. DOCTORS TABLE
CREATE TABLE doctors (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  specialization  TEXT,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. CONSENTS TABLES
CREATE TABLE consents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  has_consented  BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  granted_at     TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id)
);

CREATE TABLE consent_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN ('grant','revoke','terms_accept')),
  performed_by UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE patient_consents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  granted_at   TIMESTAMPTZ,
  denied_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 8. CLINICAL TABLES
CREATE TABLE medical_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id    UUID REFERENCES doctors(id) ON DELETE SET NULL,
  diagnosis    TEXT,
  prescription TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE appointments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID REFERENCES doctors(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  patient_name TEXT,
  doctor_name  TEXT,
  reason      TEXT,
  status      TEXT DEFAULT 'Pending'
              CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visits (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id  UUID REFERENCES doctors(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  chief_complaint TEXT,
  findings   TEXT,
  notes      TEXT,
  created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prescriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES doctors(id) ON DELETE SET NULL,
  visit_id        UUID REFERENCES visits(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  duration        TEXT,
  instructions    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 9. ADMIN & LOGGING TABLES
CREATE TABLE services (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT,
  cost       NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id           SERIAL PRIMARY KEY,
  patient_id   UUID REFERENCES users(id),
  patient_name TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  total        NUMERIC(10,2) DEFAULT 0,
  status       TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid','Partial')),
  services     TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  table_name   TEXT,
  record_id    TEXT,
  patient_id   UUID,
  performed_by UUID,
  ip_address   TEXT,
  details      JSONB,
  resource     TEXT,
  resource_id  TEXT,
  user_id      UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  admin_id   UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SEED DATA
INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Heart and cardiovascular system'),
  ('Neurology', 'Brain and nervous system'),
  ('Orthopedics', 'Bones, joints and muscles'),
  ('Pediatrics', 'Children healthcare'),
  ('Emergency', 'Emergency and trauma care'),
  ('ICU', 'Intensive Care Unit'),
  ('General Ward', 'General medicine'),
  ('Surgery', 'Surgical procedures')
ON CONFLICT (name) DO NOTHING;

INSERT INTO services (name, department, cost) VALUES
  ('ECG Test', 'Cardiology', 50),
  ('MRI Scan', 'Neurology', 500),
  ('X-Ray', 'Orthopedics', 75),
  ('Blood Test', 'General Ward', 30),
  ('CT Scan', 'Neurology', 350)
ON CONFLICT DO NOTHING;

-- 11. DISABLE RLS (For Debugging/Development)
-- This allows OPEN ACCESS (Anyone can read/write if they have the anon key)
-- Since we rely on Backend API or App logic, it's okay for now.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 12. NO POLICIES NEEDED (RLS is off)
