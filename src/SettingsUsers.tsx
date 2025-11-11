import React, { useState, useMemo, useEffect } from 'react';

// === Sąsajos ===
interface User {
    id: number;
    email: string;
    name: string;
    role: 'Super Admin' | 'Admin' | 'User' | 'Viewer';
    company: string; // Vartotojo priskirta įmonė
    status: 'Active' | 'Inactive';
    lastLogin: string;
}

interface SettingsUsersProps {
    currentUserRole: string;
    userCompanyId: string; 
    filterCompany: string | undefined; 
    onClearFilter: () => void;
}

// === Pavyzdiniai VARTOTOJŲ Duomenys ===
const COMPANY_ID_MY_IV = 'IV-1';
const COMPANY_ID_DEMO = 'CLIENT-2';

const DUMMY_USERS: User[] = [
    { id: 1, email: 'darius.rudvalis@iv.lt', name: 'Darius Rudvalis', role: 'Super Admin', company: 'Dariaus Rudvalio IV', status: 'Active', lastLogin: '2025-11-09' },
    { id: 5, email: 'petras@iv.lt', name: 'Petras Petraitis', role: 'User', company: 'Dariaus Rudvalio IV', status: 'Active', lastLogin: '2025-11-07' },
    { id: 2, email: 'jonas@demo.lt', name: 'Jonas Buklauskas', role: 'Admin', company: 'Buhalteris Demo', status: 'Active', lastLogin: '2025-11-08' },
    { id: 3, email: 'ieva@demo.lt', name: 'Ieva Kazlauskienė', role: 'User', company: 'Buhalteris Demo', status: 'Active', lastLogin: '2025-11-09' },
    { id: 4, email: 'ona@klientasA.lt', name: 'Ona Onaitytė', role: 'Viewer', company: 'Klientas A', status: 'Inactive', lastLogin: '2025-10-25' },
];

const INITIAL_COMPANY_NAMES = ['Dariaus Rudvalio IV', 'Buhalteris Demo', 'Klientas A'];

const isOwnedByCurrentUser = (companyName: string, currentUserId: string, currentUserRole: string): boolean => {
    if (currentUserRole === 'Super Admin') return true;
    if (currentUserId === COMPANY_ID_MY_IV) return true;
    
    if (currentUserId === COMPANY_ID_DEMO) {
        return companyName === 'Buhalteris Demo' || companyName === 'Klientas A'; 
    }
    return DUMMY_USERS.some(u => u.company === companyName && u.role === 'Admin' && u.company === companyName);
};


