-- Run this in your Supabase SQL editor to add the invoice_ref column to the sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS invoice_ref text;
