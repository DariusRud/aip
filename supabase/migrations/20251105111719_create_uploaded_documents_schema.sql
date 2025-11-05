/*
  # Įkeltų dokumentų schema (Dokumento atpažinimo sistema)

  ## 1. Naujos lentelės
  
  ### `uploaded_documents`
  Pagrindinė lentelė įkeltiems dokumentams (PDF/nuotraukos), kurie laukia apdorojimo
  - `id` (uuid, primary key)
  - `file_url` (text) - Kelias į failą Supabase Storage
  - `file_name` (text) - Originalus failo pavadinimas
  - `file_type` (text) - Failo tipas (pdf/jpg/png)
  - `status` (text) - Statusas: pending/approved/rejected
  - `extracted_data` (jsonb) - Visi nuskaityti duomenys (ateityje AI)
  - `company_id` (uuid, FK) - Susijusi įmonė (tiekėjas)
  - `supplier_name` (text) - Tiekėjo pavadinimas (kaip dokumente)
  - `supplier_code` (text) - Tiekėjo kodas
  - `invoice_number` (text) - Sąskaitos numeris
  - `invoice_date` (date) - Sąskaitos data
  - `due_date` (date, nullable) - Apmokėjimo terminas
  - `amount_no_vat` (decimal) - Suma be PVM
  - `vat_amount` (decimal) - PVM suma
  - `total_amount` (decimal) - Bendra suma su PVM
  - `currency` (text) - Valiuta (EUR)
  - `warnings` (jsonb) - Įspėjimai (dublikatai, klaidos)
  - `is_duplicate` (boolean) - Ar galimas dublikatas
  - `notes` (text, nullable) - Pastabos
  - `user_id` (uuid, FK) - Kas įkėlė dokumentą
  - `approved_by` (uuid, FK, nullable) - Kas patvirtino
  - `approved_at` (timestamptz, nullable) - Patvirtinimo laikas
  - `created_at` (timestamptz) - Sukūrimo laikas
  - `updated_at` (timestamptz) - Atnaujinimo laikas

  ### `document_items`
  Dokumento prekių/paslaugų eilutės
  - `id` (uuid, primary key)
  - `document_id` (uuid, FK) - Nuoroda į uploaded_documents
  - `line_number` (integer) - Eilės numeris dokumente
  - `description` (text) - Prekės/paslaugos aprašymas (kaip dokumente)
  - `supplier_product_code` (text, nullable) - Tiekėjo prekės kodas
  - `quantity` (decimal) - Kiekis
  - `unit` (text) - Matavimo vienetas (vnt/kg/m2/val...)
  - `unit_price` (decimal) - Vieneto kaina
  - `vat_rate` (decimal) - PVM tarifas (21/9/5/0)
  - `amount_no_vat` (decimal) - Suma be PVM
  - `amount_with_vat` (decimal) - Suma su PVM
  - `category_id` (uuid, FK, nullable) - Susieta prekių kategorija
  - `match_confidence` (integer, 0-100) - AI pasitikėjimo lygis (ateityje)
  - `match_type` (text, nullable) - Atpažinimo tipas: exact/fuzzy/manual/none
  - `suggested_categories` (jsonb, nullable) - AI pasiūlymai (ateityje)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Saugumas (RLS)
  - Įjungtas RLS abiem lentelėms
  - Autentifikuoti vartotojai gali:
    - Matyti visus dokumentus
    - Kurti naujus dokumentus
    - Redaguoti savo įkeltus dokumentus
    - Tvirtinti dokumentus (visi autentifikuoti)

  ## 3. Indeksai
  - Greitam paieškai pagal statusą, tiekėją, datą
  - Dublikatų tikrinimui (invoice_number + company_id)
*/

-- Sukurti uploaded_documents lentelę
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url text,
  file_name text,
  file_type text DEFAULT 'pdf',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  extracted_data jsonb DEFAULT '{}'::jsonb,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  supplier_name text,
  supplier_code text,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  amount_no_vat decimal(10,2) DEFAULT 0,
  vat_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  warnings jsonb DEFAULT '[]'::jsonb,
  is_duplicate boolean DEFAULT false,
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sukurti document_items lentelę
CREATE TABLE IF NOT EXISTS document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES uploaded_documents(id) ON DELETE CASCADE NOT NULL,
  line_number integer DEFAULT 1,
  description text NOT NULL,
  supplier_product_code text,
  quantity decimal(10,3) DEFAULT 1,
  unit text DEFAULT 'vnt',
  unit_price decimal(10,2) DEFAULT 0,
  vat_rate decimal(5,2) DEFAULT 21,
  amount_no_vat decimal(10,2) DEFAULT 0,
  amount_with_vat decimal(10,2) DEFAULT 0,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  match_confidence integer DEFAULT 0 CHECK (match_confidence >= 0 AND match_confidence <= 100),
  match_type text CHECK (match_type IN ('exact', 'fuzzy', 'manual', 'none', NULL)),
  suggested_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indeksai greičiui
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status ON uploaded_documents(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_company ON uploaded_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_date ON uploaded_documents(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user ON uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_duplicate ON uploaded_documents(company_id, invoice_number) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_document_items_document ON document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_items_category ON document_items(category_id);

-- Trigger automatiniam updated_at atnaujinimui
CREATE OR REPLACE FUNCTION update_uploaded_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uploaded_documents_updated_at
  BEFORE UPDATE ON uploaded_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_uploaded_documents_updated_at();

CREATE OR REPLACE FUNCTION update_document_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_items_updated_at
  BEFORE UPDATE ON document_items
  FOR EACH ROW
  EXECUTE FUNCTION update_document_items_updated_at();

-- RLS įjungimas
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

-- RLS politikos: uploaded_documents

CREATE POLICY "Authenticated users can view all documents"
  ON uploaded_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create documents"
  ON uploaded_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending documents"
  ON uploaded_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can approve documents"
  ON uploaded_documents
  FOR UPDATE
  TO authenticated
  USING (status = 'pending')
  WITH CHECK (status IN ('approved', 'rejected') AND auth.uid() = approved_by);

-- RLS politikos: document_items

CREATE POLICY "Authenticated users can view all document items"
  ON document_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create document items"
  ON document_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE id = document_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their pending documents"
  ON document_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE id = document_id
      AND user_id = auth.uid()
      AND status = 'pending'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE id = document_id
      AND user_id = auth.uid()
      AND status = 'pending'
    )
  );

CREATE POLICY "Users can delete items from their pending documents"
  ON document_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_documents
      WHERE id = document_id
      AND user_id = auth.uid()
      AND status = 'pending'
    )
  );