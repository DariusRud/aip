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

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function UploadedDocuments() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

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
                  <tr
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocumentId(doc.id);
                      setEditMode(doc.status === 'pending');
                    }}
                    className="hover:bg-gray-50 cursor-pointer"
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
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {doc.status === 'pending' ? 'Koreguoti' : 'Peržiūrėti'}
                      </button>
                    </td>
                  </tr>
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
