-- ***This is a Test Database to ensure that we have a connection***


-- ================================
-- Hospital Management System Schema
-- ================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ====================
-- Departments
-- ====================
create table departments (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  created_at timestamp default now()
);

-- ====================
-- Doctors
-- ====================
create table doctors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  phone text,
  specialization text,
  department_id uuid references departments(id) on delete set null,
  created_at timestamp default now()
);

-- ====================
-- Patients
-- ====================
create table patients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  dob date,
  gender text check (gender in ('male','female','other')),
  phone text,
  address text,
  created_at timestamp default now()
);

-- ====================
-- Appointments
-- ====================
create table appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  status text check (
    status in ('scheduled','completed','cancelled')
  ) default 'scheduled',
  created_at timestamp default now(),
  unique (doctor_id, appointment_date, appointment_time)
);

-- ====================
-- Medical Records
-- ====================
create table medical_records (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete set null,
  diagnosis text,
  prescription text,
  notes text,
  created_at timestamp default now()
);

-- ====================
-- Visits/Clinical Encounters (EPIC 3.1, 3.2, 3.6)
-- ====================
create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade not null,
  doctor_id uuid references doctors(id) on delete set null not null,
  visit_date date not null,
  visit_time time not null,
  chief_complaint text,
  findings text,
  notes text,
  created_by uuid references doctors(id) on delete set null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ====================
-- Prescriptions (EPIC 3.3, 3.4)
-- ====================
create table if not exists prescriptions (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references patients(id) on delete cascade not null,
  doctor_id uuid references doctors(id) on delete set null not null,
  visit_id uuid references visits(id) on delete set null,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ====================
-- User Roles (Auth Mapping)
-- ====================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (
    role in ('admin','doctor','receptionist','nurse','patient')
  ) not null,
  created_at timestamp default now()
);
