-- Add Status column to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'; -- draft, published, private

-- Add Gallery support if not already explicitly handled in state
-- (Already created product_gallery table in previous migration)
