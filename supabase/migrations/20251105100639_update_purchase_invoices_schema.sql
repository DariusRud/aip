/*
  # Update Purchase Invoices Schema

  1. Changes
    - Add `company_vat_code` column to store supplier VAT code
    - Add `order_number` column to store purchase order reference
    - Add `sum_netto` column for amount without VAT
    - Add `sum_with_vat` column for total amount including VAT
    - Update existing columns to match requirements

  2. Notes
    - Keeping backward compatibility with existing data
    - All new columns are nullable to avoid breaking existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_invoices' AND column_name = 'company_vat_code'
  ) THEN
    ALTER TABLE purchase_invoices ADD COLUMN company_vat_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_invoices' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE purchase_invoices ADD COLUMN order_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_invoices' AND column_name = 'sum_netto'
  ) THEN
    ALTER TABLE purchase_invoices ADD COLUMN sum_netto numeric(12, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_invoices' AND column_name = 'sum_with_vat'
  ) THEN
    ALTER TABLE purchase_invoices ADD COLUMN sum_with_vat numeric(12, 2) DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);