-- Poles Apart - Seed data for development/testing
-- Run AFTER creating the admin user (drowlands60@gmail.com)

-- ============================================
-- ROUNDS (templates)
-- ============================================
INSERT INTO public.rounds (id, name, description, day_of_week, frequency_weeks) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Monday - Swindon North', 'Covers Penhill, Pinehurst, Upper Stratton', 1, 4),
  ('a1000000-0000-0000-0000-000000000002', 'Tuesday - Swindon South', 'Covers Lawn, Walcot, Old Town', 2, 4),
  ('a1000000-0000-0000-0000-000000000003', 'Wednesday - Wroughton & Chiseldon', NULL, 3, 4),
  ('a1000000-0000-0000-0000-000000000004', 'Thursday - Highworth', NULL, 4, 6);

-- ============================================
-- CUSTOMERS
-- ============================================
INSERT INTO public.customers (id, round_id, first_name, last_name, phone, address_line1, city, postcode, price, position_in_round, is_active, sms_opt_in) VALUES
  -- Monday round
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sarah', 'Mitchell', '07700100001', '14 Penhill Drive', 'Swindon', 'SN2 5BP', 18.00, 1, true, true),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'James', 'Porter', '07700100002', '7 Beech Avenue', 'Swindon', 'SN2 5EN', 22.00, 2, true, true),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Helen', 'Cook', '07700100003', '31 Pinehurst Road', 'Swindon', 'SN2 1QG', 15.00, 3, true, false),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Mark', 'Davies', '07700100004', '2 Stratton Close', 'Swindon', 'SN3 4PB', 20.00, 4, true, true),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Linda', 'Evans', NULL, '58 Cricklade Road', 'Swindon', 'SN2 1AE', 25.00, 5, true, true),
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Robert', 'Harris', '07700100006', '9 Moredon Road', 'Swindon', 'SN2 2JG', 16.00, 6, true, true),
  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'Karen', 'Wright', '07700100007', '22 Haydon Wick Road', 'Swindon', 'SN25 1PQ', 28.00, 7, true, true),
  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'Trevor', 'Barnes', '07700100008', '45 Penhill Drive', 'Swindon', 'SN2 5DA', 14.00, 8, true, false),
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'Diane', 'Foster', '07700100009', '11 Abbey Meads', 'Swindon', 'SN25 4YR', 20.00, 9, true, true),
  ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'Paul', 'Richardson', '07700100010', '3 Blunsdon Road', 'Swindon', 'SN25 2DZ', 18.00, 10, true, true),

  -- Tuesday round
  ('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000002', 'Angela', 'Price', '07700200001', '6 Bath Road', 'Swindon', 'SN1 4BA', 22.00, 1, true, true),
  ('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000002', 'Stephen', 'Howard', '07700200002', '19 Lawn Road', 'Swindon', 'SN1 4NP', 18.00, 2, true, true),
  ('c1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000002', 'Margaret', 'Collins', '07700200003', '42 Old Town Mews', 'Swindon', 'SN1 3HG', 30.00, 3, true, true),
  ('c1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000002', 'Neil', 'Watson', '07700200004', '8 Walcot Road', 'Swindon', 'SN3 3AT', 16.00, 4, true, false),
  ('c1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', 'Rachel', 'King', '07700200005', '15 Queens Drive', 'Swindon', 'SN3 1BF', 24.00, 5, true, true),
  ('c1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000002', 'Graham', 'Taylor', '07700200006', '28 Marlborough Road', 'Swindon', 'SN3 1QG', 20.00, 6, true, true),
  ('c1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000002', 'Julie', 'Brown', '07700200007', '4 Drove Road', 'Swindon', 'SN1 3AG', 15.00, 7, true, true),
  ('c1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000002', 'Derek', 'Murphy', NULL, '55 Victoria Road', 'Swindon', 'SN1 3BD', 22.00, 8, true, true),

  -- Wednesday round
  ('c1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000003', 'Susan', 'Clarke', '07700300001', '3 High Street', 'Wroughton', 'SN4 9JU', 20.00, 1, true, true),
  ('c1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000003', 'Brian', 'Patel', '07700300002', '17 Devizes Road', 'Wroughton', 'SN4 0RZ', 25.00, 2, true, true),
  ('c1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000003', 'Wendy', 'Reed', '07700300003', '9 Markham Close', 'Chiseldon', 'SN4 0NX', 18.00, 3, true, true),
  ('c1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000003', 'Tony', 'Green', '07700300004', '44 New Road', 'Chiseldon', 'SN4 0LT', 22.00, 4, true, false),
  ('c1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000003', 'Janet', 'Phillips', '07700300005', '12 Butts Road', 'Chiseldon', 'SN4 0NH', 16.00, 5, true, true),

  -- Thursday round
  ('c1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000004', 'Keith', 'Adams', '07700400001', '6 High Street', 'Highworth', 'SN6 7AG', 20.00, 1, true, true),
  ('c1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000004', 'Carol', 'Bennett', '07700400002', '23 Lechlade Road', 'Highworth', 'SN6 7HD', 24.00, 2, true, true),
  ('c1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000004', 'Michael', 'Ward', '07700400003', '8 The Green', 'Highworth', 'SN6 7DB', 18.00, 3, true, true),
  ('c1000000-0000-0000-0000-000000000027', 'a1000000-0000-0000-0000-000000000004', 'Emma', 'Hughes', '07700400004', '31 Swindon Road', 'Highworth', 'SN6 7BZ', 22.00, 4, true, true),

  -- Inactive customer (no round)
  ('c1000000-0000-0000-0000-000000000028', NULL, 'Peter', 'Shaw', '07700500001', '10 Fleming Way', 'Swindon', 'SN1 2NG', 20.00, NULL, false, true);

-- ============================================
-- SAMPLE RUN (Monday round, today)
-- ============================================
INSERT INTO public.runs (id, round_id, name, scheduled_date, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Monday - Swindon North', CURRENT_DATE, 'planned');

-- Add customers to the run
INSERT INTO public.run_customers (run_id, customer_id, position, price) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 1, 18.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 2, 22.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 3, 15.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 4, 20.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 5, 25.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 6, 16.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 7, 28.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 8, 14.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000009', 9, 20.00),
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000010', 10, 18.00);

-- Assign the admin user as a cleaner on this run (for testing)
-- Run this AFTER the admin user exists:
INSERT INTO public.run_cleaners (run_id, cleaner_id)
SELECT 'e1000000-0000-0000-0000-000000000001', id FROM auth.users WHERE email = 'drowlands60@gmail.com';
