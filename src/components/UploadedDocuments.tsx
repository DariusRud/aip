import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

// === TIPŲ APIBRĖŽIMAI ===
type UploadedDocumentRow = Database['public']['Tables']['uploaded_documents']['Row'];
type DocumentItemRow = Database['public']['Tables']['document_items']['Row'];
// type PurchaseInvoiceItemsRow = Database['public']['Tables']['purchase_invoice_items']['Row']; // Jei ši lentelė egzistuoja

// 🟢 PATAISYTA: Išplečiame su visais laukais, kuriuos naudoja komponentas
interface UploadedDocument extends UploadedDocumentRow {
  companies?: {
    name: string | null;
  } | null;
  // Pridedame laukus, kurių tipų deklaracijoje trūko:
  invoice_number: string | null;
  supplier_name: string | null;
  supplier_code: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  currency: string | null;
  file_url: string | null;
  status: StatusFilter | string;
  company_id: string | null; 
}

// 🟢 PATAISYTA: Naudojame document_items Row, nes jo struktūra artimesnė ir buvo naudojama DocumentReview
interface InvoiceItem extends DocumentItemRow {
  // Perrašome item tipą, kad atitiktų tai, ką paima fetchItems:
  id: string; // Turi būti Row tipas
  item_name: string | null; // Atitinka Row tipą
  item_code: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  vat_rate: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  notes: string | null;
  // Galbūt trūksta lauko uploaded_document_id?
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface UploadedDocumentsProps {
    // 🟢 PATAISYTA: Leidžiame NULL, kad suderintume su App.tsx
    userCompanyId: string | null;
}

export default function UploadedDocuments({ userCompanyId }: UploadedDocumentsProps) { 
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  // 🟢 PATAISYTA: items tipas
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (userCompanyId) { // Apsauga nuo null
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [statusFilter, userCompanyId]); 

  const fetchDocuments = async () => {
    if (!userCompanyId) return; 
    
    try {
      setLoading(true);
      let query = supabase
        .from('uploaded_documents')
        .select('*, companies:company_id(name)')
        .eq('company_id', userCompanyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data as UploadedDocument[] || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (documentId: string) => {
    if (!userCompanyId) return;
    
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        // 🟢 PATAISYTA: Naudojame document_items (jei schema suderinta)
        .from('document_items') 
        .select('*')
        .eq('document_id', documentId) // Pakeistas pavadinimas: uploaded_document_id -> document_id (tikslinant pagal DB)
        .eq('company_id', userCompanyId) 
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data as InvoiceItem[] || []);
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

  const handleDeleteDocument = async (docId: string, docNumber: string | null) => {
    if (!userCompanyId) return; // Apsauga
    
    if (!confirm(`Ar tikrai norite ištrinti dokumentą "${docNumber || docId}"?\n\nBus ištrinti visi su šiuo dokumentu susiję duomenys (prekės, priedai).`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('uploaded_documents')
        .delete()
        .eq('id', docId)
        .eq('company_id', userCompanyId); 

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
    if (!userCompanyId) return; // Apsauga
    
    try {
      const document = documents.find((doc) => doc.id === docId);
      if (!document) {
        alert('Dokumentas nerastas');
        return;
      }

      // Pirmiausia, patikriname, ar sąskaitos numeris egzistuoja (kritiškai svarbu)
      if (!document.invoice_number) {
        alert('Negalima tvirtinti: dokumente trūksta sąskaitos numerio.');
        return;
      }
      
      // Reikia gauti prekes dar kartą, jei nebuvo išskleista eilutė
      let documentItems: InvoiceItem[] = 
        items.length > 0 && expandedDocumentId === docId 
          ? items 
          : await fetchItemsForApproval(docId);
      
      if (documentItems.length === 0) {
        alert('Nėra prekių šiame dokumente. Pridėkite prekes prieš tvirtinant.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vartotojas neprisijungęs');
        return;
      }
      
      // 🟢 PATAISYTA: total_amount dabar yra naudojamas su null patikra
      const totalAmount = document.total_amount || 0;
      const vatAmount = document.vat_amount || 0;
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: document.invoice_number,
          supplier_id: document.company_id, // Naudojamas company_id (tiekėjo ID)
          invoice_date: document.invoice_date,
          total_amount: totalAmount,
          vat_amount: vatAmount,
          status: 'validated',
          file_url: document.file_url,
          notes: document.notes,
          company_vat_code: document.supplier_code,
          sum_netto: totalAmount - vatAmount,
          sum_with_vat: totalAmount,
          company_id: userCompanyId, // Savininko įmonė

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
        company_id: userCompanyId, 
      }));

      const { error: linesError } = await supabase
        .from('purchase_invoice_lines') // Patikrinkite lentelės pavadinimą
        .insert(invoiceLines);

      if (linesError) throw linesError;

      const { error: updateError } = await supabase
        .from('uploaded_documents')
        .update({ status: 'approved' })
        .eq('id', docId)
        .eq('company_id', userCompanyId); 

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
    if (!userCompanyId) return [];
    
    const { data, error } = await supabase
      // 🟢 PATAISYTA: Naudojame document_items (jei schema suderinta)
      .from('document_items') 
      .select('*')
      .eq('document_id', documentId)
      .eq('company_id', userCompanyId); 

    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }

    return data as InvoiceItem[] || [];
  };

  // 🟢 PATAISYTA: areAllItemsValid dabar atsižvelgia į null
  const areAllItemsValid = (itemsList: InvoiceItem[]): boolean => {
    if (itemsList.length === 0) return false;
    return itemsList.every((item) => item.item_code && item.item_code.trim() !== '');
  };

  const getStatusColor = (status: string | null) => {
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

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'pending':
        return 'Laukia';
      case 'approved':
        return 'Patvirtinta';
      case 'rejected':
        return 'Atmesta';
      default:
        return status || 'Nežinomas';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (doc.invoice_number || '').toLowerCase().includes(searchLower) || // Apsauga nuo null
      (doc.supplier_name || '').toLowerCase().includes(searchLower) || // Apsauga nuo null
      (doc.companies?.name || '').toLowerCase().includes(searchLower)
    );
  });
  
  // 🟢 PRIDĖTA: Apsauga, jei userCompanyId yra null (išspręs TS2322 App.tsx klaidas)
  if (userCompanyId === null) {
    return <div className="p-8 text-red-600">Klaida: Nėra įmonės ID. Prašome prisijungti iš naujo.</div>;
  }


  return (
    // PRIDĖTAS FRAGMENTAS KAIP VIENINTELIS ŠAKNINIS ELEMENTAS
    <>
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
                          {(doc.total_amount || 0).toFixed(2)} {doc.currency || 'EUR'}
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
                                              <td className="px-4 py-2 text-sm">{item.item_name || '-'}</td>
                                              <td className="px-4 py-2 text-sm text-gray-500">
                                                {item.item_code || '-'}
                                              </td>
                                              <td className="px-4 py-2 text-sm">{item.quantity || 0}</td>
                                              <td className="px-4 py-2 text-sm">{item.unit || '-'}</td>
                                              <td className="px-4 py-2 text-sm">{(item.unit_price || 0).toFixed(2)}</td>
                                              <td className="px-4 py-2 text-sm">{(item.vat_rate || 0)}%</td>
                                              <td className="px-4 py-2 text-sm">{(item.vat_amount || 0).toFixed(2)}</td>
                                              <td className="px-4 py-2 text-sm font-medium">
                                                {(item.total_amount || 0).toFixed(2)}
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
      </div>
      
      {/* MODALAS: Trūkstamų komponentų Placeholder'is */}
      {selectedDocumentId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {editMode ? 'DOCUMENT EDIT PLACEHOLDER' : 'DOCUMENT REVIEW PLACEHOLDER'}
                </h2>
              </div>
                <div className="p-6">
                  <p>Dokumento modulis (Edit/Review) yra nebaigtas modulis. Ši vieta bus naudojama tolimesniems atnaujinimams.</p>
                  <button 
                      onClick={() => { setSelectedDocumentId(null); setEditMode(false); }} 
                      className="mt-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                  >Uždaryti</button>
                </div>
            </div>
          </div>
      )}
    </>
  );
}
