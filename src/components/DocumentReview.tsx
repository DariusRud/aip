import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Būtina užtikrinti, kad šis failas būtų atnaujintas (su visais laukais, kuriuos pridėjote)
import { Database } from '../types/database'; 

// === TIPŲ APIBRĖŽIMAI ===
// Ištraukiame bazinius tipus iš jūsų atnaujintos DB schemos
type UploadedDocumentRow = Database['public']['Tables']['uploaded_documents']['Row'];
type DocumentItemRow = Database['public']['Tables']['document_items']['Row'];
type PurchaseInvoiceInsert = Database['public']['Tables']['purchase_invoices']['Insert'];

// 🟢 PATAISYTA: Sukuriamas pilnas tipas, įskaitant JOIN'intus duomenis
interface UploadedDocument extends UploadedDocumentRow {
    companies: { 
        name: string | null; 
        code: string | null; 
    } | null;
    // Pridėkite kitus laukus, jei Jūsų DB schemoje jie yra Optional (NULL)
    invoice_number: string | null;
    supplier_name: string | null;
    supplier_code: string | null;
    invoice_date: string | null;
    due_date: string | null;
    total_amount: number | null;
    vat_amount: number | null;
    amount_no_vat: number | null;
    currency: string | null;
    notes: string | null;
    status: string | null;
    company_id: string | null;
    approved_by: string | null;
    approved_at: string | null;
}

// 🟢 PATAISYTA: Sukuriamas pilnas tipas document_items
interface DocumentItem extends DocumentItemRow {
    product_categories: { 
        name: string | null; 
    } | null;
    // Pridėkite kitus laukus, jei Jūsų DB schemoje jie yra Optional (NULL)
    description: string | null;
    quantity: number | null;
    unit: string | null;
    unit_price: number | null;
    vat_rate: number | null;
    amount_no_vat: number | null;
    amount_with_vat: number | null;
    category_id: string | null;
    match_confidence: number | null;
}


interface DocumentReviewProps {
  documentId: string;
  onClose: () => void;
  onApproved: () => void;
}

