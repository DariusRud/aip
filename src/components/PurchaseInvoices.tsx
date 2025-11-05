import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  code: string | null;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string | null;
  company_vat_code: string | null;
  invoice_date: string;
  order_number: string | null;
  sum_netto: number;
  vat_amount: number;
  sum_with_vat: number;
  status: string;
  notes: string | null;
  created_at: string;
  companies?: Company;
}

interface PurchaseInvoicesProps {
  userRole: string;
}

function PurchaseInvoices({ userRole }: PurchaseInvoicesProps) {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  const [filters, setFilters] = useState({
    supplier: '',
    invoice_number: '',
    dateFrom: '',
    dateTo: '',
  });

  const [formData, setFormData] = useState({
    invoice_number: '',
    supplier_id: '',
    company_vat_code: '',
    invoice_date: new Date().toISOString().split('T')[0],
    order_number: '',
    sum_netto: 0,
    vat_amount: 0,
    sum_with_vat: 0,
    notes: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, code')
        .eq('type', 'supplier')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchase_invoices')
        .select(`
          *,
          companies:supplier_id (
            id,
            name,
            code
          )
        `)
        .order('invoice_date', { ascending: false });

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier);
      }

      if (filters.invoice_number) {
        query = query.ilike('invoice_number', `%${filters.invoice_number}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('invoice_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('invoice_date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const handleOpenModal = (invoice?: PurchaseInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoice_number: invoice.invoice_number,
        supplier_id: invoice.supplier_id || '',
        company_vat_code: invoice.company_vat_code || '',
        invoice_date: invoice.invoice_date,
        order_number: invoice.order_number || '',
        sum_netto: invoice.sum_netto || 0,
        vat_amount: invoice.vat_amount || 0,
        sum_with_vat: invoice.sum_with_vat || 0,
        notes: invoice.notes || '',
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoice_number: '',
        supplier_id: '',
        company_vat_code: '',
        invoice_date: new Date().toISOString().split('T')[0],
        order_number: '',
        sum_netto: 0,
        vat_amount: 0,
        sum_with_vat: 0,
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      setError('Tik administratoriai gali valdyti sąskaitas');
      return;
    }

    try {
      const dataToSubmit = {
        invoice_number: formData.invoice_number,
        supplier_id: formData.supplier_id || null,
        company_vat_code: formData.company_vat_code || null,
        invoice_date: formData.invoice_date,
        order_number: formData.order_number || null,
        sum_netto: formData.sum_netto,
        vat_amount: formData.vat_amount,
        sum_with_vat: formData.sum_with_vat,
        total_amount: formData.sum_with_vat,
        notes: formData.notes || null,
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from('purchase_invoices')
          .update(dataToSubmit)
          .eq('id', editingInvoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('purchase_invoices')
          .insert([dataToSubmit]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią sąskaitą?')) return;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchInvoices();
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gautų Sąskaitų Registras</h1>
            <p className="text-sm text-slate-500 mt-1">Pirkimo sąskaitų valdymas</p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Pridėti Sąskaitą
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiekėjas:</label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Visi tiekėjai</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sąsk. Nr.:</label>
            <input
              type="text"
              placeholder="Ieškoti..."
              value={filters.invoice_number}
              onChange={(e) => setFilters({ ...filters, invoice_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data nuo:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data iki:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ĮMONĖS KODAS</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">PVM KODAS</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">TIEKĖJAS</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">SĄSKAITOS DATA</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">SĄSKAITOS NUMERIS</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">UŽSAKYMO NUMERIS</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">SUMA NETTO</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">PVM</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">SUMA SU PVM</th>
                    {userRole === 'admin' && (
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">VEIKSMAI</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((invoice, index) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                      <td className="py-3 px-4 text-slate-800">{invoice.companies?.code || '-'}</td>
                      <td className="py-3 px-4 text-slate-800">{invoice.company_vat_code || '-'}</td>
                      <td className="py-3 px-4 text-slate-800">{invoice.companies?.name || 'Nenurodyta'}</td>
                      <td className="py-3 px-4 text-slate-600">{invoice.invoice_date}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-slate-600">{invoice.order_number || '-'}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{invoice.sum_netto?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{invoice.vat_amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {invoice.sum_with_vat?.toFixed(2) || '0.00'}
                      </td>
                      {userRole === 'admin' && (
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleOpenModal(invoice)}
                              className="text-blue-600 hover:text-blue-700 px-2 py-1"
                              title="Koreguoti"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="text-red-600 hover:text-red-700 px-2 py-1"
                              title="Trinti"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-file-invoice text-4xl mb-4"></i>
                  <p>Nerasta sąskaitų</p>
                </div>
              )}
            </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingInvoice ? 'Koreguoti Sąskaitą' : 'Nauja Sąskaita'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sąskaitos numeris <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiekėjas</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pasirinkite tiekėją</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PVM kodas</label>
                  <input
                    type="text"
                    value={formData.company_vat_code}
                    onChange={(e) => setFormData({ ...formData, company_vat_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sąskaitos data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Užsakymo numeris</label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suma netto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sum_netto}
                    onChange={(e) => {
                      const netto = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        sum_netto: netto,
                        sum_with_vat: netto + formData.vat_amount
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PVM</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat_amount}
                    onChange={(e) => {
                      const vat = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        vat_amount: vat,
                        sum_with_vat: formData.sum_netto + vat
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suma su PVM</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sum_with_vat}
                    onChange={(e) => setFormData({ ...formData, sum_with_vat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pastabos</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInvoice(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingInvoice ? 'Išsaugoti' : 'Pridėti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseInvoices;
