import { useState, useEffect } from 'react';
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
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    item_name: '',
    item_code: '',
    quantity: 1,
    unit: 'vnt',
    unit_price: 0,
    vat_rate: 21,
  });

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

  const calculateItemTotals = (item: Partial<InvoiceItem>) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const vatRate = item.vat_rate || 0;

    const subtotal = quantity * unitPrice;
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;

    return {
      vat_amount: parseFloat(vat.toFixed(2)),
      total_amount: parseFloat(total.toFixed(2)),
    };
  };

  const handleAddItem = async () => {
    if (!expandedDocumentId || !newItem.item_name) return;

    const totals = calculateItemTotals(newItem);

    try {
      const { error } = await supabase.from('purchase_invoice_items').insert({
        uploaded_document_id: expandedDocumentId,
        item_name: newItem.item_name,
        item_code: newItem.item_code || null,
        quantity: newItem.quantity || 1,
        unit: newItem.unit || 'vnt',
        unit_price: newItem.unit_price || 0,
        vat_rate: newItem.vat_rate || 21,
        vat_amount: totals.vat_amount,
        total_amount: totals.total_amount,
        notes: null,
      });

      if (error) throw error;

      await fetchItems(expandedDocumentId);
      setNewItem({
        item_name: '',
        item_code: '',
        quantity: 1,
        unit: 'vnt',
        unit_price: 0,
        vat_rate: 21,
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async (item: InvoiceItem) => {
    const totals = calculateItemTotals(item);

    try {
      const { error } = await supabase
        .from('purchase_invoice_items')
        .update({
          item_name: item.item_name,
          item_code: item.item_code,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          vat_amount: totals.vat_amount,
          total_amount: totals.total_amount,
        })
        .eq('id', item.id);

      if (error) throw error;

      await fetchItems(expandedDocumentId!);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią prekę?')) return;

    try {
      const { error } = await supabase
        .from('purchase_invoice_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems(expandedDocumentId!);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
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
                  <>
                    <tr
                      key={doc.id}
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
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {doc.status === 'pending' ? 'Koreguoti' : 'Peržiūrėti'}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Prekių sąrašas
                            </h3>

                            {loadingItems ? (
                              <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <>
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
                                          Veiksmai
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                          {editingItem?.id === item.id ? (
                                            <>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="text"
                                                  value={editingItem.item_name}
                                                  onChange={(e) =>
                                                    setEditingItem({ ...editingItem, item_name: e.target.value })
                                                  }
                                                  className="w-full px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="text"
                                                  value={editingItem.item_code || ''}
                                                  onChange={(e) =>
                                                    setEditingItem({ ...editingItem, item_code: e.target.value })
                                                  }
                                                  className="w-full px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="number"
                                                  value={editingItem.quantity}
                                                  onChange={(e) =>
                                                    setEditingItem({
                                                      ...editingItem,
                                                      quantity: parseFloat(e.target.value),
                                                    })
                                                  }
                                                  className="w-20 px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="text"
                                                  value={editingItem.unit}
                                                  onChange={(e) =>
                                                    setEditingItem({ ...editingItem, unit: e.target.value })
                                                  }
                                                  className="w-16 px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="number"
                                                  step="0.01"
                                                  value={editingItem.unit_price}
                                                  onChange={(e) =>
                                                    setEditingItem({
                                                      ...editingItem,
                                                      unit_price: parseFloat(e.target.value),
                                                    })
                                                  }
                                                  className="w-24 px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <input
                                                  type="number"
                                                  value={editingItem.vat_rate}
                                                  onChange={(e) =>
                                                    setEditingItem({
                                                      ...editingItem,
                                                      vat_rate: parseFloat(e.target.value),
                                                    })
                                                  }
                                                  className="w-16 px-2 py-1 border rounded"
                                                />
                                              </td>
                                              <td className="px-4 py-2 text-sm">
                                                {calculateItemTotals(editingItem).vat_amount.toFixed(2)}
                                              </td>
                                              <td className="px-4 py-2 text-sm font-medium">
                                                {calculateItemTotals(editingItem).total_amount.toFixed(2)}
                                              </td>
                                              <td className="px-4 py-2">
                                                <button
                                                  onClick={() => handleUpdateItem(editingItem)}
                                                  className="text-green-600 hover:text-green-900 mr-2"
                                                >
                                                  <i className="fas fa-check"></i>
                                                </button>
                                                <button
                                                  onClick={() => setEditingItem(null)}
                                                  className="text-gray-600 hover:text-gray-900"
                                                >
                                                  <i className="fas fa-times"></i>
                                                </button>
                                              </td>
                                            </>
                                          ) : (
                                            <>
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
                                              <td className="px-4 py-2">
                                                <button
                                                  onClick={() => setEditingItem(item)}
                                                  className="text-blue-600 hover:text-blue-900 mr-2"
                                                >
                                                  <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteItem(item.id)}
                                                  className="text-red-600 hover:text-red-900"
                                                >
                                                  <i className="fas fa-trash"></i>
                                                </button>
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      ))}
                                      <tr className="bg-blue-50">
                                        <td className="px-4 py-2">
                                          <input
                                            type="text"
                                            value={newItem.item_name}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, item_name: e.target.value })
                                            }
                                            placeholder="Prekės pavadinimas"
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="text"
                                            value={newItem.item_code || ''}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, item_code: e.target.value })
                                            }
                                            placeholder="Kodas"
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })
                                            }
                                            className="w-20 px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="text"
                                            value={newItem.unit}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, unit: e.target.value })
                                            }
                                            className="w-16 px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={newItem.unit_price}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })
                                            }
                                            className="w-24 px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="number"
                                            value={newItem.vat_rate}
                                            onChange={(e) =>
                                              setNewItem({ ...newItem, vat_rate: parseFloat(e.target.value) })
                                            }
                                            className="w-16 px-2 py-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                          {calculateItemTotals(newItem).vat_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium">
                                          {calculateItemTotals(newItem).total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2">
                                          <button
                                            onClick={handleAddItem}
                                            disabled={!newItem.item_name}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                          >
                                            <i className="fas fa-plus mr-1"></i>
                                            Pridėti
                                          </button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                {items.length === 0 && (
                                  <p className="text-center text-gray-500 py-4">
                                    Nėra prekių. Pridėkite naują prekę naudodami formą aukščiau.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
