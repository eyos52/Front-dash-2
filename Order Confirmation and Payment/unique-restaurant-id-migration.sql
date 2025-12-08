-- Migration to ensure unique restaurant_id values in requests table
-- Run this SQL in your Supabase SQL Editor

-- First, check for and handle any existing duplicate restaurant_id values
-- This query will show duplicates (run this first to see if there are any):
-- SELECT restaurant_id, COUNT(*) 
-- FROM requests 
-- WHERE kind = 'registration' AND restaurant_id IS NOT NULL
-- GROUP BY restaurant_id 
-- HAVING COUNT(*) > 1;

-- Optional: Fix existing duplicates by updating them with random unique IDs
-- Uncomment the following if you have duplicates to fix:
/*
UPDATE requests
SET restaurant_id = 'REST-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY id) as rn
    FROM requests
    WHERE kind = 'registration' 
      AND restaurant_id IS NOT NULL
      AND restaurant_id IN (
        SELECT restaurant_id 
        FROM requests 
        WHERE kind = 'registration' AND restaurant_id IS NOT NULL
        GROUP BY restaurant_id 
        HAVING COUNT(*) > 1
      )
  ) t WHERE rn > 1
);
*/

-- Add unique partial index on restaurant_id in requests table
-- This ensures that restaurant_id values are unique across all registration requests
-- Using a partial index (with WHERE clause) allows the same restaurant_id to exist
-- for different kinds of requests, but prevents duplicates for registration requests
DROP INDEX IF EXISTS unique_restaurant_id_registration_idx;
CREATE UNIQUE INDEX unique_restaurant_id_registration_idx 
ON requests (restaurant_id) 
WHERE kind = 'registration' AND restaurant_id IS NOT NULL;

-- Note: The index will prevent any future duplicate restaurant_id values for registration requests

