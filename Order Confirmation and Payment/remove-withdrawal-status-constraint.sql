-- Migration to remove NOT NULL constraint from withdrawal_status column
-- Run this SQL in your Supabase SQL Editor

-- Remove NOT NULL constraint from withdrawal_status column in restaurants table
-- This allows NULL values for new restaurants that haven't submitted withdrawal requests
ALTER TABLE restaurants 
ALTER COLUMN withdrawal_status DROP NOT NULL;

-- Optional: Set default value to NULL if you want (though DROP NOT NULL already allows NULL)
-- ALTER TABLE restaurants 
-- ALTER COLUMN withdrawal_status SET DEFAULT NULL;

