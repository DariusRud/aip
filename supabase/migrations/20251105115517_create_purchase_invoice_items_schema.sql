/*
  # Create Purchase Invoice Items Schema

  ## Overview
  This migration creates the items/products table for purchase invoices, allowing users to add multiple line items to each invoice.

  ## New Tables
  
  ### `purchase_invoice_items`
  Stores individual line items for each purchase invoice
  - `id` (uuid, primary key) - Unique identifier for each item
  - `uploaded_document_id` (uuid, foreign key) - References the parent invoice document
  - `item_name` (text) - Product/service description
  - `item_code` (text, nullable) - Product code/SKU
  - `quantity` (numeric, default 1) - Quantity of items
  - `unit` (text, default 'vnt') - Unit of measurement (vnt, kg, m, etc.)
  - `unit_price` (numeric, default 0) - Price per unit without VAT
  - `vat_rate` (numeric, default 21) - VAT rate percentage
  - `vat_amount` (numeric, default 0) - Calculated VAT amount
  - `total_amount` (numeric, default 0) - Total including VAT
  - `notes` (text, nullable) - Additional notes for this item
  - `created_at` (timestamptz) - When the item was created
  - `updated_at` (timestamptz) - When the item was last updated

  ## Security
  - Enable RLS on `purchase_invoice_items` table
  - Add policies for authenticated users to manage their invoice items
  - Items inherit access control from parent uploaded_document

  ## Important Notes
  1. Each invoice can have multiple items
  2. Totals are stored denormalized for performance
  3. VAT calculations are stored at item level
  4. Cascade delete when parent document is deleted
*/

-- Create purchase_invoice_items table
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_document_id uuid NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  item_name text NOT NULL DEFAULT '',
  item_code text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'vnt',
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 21,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items for documents they own
CREATE POLICY "Users can view own document items"
  ON purchase_invoice_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE uploaded_documents.id = purchase_invoice_items.uploaded_document_id
      AND uploaded_documents.user_id = auth.uid()
    )
  );

-- Policy: Users can insert items for documents they own
CREATE POLICY "Users can insert items for own documents"
  ON purchase_invoice_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE uploaded_documents.id = purchase_invoice_items.uploaded_document_id
      AND uploaded_documents.user_id = auth.uid()
    )
  );

-- Policy: Users can update items for documents they own
CREATE POLICY "Users can update own document items"
  ON purchase_invoice_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE uploaded_documents.id = purchase_invoice_items.uploaded_document_id
      AND uploaded_documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE uploaded_documents.id = purchase_invoice_items.uploaded_document_id
      AND uploaded_documents.user_id = auth.uid()
    )
  );

-- Policy: Users can delete items for documents they own
CREATE POLICY "Users can delete own document items"
  ON purchase_invoice_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE uploaded_documents.id = purchase_invoice_items.uploaded_document_id
      AND uploaded_documents.user_id = auth.uid()
    )
  );

-- Create index for faster lookups by document
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_document 
  ON purchase_invoice_items(uploaded_document_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_invoice_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_invoice_items_updated_at
  BEFORE UPDATE ON purchase_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_invoice_items_updated_at();
