-- ============================================================================
-- ADJUST HALL CAPACITIES FOR TESTING WITH ~60 STUDENTS
-- Run this script to update existing halls to smaller capacities
-- This allows better visualization of the allocation algorithms
-- ============================================================================

-- Update existing halls to smaller capacities
-- We want 3-4 halls with 15-25 capacity each to accommodate ~60 students

-- Option 1: If you have existing halls, update them
UPDATE halls SET 
  capacity = 20,
  rows = 4,
  columns = 5
WHERE id = 1;

UPDATE halls SET 
  capacity = 18,
  rows = 3,
  columns = 6
WHERE id = 2;

UPDATE halls SET 
  capacity = 24,
  rows = 4,
  columns = 6
WHERE id = 3;

-- Option 2: Delete existing and create fresh halls for testing
-- Uncomment the following if you want to start fresh:

/*
-- Delete existing allocations and halls
DELETE FROM allocations;
DELETE FROM blocked_seats;
DELETE FROM halls;

-- Reset sequence
ALTER SEQUENCE halls_id_seq RESTART WITH 1;

-- Insert new smaller halls for testing
INSERT INTO halls (name, capacity, rows, columns, floor, has_ramp, building, is_active) VALUES
  ('CS-101', 20, 4, 5, 1, true, 'Computer Science Block', true),
  ('CS-102', 18, 3, 6, 1, false, 'Computer Science Block', true),
  ('ECE-201', 24, 4, 6, 2, true, 'Electronics Block', true),
  ('MECH-301', 15, 3, 5, 3, false, 'Mechanical Block', true);
*/

-- Verify the changes
SELECT id, name, capacity, rows, columns, building FROM halls ORDER BY id;

-- ============================================================================
-- EXPECTED OUTPUT:
-- With 4 halls having capacities 20, 18, 24, 15 = Total 77 seats
-- This is enough for 60 students and allows visualization of branch mixing
-- ============================================================================
