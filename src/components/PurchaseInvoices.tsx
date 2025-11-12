import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Būtini tipai, reikalingi teisingam schemos atvaizdavimui
import { Database } from '../types/database'; 

// === TIPŲ APIBRĖŽIMAI ===
// Pataisyti tipai pagal Supabase schemą
type Company = Database['public']['Tables']['companies']['Row'];
type PurchaseInvoiceRow = Database['public']['Tables']['purchase_invoices']['Row'];
type PurchaseInvoiceInsert = Database['public']['Tables']['purchase_invoices']['Insert'];
type PurchaseInvoiceUpdate = Database['public']['Tables']['purchase_invoices']['Update'];

// Pakeičiame PurchaseInvoice tipą, kad atspindėtume priskirtą 'companies' objektą
interface PurchaseInvoice extends PurchaseInvoiceRow {
  // companies bus priskirtas iš 'companies:supplier_id(id, name, code)'
  companies: Pick<Company, 'id' | 'name' | 'code'> | null; 
}

interface PurchaseInvoicesProps {
  userRole: string;
  // 🟢 PATAISYTA: Leidžiame NULL, kad suderintume su App.tsx siunčiamu tipu
  userCompanyId: string | null; 
}

function PurchaseInvoices({ userRole, userCompanyId }: PurchaseInvoicesProps) { 
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState({
    supplier: '',
    invoice_number: '',
    dateFrom: '',
    dateTo: '',
  });

  // 🟢 PATAISYTA: setFormData dabar naudoja tik skaitinius tipus ir leidžiame supplier_id būti null
  const [formData, setFormData] = useState<Omit<PurchaseInvoiceInsert, 'company_id' | 'created_at' | 'status'>>({
    invoice_number: '',
    supplier_id: null, // Nustatome į null, kaip priima DB, o ne tuščią string
    company_vat_code: null,
    invoice_date: new Date().toISOString().split('T')[0],
    order_number: null,
    sum_netto: 0,
    vat_amount: 0,
    sum_with_vat: 0,
    notes: null,
    total_amount: 0 // Pridėtas total_amount
  });

  useEffect(() => {
    // 🟢 Pridedame patikrą: jei company ID yra null, dar nepradedame krauti
    if (userCompanyId) {
      fetchInvoices();
      fetchCompanies();
    } else {
      setLoading(false);
    }
  }, [userCompanyId]); 

  const fetchCompanies = async () => {
    try {
      // Ištaisyta, kad naudotų Supabase tipus
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, code')
        .eq('is_supplier', true)
        .order('name');

      if (error) throw error;
      setCompanies(data as Company[] || []);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchInvoices = async () => {
    // 🟢 Patikra, jei company ID yra null (jei useEffect neapsaugojo)
    if (!userCompanyId) return; 

    try {
      setLoading(true);
      let query = supabase
        .from('purchase_invoices')
        // Select atnaujintas, kad atitiktų PurchaseInvoice interfeisą
        .select('*, companies:supplier_id(id, name, code)') 
        .eq('company_id', userCompanyId) 
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
      setInvoices(data as PurchaseInvoice[] || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCompanyId) {
      fetchInvoices();
    }
  }, [filters, userCompanyId]);

  const handleOpenModal = (invoice?: PurchaseInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        invoice_number: invoice.invoice_number,
        // 🟢 PATAISYTA: Atitinka formData tipą
        supplier_id: invoice.supplier_id, 
        company_vat_code: invoice.company_vat_code,
        invoice_date: formatDate(invoice.invoice_date),
        order_number: invoice.order_number,
        // 🟢 PATAISYTA: Patikros su 0, kad išvengti NULL klaidų skaičiuojant
        sum_netto: invoice.sum_netto || 0, 
        vat_amount: invoice.vat_amount || 0,
        sum_with_vat: invoice.sum_with_vat || 0,
        notes: invoice.notes,
        total_amount: invoice.sum_with_vat || 0, 
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        invoice_number: '',
        supplier_id: null,
        company_vat_code: null,
        invoice_date: new Date().toISOString().split('T')[0],
        order_number: null,
        sum_netto: 0,
        vat_amount: 0,
        sum_with_vat: 0,
        notes: null,
        total_amount: 0
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminOrSuperAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'super admin';
    if (!isAdminOrSuperAdmin) {
      setError('Tik administratoriai gali valdyti sąskaitas');
      return;
    }
    // 🟢 PRIDĖTA: Patikra, jei company ID yra null
    if (!userCompanyId) {
      setError('Nėra įmonės ID, negalima išsaugoti sąskaitos.');
      return;
    }


    try {
      // 🟢 PATAISYTA: Atitinka PurchaseInvoiceInsert/Update tipą
      const dataToSubmit: PurchaseInvoiceInsert | PurchaseInvoiceUpdate = {
        invoice_number: formData.invoice_number,
        supplier_id: formData.supplier_id,
        company_vat_code: formData.company_vat_code,
        invoice_date: formData.invoice_date,
        order_number: formData.order_number,
        sum_netto: formData.sum_netto,
        vat_amount: formData.vat_amount,
        sum_with_vat: formData.sum_with_vat,
        total_amount: formData.sum_with_vat, // Naudojama sum_with_vat, bet jį galite pervadinti
        notes: formData.notes,
        company_id: userCompanyId,
      };

      if (editingInvoice) {
        // 🟢 Update atveju nenaudojame 'id'
        const { error } = await supabase
          .from('purchase_invoices')
          .update(dataToSubmit as PurchaseInvoiceUpdate) // Apsauga
          .eq('id', editingInvoice.id)
          .eq('company_id', userCompanyId);
        if (error) throw error;
      } else {
        // 🟢 Insert atveju
        const { error } = await supabase
          .from('purchase_invoices')
          .insert([dataToSubmit as PurchaseInvoiceInsert]); // Apsauga
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
    if (!userCompanyId) return; // 🟢 Patikra

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Kraunama...</div></div>;
  }
  // 🟢 PRIDĖTA: Apsauga, jei userCompanyId yra null (išspręs TS2322 App.tsx klaidas)
  if (!userCompanyId) {
    return <div className="p-8 text-red-600">Klaida: Nėra įmonės ID. Prašome prisijungti iš naujo.</div>;
  }

  const isAdminOrSuperAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'super admin';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gautų Sąskaitų Registras</h1>
            <p className="text-sm text-slate-500 mt-1">Pirkimo sąskaitų valdymas</p>
          </div>
          {isAdminOrSuperAdmin && (
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
                    {isAdminOrSuperAdmin && (
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
                      <td className="py-3 px-4 text-slate-600">{formatDate(invoice.invoice_date)}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-slate-600">{invoice.order_number || '-'}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{invoice.sum_netto?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{invoice.vat_amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {invoice.sum_with_vat?.toFixed(2) || '0.00'}
                      </td>
                      {isAdminOrSuperAdmin && (
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
                    value={formData.supplier_id || ''} // 🟢 PATAISYTA: Value gali būti null, todėl priskiriame ''
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value || null })} // 🟢 PATAISYTA: Paverčiame atgal į null, jei tuščia
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
                    value={formData.company_vat_code || ''} // 🟢 PATAISYTA: Leidžiame null
                    onChange={(e) => setFormData({ ...formData, company_vat_code: e.target.value || null })} // 🟢 PATAISYTA: Paverčiame atgal į null
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
                    value={formData.order_number || ''} // 🟢 PATAISYTA: Leidžiame null
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value || null })} // 🟢 PATAISYTA: Paverčiame atgal į null
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
                        vat_amount: formData.vat_amount || 0, // 🟢 Pridėta patikra
                        sum_with_vat: netto + (formData.vat_amount || 0), // 🟢 Pridėta patikra
                        total_amount: netto + (formData.vat_amount || 0)
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
                        sum_with_vat: (formData.sum_netto || 0) + vat, // 🟢 Pridėta patikra
                        total_amount: (formData.sum_netto || 0) + vat
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
                    onChange={(e) => setFormData({ ...formData, sum_with_vat: parseFloat(e.target.value) || 0, total_amount: parseFloat(e.target.value) || 0 })} // 🟢 PATAISYTA: Atnaujiname ir total_amount
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pastabos</label>
                  <textarea
                    value={formData.notes || ''} // 🟢 PATAISYTA: Leidžiame null
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })} // 🟢 PATAISYTA: Paverčiame atgal į null
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
