/*
  # Fix RLS Performance and Security Issues

  1. Performance Improvements
    - Optimize RLS policies by wrapping auth functions in SELECT
    - This prevents re-evaluation for each row and improves performance at scale

  2. Cleanup
    - Remove unused indexes to reduce database overhead
    - Keep only indexes that are actively used

  3. Changes Made
    - Drop and recreate all profiles table policies with optimized queries
    - Remove 13 unused indexes from various tables
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and self can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles only" ON profiles;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins and self can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete user profiles only"
  ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (SELECT auth.uid()) 
      AND profiles.role = 'admin'
    )
    AND role = 'user'
  );

-- Remove unused indexes
DROP INDEX IF EXISTS idx_purchase_invoice_lines_product;
DROP INDEX IF EXISTS idx_sales_invoices_status;
DROP INDEX IF EXISTS idx_sales_invoices_client;
DROP INDEX IF EXISTS idx_sales_invoice_lines_invoice;
DROP INDEX IF EXISTS idx_sales_invoice_lines_product;
DROP INDEX IF EXISTS idx_activity_log_created;
DROP INDEX IF EXISTS idx_companies_type;
DROP INDEX IF EXISTS idx_companies_code;
DROP INDEX IF EXISTS idx_products_code;
DROP INDEX IF EXISTS idx_purchase_invoices_status;
DROP INDEX IF EXISTS idx_purchase_invoices_supplier;
DROP INDEX IF EXISTS idx_purchase_invoice_lines_invoice;