import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Company = Database['public']['Tables']['companies']['Row'];
type ProductCategory = Database['public']['Tables']['product_categories']['Row'];

interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  amount_no_vat: number;
  amount_with_vat: number;
  category_id: string | null;
}

export default function UploadDocument() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    company_id: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    amount_no_vat: 0,
    vat_amount: 0,
    total_amount: 0,
    notes: '',
  });

  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'vnt',
      unit_price: 0,
      vat_rate: 21,
      amount_no_vat: 0,
      amount_with_vat: 0,
      category_id: null,
    },
  ]);

  useEffect(() => {
    fetchCompanies();
    fetchCategories();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('type', 'supplier')
      .order('name');
    if (data) setCompanies(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('product_categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const calculateItemAmounts = (item: DocumentItem) => {
    const amountNoVat = item.quantity * item.unit_price;
    const vatAmount = (amountNoVat * item.vat_rate) / 100;
    return {
      amount_no_vat: Math.round(amountNoVat * 100) / 100,
      amount_with_vat: Math.round((amountNoVat + vatAmount) * 100) / 100,
    };
  };

  const updateItem = (id: string, field: keyof DocumentItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const amounts = calculateItemAmounts(updated);
          return { ...updated, ...amounts };
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unit: 'vnt',
        unit_price: 0,
        vat_rate: 21,
        amount_no_vat: 0,
        amount_with_vat: 0,
        category_id: null,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  useEffect(() => {
    const totalNoVat = items.reduce((sum, item) => sum + item.amount_no_vat, 0);
    const totalWithVat = items.reduce((sum, item) => sum + item.amount_with_vat, 0);
    const vatAmount = totalWithVat - totalNoVat;

    setFormData((prev) => ({
      ...prev,
      amount_no_vat: Math.round(totalNoVat * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      total_amount: Math.round(totalWithVat * 100) / 100,
    }));
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Neautentifikuotas vartotojas');

      const selectedCompany = companies.find((c) => c.id === formData.company_id);

      const { data: document, error: docError } = await supabase
        .from('uploaded_documents')
        .insert({
          company_id: formData.company_id,
          supplier_name: selectedCompany?.name || '',
          supplier_code: selectedCompany?.code || '',
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || null,
          amount_no_vat: formData.amount_no_vat,
          vat_amount: formData.vat_amount,
          total_amount: formData.total_amount,
          notes: formData.notes || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      const itemsToInsert = items.map((item, index) => ({
        document_id: document.id,
        line_number: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        amount_no_vat: item.amount_no_vat,
        amount_with_vat: item.amount_with_vat,
        category_id: item.category_id || null,
        match_type: item.category_id ? 'manual' : 'none',
        match_confidence: item.category_id ? 100 : 0,
      }));

      const { error: itemsError } = await supabase.from('document_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setMessage({ type: 'success', text: 'Dokumentas sėkmingai įkeltas!' });

      setFormData({
        company_id: '',
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        amount_no_vat: 0,
        vat_amount: 0,
        total_amount: 0,
        notes: '',
      });

      setItems([
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unit: 'vnt',
          unit_price: 0,
          vat_rate: 21,
          amount_no_vat: 0,
          amount_with_vat: 0,
          category_id: null,
        },
      ]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Įkelti naują dokumentą</h1>
          <p className="text-gray-600">Rankiniu būdu įveskite dokumento duomenis</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiekėjo informacija</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiekėjas <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pasirinkite tiekėją</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sąskaitos numeris <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sąskaitos data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apmokėjimo terminas
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Prekės / Paslaugos</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Pridėti prekę
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">Prekė {index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Ištrinti
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aprašymas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kiekis</label>
                      <input
                        type="number"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mato vienetas
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vieneto kaina
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PVM %</label>
                      <select
                        value={item.vat_rate}
                        onChange={(e) => updateItem(item.id, 'vat_rate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="21">21%</option>
                        <option value="9">9%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prekių kategorija
                      </label>
                      <select
                        value={item.category_id || ''}
                        onChange={(e) => updateItem(item.id, 'category_id', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Nenurodyta</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Suma be PVM:</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {item.amount_no_vat.toFixed(2)} EUR
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Suma su PVM:</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {item.amount_with_vat.toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sumos</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Suma be PVM:</span>
                <span className="font-semibold">{formData.amount_no_vat.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>PVM suma:</span>
                <span className="font-semibold">{formData.vat_amount.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Suma su PVM:</span>
                <span>{formData.total_amount.toFixed(2)} EUR</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pastabos</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Įkeliama...' : 'Įkelti į sistemą'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
