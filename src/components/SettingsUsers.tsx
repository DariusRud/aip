import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Importuojame Supabase
import { Database } from '../types/database'; // Importuojame tipus

// --- NAUJI TIPAI PAGAL DB ---
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

// Sukuriame naują tipą, kuris sujungia Vartotoją ir jo Įmonės pavadinimą
interface AppUser extends UserProfile {
    company_name: string | null; // Pridedame įmonės pavadinimą
}

interface SettingsUsersProps {
    currentUserRole: string;
    userCompanyId: string; // Prisijungusios įmonės ID (pvz., "IV-1" ar "CLIENT-2")
    filterCompany: string | undefined; 
    onClearFilter: () => void;
}

// Įmonių ID konstantos (patogumui)
const COMPANY_ID_MY_IV = 'IV-1';
const COMPANY_ID_DEMO = 'CLIENT-2';

const SettingsUsers: React.FC<SettingsUsersProps> = ({ currentUserRole, userCompanyId, filterCompany, onClearFilter }) => {
    
    const [users, setUsers] = useState<AppUser[]>([]); // Vartotojai su įmonių pavadinimais
    const [allCompanies, setAllCompanies] = useState<Company[]>([]); // Visos įmonės (reikalingos modalui)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<AppUser | null>(null); 
    
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(userCompanyId);
    
    // --- DUOMENŲ GAVIMAS IŠ SUPABASE ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Gauname visas įmones
                const { data: companiesData, error: companiesError } = await supabase
                    .from('companies')
                    .select('*');
                
                if (companiesError) throw companiesError;
                setAllCompanies(companiesData || []);

                // 2. Sudarome įmonių "žodyną" (greitesnei paieškai)
                const companyMap = new Map(companiesData.map(c => [c.id, c.name]));

                // 3. Gauname vartotojų profilius
                // TEISINGAS KVIETIMAS: Naudojame .rpc()
                const { data: usersData, error: usersError } = await supabase.rpc('get_visible_users', {
                    requesting_user_role: currentUserRole,
                    requesting_company_id: userCompanyId
                });

                if (usersError) throw usersError;

                // 4. Sujungiame vartotojus su įmonių pavadinimais
                const appUsers: AppUser[] = (usersData as UserProfile[]).map((user) => ({
                    ...user,
                    company_name: companyMap.get(user.company_id) || 'Nėra Įmonės'
                }));
                
                setUsers(appUsers);

            } catch (err: any) {
                console.error("Klaida gaunant duomenis:", err);
                setError(`Nepavyko užkrauti vartotojų sąrašo. Klaida: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUserRole, userCompanyId]); // Efektas paleidžiamas pasikeitus vartotojui


    // --- FILTRAVIMO LOGIKA ---

    // Filtruojame įmones, kurias galime rinktis (priklauso nuo rolės)
    const uniqueCompanies = useMemo(() => {
        if (currentUserRole === 'Super Admin' || userCompanyId === COMPANY_ID_MY_IV) {
            return allCompanies; // Matome visas
        }
        if (userCompanyId === COMPANY_ID_DEMO) {
            // Matome save (CLIENT-2) ir savo vaikus (kurių parent_company_id yra CLIENT-2)
            return allCompanies.filter(c => c.id === COMPANY_ID_DEMO || c.parent_company_id === COMPANY_ID_DEMO);
        }
        // Visi kiti mato tik savo įmonę
        return allCompanies.filter(c => c.id === userCompanyId);
    }, [allCompanies, currentUserRole, userCompanyId]);

    // Filtruojame vartotojų sąrašą pagal paiešką ir pasirinktą įmonę
    const filteredUsers = useMemo(() => {
        let filtered = users;
        
        // 1. Filtracija pagal pasirinktą įmonę
        if (selectedCompanyId) {
            filtered = filtered.filter(user => user.company_id === selectedCompanyId);
        }

        // 2. Filtracija pagal paieškos terminą
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.display_name && user.display_name.toLowerCase().includes(lowerCaseSearch)) ||
                (user.email && user.email.toLowerCase().includes(lowerCaseSearch))
            );
        }
        return filtered;
    }, [users, selectedCompanyId, searchTerm]);

    // Efektas, kuris reaguoja į paspaudimą "Peržiūrėti vartotojus" iš Įmonių puslapio
    useEffect(() => {
        if (filterCompany) {
            const company = allCompanies.find(c => c.name === filterCompany);
            if (company) {
                setSelectedCompanyId(company.id);
            }
            onClearFilter();
        }
    }, [filterCompany, onClearFilter, allCompanies]);
    

    // --- VEIKSMAI (Kol kas neveikia - laukia SQL funkcijų) ---

    const handleOpenModal = (user?: AppUser) => {
        setEditingUser(user || null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleDelete = (user: AppUser) => {
        if (currentUserRole !== 'Super Admin') {
             alert("Trinti gali tik Super Adminas.");
             return;
        }
        if (user.role === 'Super Admin') {
            alert("Negalima trinti Super Admin rolės vartotojo.");
            return;
        }
        setShowConfirmModal(user);
    };
    
    // (Kol kas neveiks, kol nesukursime 'delete-user' funkcijos)
    const handleConfirmDelete = async () => {
        if (!showConfirmModal) return;
        alert("Trynimo funkcija dar ruošiama (trūksta SQL funkcijos 'delete-user').");
        setShowConfirmModal(null);
    };

    // (Kol kas neveiks, kol nesukursime 'create-user' funkcijos)
    const handleSaveUser = async (formData: any) => {
        if (editingUser) {
            // --- REDAGAVIMAS (Veiks) ---
            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: formData.display_name,
                    role: formData.role,
                    company_id: formData.company_id,
                    status: formData.status
                })
                .eq('id', editingUser.id)
                .select()
                .single();
            
            if (error) {
                setError("Klaida atnaujinant: " + error.message);
            } else {
                const companyName = allCompanies.find(c => c.id === data.company_id)?.name || 'Nėra';
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...data, company_name: companyName } : u));
                handleCloseModal();
            }
        } else {
            // --- KŪRIMAS (Kol kas neveiks) ---
            alert("Kūrimo funkcija dar ruošiama (trūksta SQL funkcijos 'create-user').");
            handleCloseModal();
        }
    };


    // --- RENDERINIMAS ---

    if (isLoading) {
        return <div className="p-8">Kraunami vartotojai...</div>;
    }

    const renderUserRow = (user: AppUser) => (
        <tr key={user.id} className="hover:bg-slate-50">
            <td className="py-3 px-4 text-sm font-medium text-slate-800">{user.display_name || '-'}</td>
            <td className="py-3 px-4 text-sm text-slate-600">{user.email || '-'}</td>
            <td className="py-3 px-4 text-sm text-indigo-700 font-medium">{user.company_name}</td>
            <td className="py-3 px-4 text-sm">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.role === 'Super Admin' ? 'bg-red-100 text-red-700' : user.role === 'Admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                    {user.role}
                </span>
            </td>
            <td className="py-3 px-4 text-sm">
                 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {user.status || 'Active'}
                </span>
            </td>
            <td className="py-3 px-4 text-sm text-slate-400">{user.last_login ? new Date(user.last_login).toLocaleDateString('lt-LT') : 'Niekada'}</td>
            
            {(currentUserRole === 'Super Admin' || currentUserRole === 'Admin') && (
                <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                         <button
                            onClick={() => handleOpenModal(user)}
                            title="Redaguoti vartotoją"
                            className="text-indigo-600 hover:text-indigo-900"
                        >
                            <i className="fas fa-edit text-base"></i>
                        </button>
                        {currentUserRole === 'Super Admin' && (
                            <button
                                onClick={() => handleDelete(user)}
                                title="Ištrinti vartotoją"
                                className="text-red-600 hover:text-red-900"
                            >
                                <i className="fas fa-trash text-base"></i>
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Vartotojų Valdymas</h1>
                        <p className="text-sm text-slate-500 mt-1">Valdykite ir priskirkite vartotojus įmonėms bei rolėms.</p>
                    </div>
                    {(currentUserRole === 'Super Admin' || currentUserRole === 'Admin') && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Pridėti Vartotoją
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white px-8 pt-4 pb-6 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Pasirinkite įmonę, kurios vartotojus valdysite:</p>
                <div className="flex flex-wrap gap-2 items-center mb-6">
                    {uniqueCompanies.map(company => (
                        <button
                            key={company.id}
                            onClick={() => {
                                setSelectedCompanyId(company.id);
                                setSearchTerm('');
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors 
                                ${company.id === selectedCompanyId 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                            `}
                        >
                            {company.name}
                        </button>
                    ))}
                </div>
                
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paieška (Vardas, El. paštas)</label>
                    <input
                        type="text"
                        placeholder={`Ieškoti vartotojų...`}
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
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">VARDAS PAVARDĖ</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">EL. PAŠTAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">ĮMONĖ</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-24">ROLĖ</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-20">BŪSENA</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-24">PASK. PRISIJUNG.</th>
                                    {(currentUserRole === 'Super Admin' || currentUserRole === 'Admin') && (
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-700 w-20">VEIKSMAI</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredUsers.map(renderUserRow)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-lg mt-4">
                        Nėra vartotojų, atitinkančių paieškos kriterijus.
                    </div>
                )}
            </div>

            {showModal && (
                <UserModal 
                    user={editingUser} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveUser}
                    allCompanies={uniqueCompanies} // Perduodame tik tas įmones, kurias vartotojas gali matyti
                    currentUserRole={currentUserRole}
                    defaultCompanyId={selectedCompanyId} // Nurodome, kuri įmonė pasirinkta
                />
            )}
            
            {showConfirmModal !== null && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Patvirtinti Ištrynimą</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Ar tikrai norite ištrinti vartotoją "{showConfirmModal.display_name}" ({showConfirmModal.email})? Šis veiksmas negrįžtamas.
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

export default SettingsUsers;


// === Vartotojo Modalo Komponentas (Atnaujintas) ===

interface UserModalProps {
    user: AppUser | null; // Dabar naudojame AppUser tipą
    onClose: () => void;
    onSave: (formData: any) => void;
    allCompanies: Company[]; // Dabar gauname tikras įmones
    currentUserRole: string;
    defaultCompanyId: string; // Kuri įmonė turi būti parinkta pagal nutylėjimą
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave, allCompanies, currentUserRole, defaultCompanyId }) => {
    
    // Nustatome pradinius formos duomenis
    const [formData, setFormData] = useState({
        email: user?.email || '',
        password: '', // Slaptažodis visada tuščias
        display_name: user?.display_name || '',
        role: user?.role || 'User',
        company_id: user?.company_id || defaultCompanyId,
        status: user?.status || 'Active',
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {user ? 'Redaguoti Vartotoją' : 'Pridėti Naują Vartotoją'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vardas Pavardė</label>
                        <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">El. paštas</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required
                            disabled={!!user} // Neleidžiame keisti el. pašto redaguojant
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100" />
                    </div>

                    {/* Slaptažodžio laukas rodomas tik kuriant naują vartotoją */}
                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Slaptažodis</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rolė</label>
                        <select name="role" value={formData.role} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            {currentUserRole === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Įmonė</label>
                        <select 
                            name="company_id" 
                            value={formData.company_id} 
                            onChange={handleChange}
                            disabled={currentUserRole === 'Admin' && !!user} // Adminas negali keisti įmonės
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            {allCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Būsena</label>
                        <select name="status" value={formData.status} onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 mr-3">
                            Atšaukti
                        </button>
                        <button type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            {user ? 'Išsaugoti' : 'Pridėti'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};