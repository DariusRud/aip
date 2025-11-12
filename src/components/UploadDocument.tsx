import { useState } from 'react';
import { supabase } from '../lib/supabase';
// Būtini tipai
import { Database } from '../types/database';

// Tipas INSERT operacijai
type UploadedDocumentInsert = Database['public']['Tables']['uploaded_documents']['Insert'];

interface Props {
  onUploadSuccess?: () => void;
  // 🟢 PATAISYTA: Leidžiame NULL, kad suderintume su App.tsx siunčiamu tipu
  userCompanyId: string | null; 
}

// PAKEISTA: Funkcija dabar priima userCompanyId
export default function UploadDocument({ onUploadSuccess, userCompanyId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 🟢 PRIDĖTA: Kritinė patikra. Jei nėra ID, negalima įkelti!
    if (!userCompanyId) {
        setMessage({ type: 'error', text: 'Klaida: Nepavyko gauti įmonės ID.' });
        return;
    }

    try {
      setUploading(true);
      setMessage(null);
      setUploadedCount(0);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Neautentifikuotas vartotojas');

      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          console.warn(`Praleistas failas ${file.name} - netinkamas tipas`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Praleistas failas ${file.name} - per didelis`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        // Pridedame company_id į failo kelią, kad būtų lengviau administruoti (geroji praktika)
        const filePath = `documents/${userCompanyId}/${fileName}`; 

        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Klaida įkeliant ${file.name}:`, uploadError);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('invoices').getPublicUrl(filePath);

        const fileType = file.type.includes('pdf') ? 'pdf' : 'image';

        // 🟢 PATAISYTA: Naudojame UploadedDocumentInsert tipą ir užtikriname teisingus tipus (null, 0)
        const documentData: UploadedDocumentInsert = {
          file_url: publicUrl,
          file_name: file.name,
          file_type: fileType,
          company_id: userCompanyId, 
            // 🟢 Pradinės reikšmės, kurios tikriausiai yra NULL arba 0 DB schemoje
          supplier_name: null, // Siunčiame NULL, o ne tuščią string
          supplier_code: null, // Siunčiame NULL, o ne tuščią string
          invoice_number: null, // Siunčiame NULL, o ne tuščią string
          invoice_date: null,
          due_date: null,
          amount_no_vat: 0,
          vat_amount: 0,
          total_amount: 0,
          notes: null,
          user_id: user.id,
          status: 'pending',
        };

        const { error: docError } = await supabase.from('uploaded_documents').insert(documentData);

        if (docError) {
          console.error(`Klaida išsaugant ${file.name}:`, docError);
          continue;
        }

        successCount++;
        setUploadedCount(successCount);
      }

      if (successCount > 0) {
        setMessage({
          type: 'success',
          text: `Sėkmingai įkelta ${successCount} ${successCount === 1 ? 'dokumentas' : 'dokumentai'}.`,
        });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setMessage({ type: 'error', text: 'Nepavyko įkelti nei vieno dokumento.' });
      }

      e.target.value = '';
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Įkelti naują dokumentą</h1>
          <p className="text-gray-600">
            Įkelkite vieną ar kelis dokumentus. Galite pasirinkti kelis failus vienu metu.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.type === 'success' && (
                  <i className="fas fa-check-circle mr-2"></i>
                )}
                {message.text}
              </div>
              {message.type === 'success' && onUploadSuccess && (
                <button
                  onClick={onUploadSuccess}
                  className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <span>Eiti į sąrašą</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <i className="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Įkelkite dokumento failą(-us)
            </h3>
            <p className="text-gray-600 mb-6">PDF, JPG arba PNG (maks. 10MB kiekvienam)</p>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              multiple
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-block px-6 py-3 rounded-lg transition-colors ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              } text-white font-medium`}
            >
              {uploading ? 'Įkeliama...' : 'Pasirinkti failą(-us)'}
            </label>

            {uploading && uploadedCount > 0 && (
              <div className="mt-4 text-gray-600">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Įkelta: {uploadedCount}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              Kaip naudotis:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Pasirinkite vieną ar kelis failus iš karto</li>
              <li>Failai bus automatiškai įkelti į sistemą</li>
              <li>Galite įkelti papildomų dokumentų arba eiti į sąrašą</li>
              <li>Sąraše paspauskite ant eilutės, kad užpildytumėte duomenis</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
