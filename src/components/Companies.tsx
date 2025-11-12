import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Būtinai patikrinkite, ar kelias į Jūsų tipų failą yra teisingas
import { Database } from '../types/database'; 

// === TIPŲ APIBRĖŽIMAI ===
// Pataisytas Company tipas pagal jūsų DB schemą
type Company = Database['public']['Tables']['companies']['Row'];
// Tipai, skirti duomenų įterpimui ir atnaujinimui
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

interface CompaniesProps {
    // userCompanyId leidžiame būti string | null, kad išvengtume klaidų, kai jis Null pradinėje būsenoje (App.tsx)
    userCompanyId: string | null; 
    userRole: string;
    viewType: 'all' | 'tenants';
    onViewUsers: (companyName: string) => void;
}

// Įmonių ID konstantos
const COMPANY_ID_MY_IV = 'IV-1';
const COMPANY_ID_DEMO = 'CLIENT-2';

const Companies: React.FC<CompaniesProps> = ({ userRole, userCompanyId, viewType, onViewUsers }) => {
    
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

    // Duomenų gavimas iš Supabase (userCompanyId naudoja null patikrą)
    useEffect(() => {
        // Jei vartotojas neprisijungęs, arba Company ID dar neapibrėžtas (null), nieko nedarome
        if (userCompanyId === null) {
            setIsLoading(false);
            return;
        }
        
        const fetchCompanies = async () => {
            setIsLoading(true);
            setError(null);

            let query = supabase.from('companies').select('*');

            if (userRole !== 'Super Admin' && userCompanyId !== COMPANY_ID_MY_IV) {
                if (userCompanyId === COMPANY_ID_DEMO) {
                    query = query.or(`id.eq.${COMPANY_ID_DEMO},parent_company_id.eq.${COMPANY_ID_DEMO}`);
                } else {
                    query = query.eq('id', userCompanyId);
                }
            }
            
            if (viewType === 'tenants') {
                query = query.not('parent_company_id', 'is', null);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Klaida gaunant įmones:", error);
                setError("Nepavyko užkrauti įmonių sąrašo.");
            } else if (data) {
                setCompanies(data);
            }
            setIsLoading(false);
        };

        fetchCompanies();
    }, [userRole, userCompanyId, viewType]);

    // Filtravimas
    const filteredCompanies = useMemo(() => {
        if (!searchTerm) {
            return companies;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return companies.filter(company =>
            company.name.toLowerCase().includes(lowerCaseSearch) ||
            (company.code && company.code.toLowerCase().includes(lowerCaseSearch)) ||
            (company.vat_code && company.vat_code.toLowerCase().includes(lowerCaseSearch))
        );
    }, [companies, searchTerm]);

    // Veiksmai (Trynimas ir Saugojimas dabar JUNGSIASI prie Supabase)

    const handleOpenModal = (company?: Company) => {
        setEditingCompany(company || null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCompany(null);
    };

    const handleDelete = (id: string) => {
        if (userRole !== 'Super Admin') return;
        setShowConfirmModal(id);
    };

    const handleConfirmDelete = async () => {
        if (showConfirmModal) {
            const { error } = await supabase.from('companies').delete().eq('id', showConfirmModal);
            
            if (error) {
                console.error("Trynimo klaida:", error);
                setError("Klaida trinant įmonę. (Galbūt ji priskirta vartotojams?)");
            } else {
                setCompanies(prev => prev.filter(c => c.id !== showConfirmModal));
            }
            setShowConfirmModal(null);
        }
    };

    // 🟢 PATAISYTA: Dabar priima CompanyInsert | CompanyUpdate tipą
    const handleSaveCompany = async (companyData: CompanyInsert | CompanyUpdate) => {
        // Pašaliname laukus, kurie neleidžiami atnaujinimo metu
        const dataToSave = { ...companyData };
        if (dataToSave.created_at !== undefined) delete dataToSave.created_at; 
        // Pastaba: 'id' paliekame Insert atveju ir atmetame Update atveju
        
        if (editingCompany) {
            // --- REDAGAVIMAS ---
            const { error } = await supabase
                .from('companies')
                // Tipas dabar tinka Update
                .update(dataToSave as CompanyUpdate) 
                .eq('id', editingCompany.id);

            if (error) {
                console.error("Atnaujinimo klaida:", error);
                setError("Klaida atnaujinant duomenis.");
            } else {
                setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...dataToSave } as Company : c));
            }

        } else {
            // --- KŪRIMAS ---
            // Įterpiant, turime užtikrinti, kad 'id' būtų.
            const insertData = dataToSave as CompanyInsert;
            
            const { data, error } = await supabase
                .from('companies')
                .insert(insertData) 
                .select()
                .single(); 

            if (error) {
                console.error("Kūrimo klaida:", error);
                setError("Klaida kuriant įmonę. (Galbūt toks ID jau egzistuoja?)");
            } else if (data) {
                setCompanies(prev => [...prev, data]);
            }
        }
        handleCloseModal();
    };

    // --- RODYMAS ---

    if (isLoading) {
        return <div className="p-8">Kraunamos įmonės...</div>;
    }
    
    // Čia patikrinimas, kad nebūtų klaidos, jei userCompanyId yra null
    if (userCompanyId === null) {
        return <div className="p-8 text-red-600">Klaida: Nėra įmonės ID. Prašome prisijungti iš naujo.</div>;
    }


    const renderCompanyRow = (company: Company) => (
        <tr key={company.id} className="hover:bg-slate-50">
            <td className="py-3 px-4 text-sm font-medium text-slate-800">{company.name}</td>
            <td className="py-3 px-4 text-sm text-slate-600">{company.code || '-'}</td>
            <td className="py-3 px-4 text-sm text-slate-600">{company.vat_code || '-'}</td>
            {/* 🟢 Dabar 'owner_name' ir 'owner_email' turėtų egzistuoti Company type */}
            <td className="py-3 px-4 text-sm text-slate-600">{company.owner_name || '-'}</td> 
            <td className="py-3 px-4 text-sm text-slate-600">{company.owner_email || '-'}</td> 
            <td className="py-3 px-4 text-center">
                <div className="flex justify-center space-x-2">
                    <button
                        onClick={() => onViewUsers(company.name)}
                        title="Peržiūrėti vartotojus"
                        className="text-indigo-600 hover:text-indigo-900"
                    >
                        <i className="fas fa-users text-base"></i>
                    </button>
                    {(userRole === 'Super Admin' || userRole === 'Admin') && (
                        <button
                            onClick={() => handleOpenModal(company)}
                            title="Redaguoti įmonę"
                            className="text-indigo-600 hover:text-indigo-900"
                        >
                            <i className="fas fa-edit text-base"></i>
                        </button>
                    )}
                    {userRole === 'Super Admin' && (
                        <button
                            onClick={() => handleDelete(company.id)}
                            title="Ištrinti įmonę"
                            className="text-red-600 hover:text-red-900"
                        >
                            <i className="fas fa-trash text-base"></i>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {viewType === 'all' ? 'Įmonių Valdymas' : 'Klientų Valdymas'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {viewType === 'all' ? 'Matykite ir valdykite visas sistemos įmones.' : 'Matykite ir valdykite Jūsų aptarnaujamus klientus.'}
                        </p>
                    </div>
                    {(userRole === 'Super Admin' || userRole === 'Admin') && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            {viewType === 'all' ? 'Pridėti Įmonę' : 'Pridėti Klientą'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white px-8 pt-4 pb-6 border-b border-slate-200">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paieška (Pavadinimas, Kodas, PVM)</label>
                    <input
                        type="text"
                        placeholder="Ieškoti įmonių..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg">
                        {error}
                    </div>
                )}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] divide-y divide-slate-200">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-auto">PAVADINIMAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-32">KODAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-32">PVM KODAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">VADOVAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">EL. PAŠTAS</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-700 w-32">VEIKSMAI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredCompanies.map(renderCompanyRow)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredCompanies.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-lg mt-4">
                        Nėra įmonių, atitinkančių paieškos kriterijus.
                    </div>
                )}
            </div>

            {showModal && (
                <CompanyModal 
                    company={editingCompany} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveCompany}
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                />
            )}
            
            {showConfirmModal !== null && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Patvirtinti Ištrynimą</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Ar tikrai norite ištrinti šią įmonę? Šis veiksmas negrįžtamas.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowConfirmModal(null)}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Atšaukti
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Patvirtinti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Companies;


