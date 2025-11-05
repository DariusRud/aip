import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  company_code: string | null;
  vat_code: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: 'buyer' | 'supplier' | 'both';
  notes: string | null;
  created_at: string;
}

interface CompaniesProps {
  userRole: string;
}

function Companies({ userRole }: CompaniesProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    company_code: '',
    vat_code: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Lietuva',
    phone: '',
    email: '',
    website: '',
    type: 'both' as 'buyer' | 'supplier' | 'both',
    notes: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        company_code: company.company_code || '',
        vat_code: company.vat_code || '',
        address: company.address || '',
        city: company.city || '',
        postal_code: company.postal_code || '',
        country: company.country,
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        type: company.type,
        notes: company.notes || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        company_code: '',
        vat_code: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Lietuva',
        phone: '',
        email: '',
        website: '',
        type: 'both',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      setError('Tik administratoriai gali valdyti įmones');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        company_code: formData.company_code || null,
        vat_code: formData.vat_code || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        notes: formData.notes || null,
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(dataToSubmit)
          .eq('id', editingCompany.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([dataToSubmit]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią įmonę?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCompanies();
      setSelectedCompanies(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (company: Company) => {
    if (userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from('companies')
        .insert([{
          name: `${company.name} (kopija)`,
          company_code: company.company_code,
          vat_code: company.vat_code,
          address: company.address,
          city: company.city,
          postal_code: company.postal_code,
          country: company.country,
          phone: company.phone,
          email: company.email,
          website: company.website,
          type: company.type,
          notes: company.notes,
        }]);

      if (error) throw error;
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCompanies.size === 0) return;
    if (!confirm(`Ar tikrai norite ištrinti ${selectedCompanies.size} įmonę(-es)?`)) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .in('id', Array.from(selectedCompanies));

      if (error) throw error;
      setSelectedCompanies(new Set());
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  };


  const toggleSelectCompany = (id: string) => {
    setSelectedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'buyer': return 'Pirkėjas';
      case 'supplier': return 'Tiekėjas';
      case 'both': return 'Pirkėjas ir tiekėjas';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-700';
      case 'supplier': return 'bg-green-100 text-green-700';
      case 'both': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Kraunama...</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Įmonės</h1>
            <p className="text-sm text-slate-500 mt-1">Įmonių duomenų valdymas</p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Pridėti Įmonę
            </button>
          )}
        </div>

        {selectedCompanies.size > 0 && userRole === 'admin' && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-slate-700">
              Pasirinkta: {selectedCompanies.size}
            </span>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-trash mr-2"></i>
              Ištrinti pasirinktus
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        {companies.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <i className="fas fa-building text-4xl mb-4"></i>
            <p>Nėra sukurtų įmonių</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  selectedCompanies.has(company.id)
                    ? 'border-blue-500 shadow-md'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {userRole === 'admin' && (
                      <input
                        type="checkbox"
                        checked={selectedCompanies.has(company.id)}
                        onChange={() => toggleSelectCompany(company.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-lg mb-1">{company.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(company.type)}`}>
                        {getTypeLabel(company.type)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    {company.company_code && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">Įmonės kodas:</span>
                        <span>{company.company_code}</span>
                      </div>
                    )}
                    {company.vat_code && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">PVM kodas:</span>
                        <span>{company.vat_code}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-start gap-2">
                        <i className="fas fa-map-marker-alt text-slate-400 mt-0.5"></i>
                        <span>{company.address}{company.city && `, ${company.city}`}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-phone text-slate-400"></i>
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-envelope text-slate-400"></i>
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-globe text-slate-400"></i>
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleOpenModal(company)}
                        className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Redaguoti
                      </button>
                      <button
                        onClick={() => handleDuplicate(company)}
                        className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Dubliuoti
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCompany ? 'Redaguoti Įmonę' : 'Nauja Įmonė'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pavadinimas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipas</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="buyer">Pirkėjas</option>
                    <option value="supplier">Tiekėjas</option>
                    <option value="both">Pirkėjas ir tiekėjas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Įmonės kodas</label>
                  <input
                    type="text"
                    value={formData.company_code}
                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">PVM kodas</label>
                  <input
                    type="text"
                    value={formData.vat_code}
                    onChange={(e) => setFormData({ ...formData, vat_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adresas</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miestas</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pašto kodas</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Šalis</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefonas</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">El. paštas</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Svetainė</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    setEditingCompany(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCompany ? 'Išsaugoti' : 'Pridėti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Companies;
