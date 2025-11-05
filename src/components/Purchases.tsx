import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DateInput } from './DateInput';

interface Invoice {
  id: string;
  invoice_number: string;
  supplier: string;
  invoice_date: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  invoice_id: string;
  product_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface PurchasesProps {
  userRole: string;
}

function Purchases({ userRole }: PurchasesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    supplier: '',
    invoice_date: new Date().toISOString().split('T')[0],
    total_amount: 0,
    currency: 'EUR',
    notes: '',
  });

  const [newPurchase, setNewPurchase] = useState({
    product_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    unit: 'vnt',
    category_id: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchPurchases(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPurchases(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      setError('Tik administratoriai gali pridėti sąskaitas');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('invoices')
        .insert([{
          ...newInvoice,
          created_by: user?.id,
        }]);

      if (error) throw error;

      setShowInvoiceModal(false);
      setNewInvoice({
        invoice_number: '',
        supplier: '',
        invoice_date: new Date().toISOString().split('T')[0],
        total_amount: 0,
        currency: 'EUR',
        notes: '',
      });
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin' || !selectedInvoiceId) {
      setError('Pasirinkite sąskaitą');
      return;
    }

    try {
      const totalPrice = newPurchase.quantity * newPurchase.unit_price;

      const { error } = await supabase
        .from('purchases')
        .insert([{
          ...newPurchase,
          invoice_id: selectedInvoiceId,
          total_price: totalPrice,
          category_id: newPurchase.category_id || null,
        }]);

      if (error) throw error;

      setShowPurchaseModal(false);
      setNewPurchase({
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit: 'vnt',
        category_id: '',
      });
      fetchPurchases(selectedInvoiceId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią sąskaitą?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedInvoiceId === id) {
        setSelectedInvoiceId(null);
        setPurchases([]);
      }
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią prekę?')) return;

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedInvoiceId) {
        fetchPurchases(selectedInvoiceId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Kraunama...</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Prekės</h1>
            <p className="text-sm text-slate-500 mt-1">Pirkimų sąskaitų ir prekių valdymas</p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Pridėti Sąskaitą
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex gap-4 p-8">
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Sąskaitos</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {invoices.length === 0 ? (
              <div className="p-4 text-center text-slate-500">Nėra sąskaitų</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedInvoiceId === invoice.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{invoice.invoice_number}</div>
                        <div className="text-sm text-slate-600">{invoice.supplier}</div>
                        <div className="text-xs text-slate-500 mt-1">{formatDate(invoice.invoice_date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {invoice.total_amount.toFixed(2)} {invoice.currency}
                        </div>
                        {userRole === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvoice(invoice.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm mt-1"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {selectedInvoiceId ? 'Prekės sąskaitoje' : 'Pasirinkite sąskaitą'}
            </h2>
            {selectedInvoiceId && userRole === 'admin' && (
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Pridėti Prekę
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedInvoiceId ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                Pasirinkite sąskaitą iš kairės sąrašo
              </div>
            ) : purchases.length === 0 ? (
              <div className="p-4 text-center text-slate-500">Sąskaitoje nėra prekių</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Prekė</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Kiekis</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Vnt. kaina</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Suma</th>
                    {userRole === 'admin' && (
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Veiksmai</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{purchase.product_name}</div>
                        {purchase.description && (
                          <div className="text-sm text-slate-500">{purchase.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {purchase.quantity} {purchase.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {purchase.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {purchase.total_price.toFixed(2)}
                      </td>
                      {userRole === 'admin' && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Nauja Sąskaita</h2>
            <form onSubmit={handleAddInvoice}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sąskaitos numeris</label>
                  <input
                    type="text"
                    value={newInvoice.invoice_number}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiekėjas</label>
                  <input
                    type="text"
                    value={newInvoice.supplier}
                    onChange={(e) => setNewInvoice({ ...newInvoice, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <DateInput
                  label="Data"
                  value={newInvoice.invoice_date}
                  onChange={(value) => setNewInvoice({ ...newInvoice, invoice_date: value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suma</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.total_amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, total_amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pastabos</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pridėti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Nauja Prekė</h2>
            <form onSubmit={handleAddPurchase}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prekės pavadinimas</label>
                  <input
                    type="text"
                    value={newPurchase.product_name}
                    onChange={(e) => setNewPurchase({ ...newPurchase, product_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aprašymas</label>
                  <input
                    type="text"
                    value={newPurchase.description}
                    onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategorija</label>
                  <select
                    value={newPurchase.category_id}
                    onChange={(e) => setNewPurchase({ ...newPurchase, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pasirinkite kategoriją</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kiekis</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newPurchase.quantity}
                      onChange={(e) => setNewPurchase({ ...newPurchase, quantity: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vienetas</label>
                    <select
                      value={newPurchase.unit}
                      onChange={(e) => setNewPurchase({ ...newPurchase, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="vnt">vnt</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                      <option value="m">m</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vieneto kaina</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPurchase.unit_price}
                    onChange={(e) => setNewPurchase({ ...newPurchase, unit_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Suma:</span>
                    <span className="text-lg font-bold text-slate-800">
                      {(newPurchase.quantity * newPurchase.unit_price).toFixed(2)} EUR
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pridėti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;
