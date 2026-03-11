-- Run this script in your Supabase SQL Editor carefully --

-- 1. Drop the conflicting foreign keys that require patient_id to be in BOTH users and patients tables
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- 2. Drop the conflicting foreign keys that require doctor_id to be in BOTH users and doctors tables
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- This allows appointments to legitimately reference the `users` table UUIDs which are used uniformly
-- by the Node.js backend to map authentication logic to business logic.
