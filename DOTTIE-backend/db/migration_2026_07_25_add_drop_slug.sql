-- Add slug to drops if missing
ALTER TABLE public.drops ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill any existing rows with a slug if they don't have one
UPDATE public.drops
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL;

-- Add index for slug lookups
CREATE INDEX IF NOT EXISTS idx_drops_slug ON public.drops(slug);
