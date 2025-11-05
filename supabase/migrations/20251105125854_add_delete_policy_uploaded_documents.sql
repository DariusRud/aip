/*
  # Pridėti ištrynimo politiką įkeltiems dokumentams
  
  1. Pakeitimai
    - Pridėti DELETE politiką `uploaded_documents` lentelei
    - Visi autentifikuoti vartotojai gali ištrinti dokumentus (laikinai)
    - Vėliau bus pridėtos teisių ribos (tik savininkas ar admin)
  
  2. Saugumas
    - Kolkas leidžiama visiems autentifikuotiems vartotojams
    - CASCADE ištrynimas automatiškai ištrina visas susietas prekes
*/

-- Pridėti DELETE politiką uploaded_documents
CREATE POLICY "Authenticated users can delete documents"
  ON uploaded_documents
  FOR DELETE
  TO authenticated
  USING (true);
