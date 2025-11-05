import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type UploadedDocument = Database['public']['Tables']['uploaded_documents']['Row'] & {
  companies?: {
    name: string;
    code: string;
  } | null;
};

type DocumentItem = Database['public']['Tables']['document_items']['Row'] & {
  product_categories?: {
    name: string;
  } | null;
};

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
      setDocument(docData);

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
      setItems(itemsData || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!document) return;

    try {
      setApproving(true);
      setMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Neautentifikuotas vartotojas');

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: document.invoice_number,
          supplier_id: document.company_id,
          invoice_date: document.invoice_date,
          due_date: document.due_date,
          total_amount: document.total_amount,
          vat_amount: document.vat_amount,
          status: 'uploaded',
          notes: document.notes,
        })
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
        vat_amount: (item.amount_no_vat * item.vat_rate) / 100,
        total_amount: item.amount_with_vat,
        status: item.category_id ? 'recognized' : 'unrecognized',
        confidence_score: item.match_confidence,
      }));

      const { error: linesError } = await supabase
        .from('purchase_invoice_lines')
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
                <p className="font-medium text-gray-900">
                  {new Date(document.invoice_date).toLocaleDateString('lt-LT')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Suma</p>
                <p className="font-medium text-gray-900">
                  {document.total_amount.toFixed(2)} {document.currency}
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
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.vat_rate}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {item.amount_with_vat.toFixed(2)} EUR
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
                <span className="font-semibold">{document.amount_no_vat.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>PVM suma:</span>
                <span className="font-semibold">{document.vat_amount.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Suma su PVM:</span>
                <span>{document.total_amount.toFixed(2)} EUR</span>
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
