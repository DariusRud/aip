/*
  # Pataisyti uploaded_documents NOT NULL constraint

  ## Problema
  Įkeliant naują dokumentą, dar neturime invoice_date ir invoice_number,
  nes tai bus užpildoma vėliau redagavimo formoje.

  ## Pakeitimai
  - Pakeisti `invoice_number` į nullable
  - Pakeisti `invoice_date` į nullable
  - Pridėti DEFAULT tuščią stringą invoice_number
  
  ## Priežastis
  Naujas workflow: 
  1. Įkeliame failą → sukuriamas įrašas su status='pending'
  2. Paspaudžiame ant eilutės → Redaguojame ir užpildome duomenis
  3. Išsaugome → Dokumentas atnaujinamas su visais duomenimis
*/

-- Pakeisti invoice_number į nullable su default reikšme
ALTER TABLE uploaded_documents 
  ALTER COLUMN invoice_number DROP NOT NULL,
  ALTER COLUMN invoice_number SET DEFAULT '';

-- Pakeisti invoice_date į nullable
ALTER TABLE uploaded_documents 
  ALTER COLUMN invoice_date DROP NOT NULL;

-- Atnaujinti esamus įrašus, jei reikia (safety)
UPDATE uploaded_documents 
SET invoice_number = '' 
WHERE invoice_number IS NULL;
