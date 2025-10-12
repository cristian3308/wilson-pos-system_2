-- Migration: Add detailed closure columns
-- Date: 2025-10-11
-- Description: Adds parking_details and carwash_details columns to cash_closures table

-- Add parking_details column (stores detailed parking transaction data as JSON)
ALTER TABLE cash_closures ADD COLUMN parking_details TEXT DEFAULT '[]';

-- Add carwash_details column (stores detailed carwash transaction data as JSON)
ALTER TABLE cash_closures ADD COLUMN carwash_details TEXT DEFAULT '[]';
