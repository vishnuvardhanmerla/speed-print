-- 1. Create the 'orders' table
CREATE TABLE public.orders (
    "id" text PRIMARY KEY,
    "date" text,
    "status" text,
    "customerName" text,
    "customerPhone" text,
    "fileName" text,
    "fileUrl" text,
    "fileSize" text,
    "pages" integer,
    "copies" integer,
    "printType" text,
    "paperSize" text,
    "binding" text,
    "notes" text,
    "totalPrice" numeric
);

-- Turn off Row Level Security (RLS) for testing purposes
-- Note: Enable RLS later when you are ready to launch!
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 2. Create the 'orders' storage bucket and make it public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('orders', 'orders', true);

-- 3. Allow public uploads to the orders storage bucket
CREATE POLICY "Public Uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'orders');

-- 4. Allow public reads from the orders storage bucket
CREATE POLICY "Public Views" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'orders');