const SettingsUsers: React.FC<SettingsUsersProps> = ({ currentUserRole, userCompanyId, filterCompany, onClearFilter }) => {
    const [users, setUsers] = useState<User[]>(DUMMY_USERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null); 
    
    const initialSelectedCompany = userCompanyId === COMPANY_ID_DEMO ? 'Buhalteris Demo' : 'Dariaus Rudvalio IV';

    const [selectedCompany, setSelectedCompany] = useState<string>(initialSelectedCompany);
    
    const uniqueCompanies = useMemo(() => {
        const allNames = INITIAL_COMPANY_NAMES.concat(DUMMY_USERS.map(u => u.company));
        const allUnique = Array.from(new Set(allNames));

        if (currentUserRole === 'Super Admin') {
            return allUnique;
        } else {
            return allUnique.filter(name => isOwnedByCurrentUser(name, userCompanyId, currentUserRole));
        }
    }, [currentUserRole, userCompanyId]);
    
    useEffect(() => {
        if (currentUserRole !== 'Super Admin') {
            if (!uniqueCompanies.includes(selectedCompany)) {
                setSelectedCompany(uniqueCompanies[0] || initialSelectedCompany);
            }
        }
    }, [currentUserRole, selectedCompany, uniqueCompanies, initialSelectedCompany]);


    useEffect(() => {
        if (filterCompany && filterCompany !== selectedCompany) {
            if (uniqueCompanies.includes(filterCompany) || currentUserRole === 'Super Admin') {
                setSelectedCompany(filterCompany);
            }
            onClearFilter();
        }
    }, [filterCompany, onClearFilter, selectedCompany, uniqueCompanies, currentUserRole]);
    
    const filteredUsers = useMemo(() => {
        let filtered = users;
        
        if (currentUserRole !== 'Super Admin') {
            filtered = filtered.filter(user => uniqueCompanies.includes(user.company));
        }
        
        filtered = filtered.filter(user => user.company === selectedCompany);

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(lowerCaseSearch) ||
                user.email.toLowerCase().includes(lowerCaseSearch)
            );
        }

        return filtered;
    }, [users, selectedCompany, searchTerm, currentUserRole, uniqueCompanies]);
    
    // --- Actions ---

    const handleOpenModal = (user?: User) => {
        if (currentUserRole === 'Super Admin') {
             // leidžiama
        } else if (currentUserRole === 'Admin') {
            if (user && user.company !== selectedCompany) {
                return; 
            }
        } else {
            return;
        }

        setEditingUser(user || null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleDelete = (id: number) => {
        if (currentUserRole !== 'Super Admin') return;
        
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete?.role === 'Super Admin') {
            alert("Negalima trinti Super Admin rolės vartotojo.");
            return;
        }
        
        setShowConfirmModal(id);
    };
    
    const handleConfirmDelete = () => {
        if (showConfirmModal) {
            setUsers(prev => prev.filter(u => u.id !== showConfirmModal));
        }
        setShowConfirmModal(null);
    };

    const handleSaveUser = (userData: Omit<User, 'id'>) => {
        // Adminas GALI kurti tik pasirinktai įmonei - tai užtikrinama ČIA
        if (currentUserRole === 'Admin' && !editingUser) {
             // Kuriant naują vartotoją, priverstinai nustatome įmonę į selectedCompany
             userData.company = selectedCompany; 
        }

        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...userData, id: editingUser.id } as User : u));
        } else {
            const newUser: User = { ...userData, id: Date.now() } as User;
            setUsers(prev => [...prev, newUser]);
        }
        handleCloseModal();
    };


    // --- Render Helpers ---

    const renderUserRow = (user: User) => (
        <tr key={user.id} className="hover:bg-slate-50">
            <td className="py-3 px-4 text-sm font-medium text-slate-800">{user.name}</td>
            <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
            <td className="py-3 px-4 text-sm text-indigo-700 font-medium">{user.company}</td>
            <td className="py-3 px-4 text-sm">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.role === 'Super Admin' ? 'bg-red-100 text-red-700' : user.role === 'Admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                    {user.role}
                </span>
            </td>
            <td className="py-3 px-4 text-sm">
                 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {user.status}
                </span>
            </td>
            <td className="py-3 px-4 text-sm text-slate-400">{user.lastLogin}</td>
            
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
                                onClick={() => handleDelete(user.id)}
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
                {/* ... (Paieška ir filtrai) ... */}
                <div className="bg-white px-8 pt-4 pb-6 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Pasirinkite įmonę, kurios vartotojus valdysite:</p>
                    <div className="flex flex-wrap gap-2 items-center mb-6">
                        {/* Įmonių mygtukai, leidžiantys perjungti filtrą */}
                        {uniqueCompanies.map(companyName => (
                            <button
                                key={companyName}
                                onClick={() => {
                                    setSelectedCompany(companyName);
                                    setSearchTerm(''); // Išvalome paiešką, kai keičiame įmonę
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors 
                                    ${companyName === selectedCompany 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                                `}
                            >
                                {companyName}
                            </button>
                        ))}
                    </div>
                    
                    {/* Paieška */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Paieška (Vardas, El. paštas)</label>
                        <input
                            type="text"
                            placeholder={`Ieškoti vartotojų įmonėje "${selectedCompany}"...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
			</div>

            {/* === LENTELĖS VAIZDAS === */}
            <div className="flex-1 overflow-y-auto p-8">
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
                        {selectedCompany
                            ? `Nėra vartotojų įmonei "${selectedCompany}", atitinkančių paieškos kriterijus.` 
                            : 'Nėra vartotojų, atitinkančių paieškos kriterijus.'}
                    </div>
                )}
            </div>

            {/* === MODALAS VARTOTOJUI REDAGUOTI / PRIDĖTI === */}
            {showModal && (
                <UserModal 
                    user={editingUser} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveUser}
                    allCompanies={uniqueCompanies} 
                    currentUserRole={currentUserRole}
                    // PRIDĖTA: perduodame šiuo metu pasirinktos įmonės pavadinimą
                    currentSelectedCompany={selectedCompany} 
                />
            )}
            
            {/* === TRINIMO PATVIRTINIMO MODALAS === */}
             {showConfirmModal !== null && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Patvirtinti Ištrynimą</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Ar tikrai norite ištrinti vartotoją "{users.find(u => u.id === showConfirmModal)?.name}"? Šis veiksmas negrįžtamas.
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


// === User Modal Component (Atnaujintas) ===

interface UserModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id'>) => void;
    allCompanies: string[];
    currentUserRole: string;
    currentSelectedCompany: string; // NAUJAS: Pasirinktos įmonės pavadinimas
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave, allCompanies, currentUserRole, currentSelectedCompany }) => {
    
    // Nustatome numatytąją reikšmę naujam vartotojui
    const defaultCompany = user ? user.company : currentSelectedCompany;

    const [formData, setFormData] = useState<Omit<User, 'id'>>(user || {
        email: '',
        name: '',
        role: 'User',
        company: defaultCompany, // PATAISYTA
        status: 'Active',
        lastLogin: new Date().toISOString().substring(0, 10),
    } as Omit<User, 'id'>);
    
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

    const uniqueCompanies = Array.from(new Set(allCompanies));

    // Nustatome, ar laukelis turėtų būti užblokuotas (Adminas negali keisti įmonės redaguojant)
    const isCompanyFieldDisabled = currentUserRole === 'Admin' && !!user;


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
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">El. paštas</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

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
                        <select name="company" value={formData.company} onChange={handleChange}
                            disabled={isCompanyFieldDisabled} // UŽBLOKUOJAMA, JEI ADMINAS REDAGUOJA
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            {/* Administruojant (Admin rolė): rodomos tik ADMINUI prieinamos įmonės */}
                            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {isCompanyFieldDisabled && (
                            <p className="mt-1 text-xs text-slate-500">Įmonę gali keisti tik Super Admin.</p>
                        )}
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