// === Įmonės Modalo Komponentas (CompanyModal) ===

interface CompanyModalProps {
    company: Company | null;
    onClose: () => void;
    // 🟢 Pataisyta: onSave priima CompanyInsert | CompanyUpdate tipus
    onSave: (companyData: CompanyInsert | CompanyUpdate) => void;
    userRole: string;
    userCompanyId: string | null;
}

const getDefaultParentId = (userRole: string, userCompanyId: string | null): string | null => {
    if (userRole === 'Super Admin' || userCompanyId === COMPANY_ID_MY_IV || userCompanyId === null) {
        return null; 
    }
    return userCompanyId; 
}

const CompanyModal: React.FC<CompanyModalProps> = ({ company, onClose, onSave, userRole, userCompanyId }) => {
    
    const initialData: CompanyInsert | CompanyUpdate = company ? company : {
        // 🟢 Pataisyta: pradinės reikšmės dabar atitinka Insert/Update tipus
        id: '', 
        name: '',
        code: null,
        vat_code: null,
        address: null,
        correspondence_address: null, 
        notes: null, 
        bank_name: null,
        bank_iban: null,
        owner_name: null,
        owner_email: null,
        parent_company_id: getDefaultParentId(userRole, userCompanyId)
        // Pridėti trūkstami laukai, kurie yra DB schemoje (nors UI jie nebuvo rodomi)
        ,city: null,
        country: null,
        email: null,
        phone: null,
        postal_code: null,
        is_buyer: false,
        is_supplier: false,
        is_tenant: false,
    };

    const [formData, setFormData] = useState<CompanyInsert | CompanyUpdate>(initialData);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // Bool tipo laukai (jei būtų)
        const parsedValue = (type === 'checkbox') ? (e.target as HTMLInputElement).checked : value;
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: (typeof parsedValue === 'string' && parsedValue.trim() === '') ? null : parsedValue 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataToSave = { ...formData };

        // Jei redaguojame, 'id' laukas Update tipe negali būti naudojamas
        if (company) {
            delete dataToSave.id; 
            delete dataToSave.created_at; // Papildoma patikra
        }

        onSave(dataToSave as CompanyInsert | CompanyUpdate);
    };

    const showParentIdField = userRole === 'Super Admin' || userCompanyId === COMPANY_ID_MY_IV;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {company ? 'Redaguoti Įmonę' : 'Pridėti Naują Įmonę'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {!company && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Įmonės ID <span className="text-red-500">*</span></label>
                            <input type="text" name="id" value={(formData as CompanyInsert).id || ''} onChange={handleChange} required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Pvz.: CLIENT-3 (Būtinas)"
                            />
                        </div>
                    )}
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pavadinimas <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kodas (Juridinis/Asmens)</label>
                        <input type="text" name="code" value={formData.code || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PVM kodas</label>
                        <input type="text" name="vat_code" value={formData.vat_code || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registracijos Adresas</label>
                        <input type="text" name="address" value={formData.address || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Korespondencijos Adresas</label>
                        <input type="text" name="correspondence_address" value={formData.correspondence_address || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banko Pavadinimas</label>
                        <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banko Sąskaita (IBAN)</label>
                        <input type="text" name="bank_iban" value={formData.bank_iban || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vadovas</label>
                        <input type="text" name="owner_name" value={formData.owner_name || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sąskaitų El. Paštas</label>
                        <input type="email" name="owner_email" value={formData.owner_email || ''} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    {showParentIdField && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tėvinė Įmonė (Kam priklauso)</label>
                            <input 
                                type="text" 
                                name="parent_company_id" 
                                value={formData.parent_company_id || ''} 
                                onChange={handleChange}
                                placeholder="Palikite tuščią, jei tai pagrindinė įmonė"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                        </div>
                    )}
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pastabos</label>
                        <textarea
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Vidinė informacija, pastabos..."
                        />
                    </div>


                    <div className="md:col-span-2 flex justify-end pt-4">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 mr-3">
                            Atšaukti
                        </button>
                        <button type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            {company ? 'Išsaugoti' : 'Pridėti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
