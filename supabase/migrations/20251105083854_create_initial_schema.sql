/*
  # AIPLENK Initial Database Schema

  ## Overview
  This migration creates the complete database schema for the AIPLENK invoice processing system.
  
  ## New Tables
  
  ### 1. companies
  - `id` (uuid, primary key)
  - `code` (text, unique) - Company registration code
  - `name` (text) - Company name
  - `vat_code` (text) - VAT registration number
  - `address` (text) - Company address
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `type` (text) - 'supplier' or 'client'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. products
  - `id` (uuid, primary key)
  - `code` (text, unique) - Product code
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `unit` (text) - Unit of measurement
  - `category` (text) - Product category
  - `rivile_code` (text) - Mapping code for Rivile system
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. purchase_invoices
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Invoice number
  - `supplier_id` (uuid, foreign key to companies)
  - `invoice_date` (date) - Invoice date
  - `due_date` (date) - Payment due date
  - `total_amount` (numeric) - Total invoice amount
  - `vat_amount` (numeric) - VAT amount
  - `status` (text) - 'uploaded', 'validated', 'needs_review', 'exported'
  - `file_url` (text) - Original file URL
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. purchase_invoice_lines
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key to purchase_invoices)
  - `product_id` (uuid, foreign key to products, nullable)
  - `description` (text) - Line item description
  - `quantity` (numeric) - Quantity
  - `unit` (text) - Unit of measurement
  - `unit_price` (numeric) - Price per unit
  - `vat_rate` (numeric) - VAT rate percentage
  - `vat_amount` (numeric) - VAT amount
  - `total_amount` (numeric) - Total line amount
  - `status` (text) - 'recognized', 'unrecognized', 'manual'
  - `confidence_score` (numeric) - AI confidence score (0-1)
  - `created_at` (timestamptz)

  ### 5. sales_invoices
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Invoice number
  - `client_id` (uuid, foreign key to companies)
  - `invoice_date` (date) - Invoice date
  - `due_date` (date) - Payment due date
  - `total_amount` (numeric) - Total invoice amount
  - `vat_amount` (numeric) - VAT amount
  - `status` (text) - 'uploaded', 'validated', 'needs_review', 'exported'
  - `file_url` (text) - Original file URL
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. sales_invoice_lines
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key to sales_invoices)
  - `product_id` (uuid, foreign key to products, nullable)
  - `description` (text) - Line item description
  - `quantity` (numeric) - Quantity
  - `unit` (text) - Unit of measurement
  - `unit_price` (numeric) - Price per unit
  - `vat_rate` (numeric) - VAT rate percentage
  - `vat_amount` (numeric) - VAT amount
  - `total_amount` (numeric) - Total line amount
  - `status` (text) - 'recognized', 'unrecognized', 'manual'
  - `confidence_score` (numeric) - AI confidence score (0-1)
  - `created_at` (timestamptz)

  ### 7. exports
  - `id` (uuid, primary key)
  - `export_type` (text) - 'purchase', 'sales'
  - `export_format` (text) - 'rivile', 'csv', 'excel'
  - `invoice_count` (integer) - Number of invoices exported
  - `file_url` (text) - Export file URL
  - `status` (text) - 'processing', 'completed', 'failed'
  - `created_at` (timestamptz)

  ### 8. activity_log
  - `id` (uuid, primary key)
  - `action` (text) - Action type
  - `entity_type` (text) - Type of entity affected
  - `entity_id` (uuid) - ID of entity
  - `description` (text) - Action description
  - `user_name` (text) - User who performed action
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read access for authenticated users
  - Insert/update/delete restricted to authenticated users
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  vat_code text,
  address text,
  email text,
  phone text,
  type text NOT NULL CHECK (type IN ('supplier', 'client')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  unit text DEFAULT 'vnt',
  category text,
  rivile_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES companies(id),
  invoice_date date NOT NULL,
  due_date date,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'needs_review', 'exported')),
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_invoice_lines table
CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'vnt',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 21,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recognized' CHECK (status IN ('recognized', 'unrecognized', 'manual')),
  confidence_score numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create sales_invoices table
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES companies(id),
  invoice_date date NOT NULL,
  due_date date,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'needs_review', 'exported')),
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_invoice_lines table
CREATE TABLE IF NOT EXISTS sales_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'vnt',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 21,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recognized' CHECK (status IN ('recognized', 'unrecognized', 'manual')),
  confidence_score numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type text NOT NULL CHECK (export_type IN ('purchase', 'sales')),
  export_format text NOT NULL CHECK (export_format IN ('rivile', 'csv', 'excel')),
  invoice_count integer DEFAULT 0,
  file_url text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  user_name text DEFAULT 'Sistema',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for products
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for purchase_invoices
CREATE POLICY "Anyone can view purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for purchase_invoice_lines
CREATE POLICY "Anyone can view purchase invoice lines"
  ON purchase_invoice_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase invoice lines"
  ON purchase_invoice_lines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase invoice lines"
  ON purchase_invoice_lines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete purchase invoice lines"
  ON purchase_invoice_lines FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sales_invoices
CREATE POLICY "Anyone can view sales invoices"
  ON sales_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales invoices"
  ON sales_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales invoices"
  ON sales_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales invoices"
  ON sales_invoices FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sales_invoice_lines
CREATE POLICY "Anyone can view sales invoice lines"
  ON sales_invoice_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales invoice lines"
  ON sales_invoice_lines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales invoice lines"
  ON sales_invoice_lines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales invoice lines"
  ON sales_invoice_lines FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for exports
CREATE POLICY "Anyone can view exports"
  ON exports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exports"
  ON exports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exports"
  ON exports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for activity_log
CREATE POLICY "Anyone can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_lines_invoice ON purchase_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_lines_product ON purchase_invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_client ON sales_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_lines_invoice ON sales_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_lines_product ON sales_invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
