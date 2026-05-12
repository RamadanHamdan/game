-- ============================================================================
-- Setup Supabase untuk Self-Hosted Update System
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Buat tabel app_updates untuk menyimpan metadata versi
CREATE TABLE IF NOT EXISTS app_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    bundle_path TEXT NOT NULL,
    checksum TEXT,
    notes TEXT DEFAULT '',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_app_updates_active ON app_updates (active, created_at DESC);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Semua user (termasuk anon) bisa SELECT (baca versi terbaru)
CREATE POLICY "Allow public read access to app_updates"
    ON app_updates
    FOR SELECT
    USING (true);

-- 4. Policy: Hanya service_role yang bisa INSERT/UPDATE/DELETE
--    (script deploy-update.js menggunakan service_role key)
CREATE POLICY "Allow service role full access to app_updates"
    ON app_updates
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE BUCKET — Jalankan langkah ini manual di Supabase Dashboard:
-- 
-- 1. Buka Supabase Dashboard → Storage
-- 2. Klik "New Bucket"
-- 3. Nama bucket: app-bundles
-- 4. Public bucket: OFF (private — kita pakai signed URLs)
-- 5. File size limit: 50 MB
-- 6. Allowed MIME types: application/zip, application/x-zip-compressed
--
-- Atau jalankan SQL berikut:
-- ============================================================================

-- Buat bucket via SQL (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-bundles',
    'app-bundles',
    false,
    52428800,  -- 50 MB
    ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow service_role to upload
CREATE POLICY "Allow service role to manage app bundles"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'app-bundles' AND auth.role() = 'service_role')
    WITH CHECK (bucket_id = 'app-bundles' AND auth.role() = 'service_role');

-- Storage policy: Allow anon to read (download) bundles via signed URL
CREATE POLICY "Allow public download of app bundles"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'app-bundles');
