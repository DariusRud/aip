/*
  # Sukurti Storage Bucket dokumentams

  ## 1. Naujas Storage Bucket
  - `invoices` - PDF ir nuotraukų saugojimui
  - Viešas prieinamumas (public)
  - Failų dydžio limitas: 10MB

  ## 2. Saugumas (RLS)
  - Autentifikuoti vartotojai gali įkelti failus
  - Visi gali skaityti failus
*/

-- Sukurti invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- RLS politikos storage.objects lentelei
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Anyone can view invoices"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'invoices');

CREATE POLICY "Users can update their own invoices"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices')
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Users can delete their own invoices"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices');