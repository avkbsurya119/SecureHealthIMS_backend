-- ==========================================
-- Refined Database Setup for Frontend & Backend Compatibility
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- 1. Core Users Table
CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Link to Supabase Auth
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

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Patients Table (Required by Backend Logic)
CREATE TABLE IF NOT EXISTS patients (
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

-- 3. Doctors Table (Required by Backend Logic)
CREATE TABLE IF NOT EXISTS doctors (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  specialization  TEXT,
  department_id   UUID, -- FK added below after departments table
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Add department FK to doctors
ALTER TABLE doctors 
ADD CONSTRAINT fk_department 
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;

-- 5. Consents Tables (Frontend Requirement)
CREATE TABLE IF NOT EXISTS consents (
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

CREATE TABLE IF NOT EXISTS consent_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID NOT NULL REFERENCES users(user_id),
  action       TEXT NOT NULL CHECK (action IN ('grant','revoke','terms_accept')),
  performed_by UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_consents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  granted_at   TIMESTAMPTZ,
  denied_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);


-- 6. Medical & Clinical Tables
CREATE TABLE IF NOT EXISTS medical_records (
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

CREATE TABLE IF NOT EXISTS appointments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID REFERENCES doctors(id) ON DELETE SET NULL,
  date        DATE NOT NULL, -- Keep consistency: backend uses appointment_date/time in some places, date/time in others. 
                             -- FIX: Align with controller logic which uses `date` and `time` in createAppointment (inferred)
  time        TIME NOT NULL,
  patient_name TEXT,
  doctor_name  TEXT,
  reason      TEXT,
  status      TEXT DEFAULT 'Pending'
              CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
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

CREATE TABLE IF NOT EXISTS prescriptions (
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

-- 7. Administration Tables
CREATE TABLE IF NOT EXISTS services (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT,
  cost       NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id           SERIAL PRIMARY KEY,
  patient_id   UUID REFERENCES users(user_id), -- Linking to base user account for billing
  patient_name TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  total        NUMERIC(10,2) DEFAULT 0,
  status       TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid','Partial')),
  services     TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  admin_id   UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Seed Initial Data
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

-- 9. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. Service Role Policies (Backend Access)
-- The backend uses the service_role key, so we must allow it to bypass RLS.
-- Supabase service_role key automatically bypasses RLS, but explicit policies can help if using authenticated client.
-- For standard setup, service role bypasses all.

-- 11. Public Access Policies (for specific tables if needed)
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING ( auth.uid() = user_id );

CREATE POLICY "Patients view own record" ON patients FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Doctors view own record" ON doctors FOR SELECT USING ( auth.uid() = user_id );

