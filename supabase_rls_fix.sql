-- ============================================================
-- RLS FIX: Allow all authenticated users to access all data
-- Run this entire script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── PRODUCTS ─────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON public.products;
DROP POLICY IF EXISTS "Users can insert own records" ON public.products;
DROP POLICY IF EXISTS "Users can update own records" ON public.products;
DROP POLICY IF EXISTS "Users can delete own records" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Authenticated users can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- ── CUSTOMERS ─────────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own records" ON public.customers;
DROP POLICY IF EXISTS "Users can update own records" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own records" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "Authenticated users can view all customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (true);

-- ── SALES ─────────────────────────────────────────────────────
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON public.sales;
DROP POLICY IF EXISTS "Users can insert own records" ON public.sales;
DROP POLICY IF EXISTS "Users can update own records" ON public.sales;
DROP POLICY IF EXISTS "Users can delete own records" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;

CREATE POLICY "Authenticated users can view all sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
  ON public.sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales"
  ON public.sales FOR DELETE
  TO authenticated
  USING (true);

-- ── SALE_ITEMS ────────────────────────────────────────────────
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert own records" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update own records" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete own records" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can view all sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON public.sale_items;

CREATE POLICY "Authenticated users can view all sale_items"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sale_items"
  ON public.sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sale_items"
  ON public.sale_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sale_items"
  ON public.sale_items FOR DELETE
  TO authenticated
  USING (true);

-- ── EXPENSES ─────────────────────────────────────────────────
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own records" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own records" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own records" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own records" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

CREATE POLICY "Authenticated users can view all expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (true);

-- ── BUSINESS_SETTINGS ─────────────────────────────────────────
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.business_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.business_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.business_settings;
DROP POLICY IF EXISTS "Authenticated users can view all settings" ON public.business_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.business_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.business_settings;

CREATE POLICY "Authenticated users can view all settings"
  ON public.business_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON public.business_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON public.business_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
