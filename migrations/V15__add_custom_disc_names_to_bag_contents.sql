-- Migration V15: Add custom disc names to bag_contents
-- Allows users to override disc brand/model names for their personal collection
-- Similar pattern to custom flight numbers - nullable fields that fall back to disc_master

-- Add custom brand and model fields to bag_contents table
ALTER TABLE bag_contents 
ADD COLUMN brand VARCHAR(50) NULL,
ADD COLUMN model VARCHAR(50) NULL;

-- Add comments for clarity
COMMENT ON COLUMN bag_contents.brand IS 'Custom brand name override for this specific disc instance (falls back to disc_master.brand if null)';
COMMENT ON COLUMN bag_contents.model IS 'Custom model name override for this specific disc instance (falls back to disc_master.model if null)';

-- Add indexes for potential searching/filtering by custom names
CREATE INDEX idx_bag_contents_brand ON bag_contents(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_bag_contents_model ON bag_contents(model) WHERE model IS NOT NULL;