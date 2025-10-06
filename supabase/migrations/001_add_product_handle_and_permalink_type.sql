-- Migration: Add product_handle and permalink_type to links table
-- This migration adds support for product permalinks and better permalink type tracking

-- Add new columns to links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS product_handle TEXT,
ADD COLUMN IF NOT EXISTS permalink_type TEXT DEFAULT 'product' CHECK (permalink_type IN ('product', 'cart'));

-- Update existing records to have default values
UPDATE links 
SET 
  product_handle = COALESCE(product_handle, 'legacy_link'),
  permalink_type = COALESCE(permalink_type, 'cart')
WHERE product_handle IS NULL OR permalink_type IS NULL;

-- Make product_handle NOT NULL after setting default values
ALTER TABLE links ALTER COLUMN product_handle SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_links_product_handle ON links(product_handle);
CREATE INDEX IF NOT EXISTS idx_links_permalink_type ON links(permalink_type);

-- Add comment for documentation
COMMENT ON COLUMN links.product_handle IS 'Shopify product handle for generating product permalinks';
COMMENT ON COLUMN links.permalink_type IS 'Type of permalink: product (uses product handle) or cart (uses variant ID)';
