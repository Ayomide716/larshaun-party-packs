-- ============================================================
-- Run this in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Add invoice_ref column to sales (if not already present)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS invoice_ref text;

-- 2. Done! The app will now save and read invoice references correctly.
-- ============================================================