export default function DocumentReview({ documentId, onClose, onApproved }: DocumentReviewProps) {
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDocumentDetails();
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);

      const { data: docData, error: docError } = await supabase
        .from('uploaded_documents')
        .select(
          `
          *,
          companies:company_id (
            name,
            code
          )
        `
        )
        .eq('id', documentId)
        .single();

      if (docError) throw docError;
      setDocument(docData as UploadedDocument); // Užtikriname, kad tipas atitinka išplėstą tipą

      const { data: itemsData, error: itemsError } = await supabase
        .from('document_items')
        .select(
          `
          *,
          product_categories:category_id (
            name
          )
        `
        )
        .eq('document_id', documentId)
        .order('line_number');

      if (itemsError) throw itemsError;
      setItems(itemsData as DocumentItem[] || []); // Užtikriname tipą
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!document || !document.invoice_number || !document.company_id || !document.invoice_date || !document.total_amount) {
      setMessage({ type: 'error', text: 'Trūksta esminės sąskaitos informacijos (Nr., ID, Data, Suma).' });
      return;
    }

    try {
      setApproving(true);
      setMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Neautentifikuotas vartotojas');

      // 🟢 PATAISYTA: Naudojame PurchaseInvoiceInsert tipą
      const invoiceToInsert: PurchaseInvoiceInsert = {
        invoice_number: document.invoice_number,
        supplier_id: document.company_id, // Naudojame company_id kaip supplier_id
        invoice_date: document.invoice_date,
        due_date: document.due_date,
        total_amount: document.total_amount,
        vat_amount: document.vat_amount,
        status: 'uploaded', // Nustatomas statusas, kuris jau yra DB tipuose
        notes: document.notes,
        // Būtini laukai, kurie buvo praleisti, bet yra DB schemoje (rekomenduojama įtraukti)
        sum_netto: document.amount_no_vat,
        sum_with_vat: document.total_amount,
        company_id: document.company_id, // Įmonė, kuriai skirta sąskaita

      };


      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert(invoiceToInsert)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const purchaseLines = items.map((item) => ({
        invoice_id: invoiceData.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        // 🟢 PATAISYTA: Apsauga nuo NULL skaičiavimuose
        vat_amount: ((item.amount_no_vat || 0) * (item.vat_rate || 0)) / 100, 
        total_amount: item.amount_with_vat,
        status: item.category_id ? 'recognized' : 'unrecognized', // Pridėtas statusas, jei schema reikalauja
        confidence_score: item.match_confidence,
        // Reikėtų pridėti 'purchase_invoice_lines' lentelės laukus, jei yra:
        // line_number: item.line_number
      }));

      const { error: linesError } = await supabase
        .from('purchase_invoice_lines') // Turi atitikti jūsų DB lentelės pavadinimą
        .insert(purchaseLines);

      if (linesError) throw linesError;

      const { error: updateError } = await supabase
        .from('uploaded_documents')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Dokumentas sėkmingai patvirtintas!' });
      setTimeout(() => {
        onApproved();
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!document) return;

    try {
      setApproving(true);
      setMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Neautentifikuotas vartotojas');

      const { error } = await supabase
        .from('uploaded_documents')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Dokumentas atmestas' });
      setTimeout(() => {
        onApproved();
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const matchedItems = items.filter((item) => item.category_id).length;
  const totalItems = items.length;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dokumento peržiūra</h2>
            <p className="text-gray-600">
              {document.invoice_number} - {document.companies?.name || document.supplier_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {message && (
          <div
            className={`mx-8 mt-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumento informacija</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tiekėjas</p>
                <p className="font-medium text-gray-900">
                  {document.companies?.name || document.supplier_name}
                </p>
                <p className="text-sm text-gray-500">{document.supplier_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sąskaitos Nr.</p>
                <p className="font-medium text-gray-900">{document.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data</p>
                {/* 🟢 PATAISYTA: Pridedame patikrą datai (gali būti null) */}
                <p className="font-medium text-gray-900">
                  {document.invoice_date ? new Date(document.invoice_date).toLocaleDateString('lt-LT') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Suma</p>
                <p className="font-medium text-gray-900">
                    {/* 🟢 PATAISYTA: Pridedame patikrą skaičiui */}
                  {(document.total_amount || 0).toFixed(2)} {document.currency}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Atpažinta prekių</p>
              <p className="text-2xl font-bold text-blue-900">
                {matchedItems} / {totalItems}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">Tikslumas</div>
              <div className="text-2xl font-bold text-blue-900">
                {totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0}%
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prekės / Paslaugos ({items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aprašymas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kiekis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kaina
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      PVM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Suma
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kategorija
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className={item.category_id ? '' : 'bg-yellow-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                        {item.quantity || 0} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                        {(item.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{(item.vat_rate || 0)}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                        {(item.amount_with_vat || 0).toFixed(2)} EUR
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.category_id ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fas fa-check mr-1"></i>
                            {item.product_categories?.name || 'Priskirta'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Nenurodyta
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sumos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Suma be PVM:</span>
                {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                <span className="font-semibold">{(document.amount_no_vat || 0).toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>PVM suma:</span>
                {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                <span className="font-semibold">{(document.vat_amount || 0).toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Suma su PVM:</span>
                {/* 🟢 PATAISYTA: Pridedame patikrą skaičiams */}
                <span>{(document.total_amount || 0).toFixed(2)} EUR</span>
              </div>
            </div>
          </div>

          {document.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pastabos</h3>
              <p className="text-gray-600">{document.notes}</p>
            </div>
          )}
        </div>

        {document.status === 'pending' && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex gap-4">
            <button
              onClick={handleReject}
              disabled={approving}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Atmesti
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {approving ? 'Tvirtinama...' : 'Tvirtinti dokumentą'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
