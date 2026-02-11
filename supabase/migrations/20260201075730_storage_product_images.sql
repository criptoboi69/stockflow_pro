-- Create public bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,  -- PUBLIC bucket for product images
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view product images (public read)
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product-images');

-- RLS: Anyone can upload product images (for demo purposes)
-- In production, restrict to authenticated users
DROP POLICY IF EXISTS "public_upload_product_images" ON storage.objects;
CREATE POLICY "public_upload_product_images" 
ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'product-images');

-- RLS: Anyone can delete product images (for demo purposes)
-- In production, restrict to authenticated users or owners
DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;
CREATE POLICY "public_delete_product_images" 
ON storage.objects
FOR DELETE 
TO public
USING (bucket_id = 'product-images');
