-- Ensure product_categories has SEO columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='meta_title') THEN
        ALTER TABLE public.product_categories ADD COLUMN meta_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='meta_description') THEN
        ALTER TABLE public.product_categories ADD COLUMN meta_description TEXT;
    END IF;
END $$;
