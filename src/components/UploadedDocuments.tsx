import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import DocumentReview from './DocumentReview';
import DocumentEdit from './DocumentEdit';

type UploadedDocument = Database['public']['Tables']['uploaded_documents']['Row'] & {
  companies?: {
    name: string;
  } | null;
};

type InvoiceItem = {
  id: string;
  item_name: string;
  item_code: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  notes: string | null;
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function UploadedDocuments() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('uploaded_documents')
        .select(`
          *,
          companies:company_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (documentId: string) => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('purchase_invoice_items')
        .select('*')
        .eq('uploaded_document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleRowClick = async (docId: string) => {
    if (expandedDocumentId === docId) {
      setExpandedDocumentId(null);
      setItems([]);
    } else {
      setExpandedDocumentId(docId);
      await fetchItems(docId);
    }
  };

  const handleDeleteDocument = async (docId: string, docNumber: string) => {
    if (!confirm(`Ar tikrai norite ištrinti dokumentą "${docNumber}"?\n\nBus ištrinti visi su šiuo dokumentu susiję duomenys (prekės, priedai).`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('uploaded_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      await fetchDocuments();

      if (expandedDocumentId === docId) {
        setExpandedDocumentId(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Klaida ištrinant dokumentą. Bandykite dar kartą.');
    }
  };

  const handleApproveDocument = async (docId: string) => {
    try {
      const document = documents.find((doc) => doc.id === docId);
      if (!document) {
        alert('Dokumentas nerastas');
        return;
      }

      const documentItems = items.length > 0 ? items : await fetchItemsForApproval(docId);

      if (documentItems.length === 0) {
        alert('Nėra prekių šiame dokumente. Pridėkite prekes prieš tvirtinant.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vartotojas neprisijungęs');
        return;
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: document.invoice_number,
          supplier_id: document.company_id,
          invoice_date: document.invoice_date,
          total_amount: document.total_amount,
          vat_amount: document.vat_amount || 0,
          status: 'validated',
          file_url: document.file_url,
          notes: document.notes,
          company_vat_code: document.supplier_code,
          sum_netto: document.total_amount - (document.vat_amount || 0),
          sum_with_vat: document.total_amount,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceLines = documentItems.map((item) => ({
        invoice_id: invoiceData.id,
        product_id: null,
        description: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        vat_amount: item.vat_amount,
        total_amount: item.total_amount,
      }));

      const { error: linesError } = await supabase
        .from('purchase_invoice_lines')
        .insert(invoiceLines);

      if (linesError) throw linesError;

      const { error: updateError } = await supabase
        .from('uploaded_documents')
        .update({ status: 'approved' })
        .eq('id', docId);

      if (updateError) throw updateError;

      alert('Dokumentas sėkmingai patvirtintas ir perkeltas į pirkimo sąskaitas!');

      await fetchDocuments();

      if (expandedDocumentId === docId) {
        setExpandedDocumentId(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Klaida tvirtinant dokumentą. Patikrinkite ar sąskaitos numeris jau egzistuoja.');
    }
  };

  const fetchItemsForApproval = async (documentId: string): Promise<InvoiceItem[]> => {
    const { data, error } = await supabase
      .from('purchase_invoice_items')
      .select('*')
      .eq('uploaded_document_id', documentId);

    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }

    return data || [];
  };

  const areAllItemsValid = (itemsList: InvoiceItem[]): boolean => {
    if (itemsList.length === 0) return false;
    return itemsList.every((item) => item.item_code && item.item_code.trim() !== '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Laukia';
      case 'approved':
        return 'Patvirtinta';
      case 'rejected':
        return 'Atmesta';
      default:
        return status;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.invoice_number.toLowerCase().includes(searchLower) ||
      doc.supplier_name?.toLowerCase().includes(searchLower) ||
      doc.companies?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Įkelti dokumentai</h1>
        <p className="text-gray-600">Peržiūrėkite ir tvirtinkite įkeltus dokumentus</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Ieškoti pagal tiekėją, sąsk. numerį..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Visi
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Laukiantys
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Patvirtinti
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Kraunama...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statusas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiekėjas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sąsk. Nr.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veiksmai
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Dokumentų nerasta' : 'Nėra įkeltų dokumentų'}
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <Fragment key={doc.id}>
                    <tr
                      onClick={() => handleRowClick(doc.id)}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        expandedDocumentId === doc.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {getStatusText(doc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.companies?.name || doc.supplier_name || '-'}
                        </div>
                        {doc.supplier_code && (
                          <div className="text-sm text-gray-500">{doc.supplier_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.invoice_date ? new Date(doc.invoice_date).toLocaleDateString('lt-LT') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.total_amount.toFixed(2)} {doc.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocumentId(doc.id);
                            setEditMode(doc.status === 'pending');
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {doc.status === 'pending' ? 'Koreguoti' : 'Peržiūrėti'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id, doc.invoice_number);
                          }}
                          className="text-red-600 hover:text-red-900 mr-3"
                          title="Ištrinti dokumentą"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <i
                          className={`fas fa-chevron-${
                            expandedDocumentId === doc.id ? 'up' : 'down'
                          } text-gray-400`}
                        ></i>
                      </td>
                    </tr>
                    {expandedDocumentId === doc.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Prekių sąrašas</h3>
                              <div className="flex gap-2">
                                {doc.status === 'pending' && items.length > 0 && (
                                  <button
                                    onClick={() => handleApproveDocument(doc.id)}
                                    disabled={!areAllItemsValid(items)}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                      areAllItemsValid(items)
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={
                                      areAllItemsValid(items)
                                        ? 'Tvirtinti dokumentą'
                                        : 'Visos prekės turi būti validuotos (turėti kodą)'
                                    }
                                  >
                                    <i className="fas fa-check mr-2"></i>
                                    Tvirtinti
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedDocumentId(doc.id);
                                    setEditMode(true);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <i className="fas fa-edit mr-2"></i>
                                  Koreguoti
                                </button>
                              </div>
                            </div>

                            {loadingItems ? (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <>
                                {items.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">
                                    <p className="mb-4">Nėra nuskaitytų prekių šiame dokumente.</p>
                                    <button
                                      onClick={() => {
                                        setSelectedDocumentId(doc.id);
                                        setEditMode(true);
                                      }}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Pridėti prekes rankiniu būdu
                                    </button>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Prekė
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Kodas
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Kiekis
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Vnt.
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Kaina
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            PVM %
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            PVM
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Suma
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Statusas
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {items.map((item) => (
                                          <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm">{item.item_name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                              {item.item_code || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                                            <td className="px-4 py-2 text-sm">{item.unit}</td>
                                            <td className="px-4 py-2 text-sm">{item.unit_price.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm">{item.vat_rate}%</td>
                                            <td className="px-4 py-2 text-sm">{item.vat_amount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm font-medium">
                                              {item.total_amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                              {item.item_code && item.item_code.trim() !== '' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                  <i className="fas fa-check mr-1"></i>
                                                  OK
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                  <i className="fas fa-exclamation-triangle mr-1"></i>
                                                  Reikia koreguoti
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDocumentId && editMode && (
        <DocumentEdit
          documentId={selectedDocumentId}
          onClose={() => {
            setSelectedDocumentId(null);
            setEditMode(false);
            fetchDocuments();
          }}
          onSaved={() => {
            setSelectedDocumentId(null);
            setEditMode(false);
            fetchDocuments();
          }}
        />
      )}

      {selectedDocumentId && !editMode && (
        <DocumentReview
          documentId={selectedDocumentId}
          onClose={() => {
            setSelectedDocumentId(null);
            setEditMode(false);
          }}
          onApproved={() => {
            setSelectedDocumentId(null);
            setEditMode(false);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
