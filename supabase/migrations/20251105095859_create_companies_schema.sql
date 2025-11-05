/*
  # Create Companies Schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text) - company name
      - `company_code` (text, nullable) - company registration code
      - `vat_code` (text, nullable) - VAT code
      - `address` (text, nullable) - company address
      - `city` (text, nullable) - city
      - `postal_code` (text, nullable) - postal code
      - `country` (text) - country, default 'Lietuva'
      - `phone` (text, nullable) - phone number
      - `email` (text, nullable) - email
      - `website` (text, nullable) - website
      - `type` (text) - company type: 'buyer', 'supplier', 'both'
      - `notes` (text, nullable) - additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on companies table
    - Authenticated users can read all companies
    - Only admins can insert, update, and delete companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_code text,
  vat_code text,
  address text,
  city text,
  postal_code text,
  country text NOT NULL DEFAULT 'Lietuva',
  phone text,
  email text,
  website text,
  type text NOT NULL DEFAULT 'both' CHECK (type IN ('buyer', 'supplier', 'both')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);