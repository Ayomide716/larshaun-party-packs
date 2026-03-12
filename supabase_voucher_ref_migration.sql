-- ============================================================
-- Run this in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. Add voucher_ref column to expenses (if not already present)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS voucher_ref text;

-- 2. Done! The app will now save and read voucher references correctly.
-- ============================================================
