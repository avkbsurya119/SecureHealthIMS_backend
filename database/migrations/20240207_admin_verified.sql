-- Migration: Add verified column to patients and doctors
-- Run this in Supabase SQL Editor

ALTER TABLE patients ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Ensure admin role is handled if strictly enforced (optional, mostly for documentation)
-- Users table already exists, no changes needed there besides data seeding.
