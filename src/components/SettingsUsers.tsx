import React, { useState, useEffect } from 'react';
// Supabase importas paruoštas naudojimui ateityje
// import { supabase } from '../lib/supabase'; 

// === 1. Baziniai Rolės Nustatymai ===
// Sukuriame bazinius duomenis (bus pakeista į duomenis iš Supabase)
interface UserProfile {
    id: string;
    email: string;
    role: 'Super Admin' | 'Admin' | 'User'; // Tik 3 rolės pagal Jūsų viziją
    status: 'AKTYVUS' | 'NEAKTYVUS';
}

const DUMMY_USERS: UserProfile[] = [
    // Pavyzdys: prisijungęs vartotojas (Super Admin)
    { id: '1', email: 'analitikas@dariusrudvalis.lt', role: 'Super Admin', status: 'AKTYVUS' }, 
    // Pavyzdys: įprastas Administratorius
    { id: '2', email: 'buhalteris@imone.lt', role: 'Admin', status: 'AKTYVUS' }, 
    // Pavyzdys: bazinis vartotojas
    { id: '3', email: 'jonas@imone.lt', role: 'User', status: 'NEAKTYVUS' }, 
];

const SettingsUsers: React.FC<{ currentUserRole: string }> = ({ currentUserRole }) => {
    const [users, setUsers] = useState<UserProfile[]>(DUMMY_USERS);
    const [isLoading, setIsLoading] = useState(false);
    
    // Čia bus fetch logika, kuri jungsis prie Supabase (auth.users ir user_roles)
    useEffect(() => {
        // Vėliau čia bus fetch logika:
        // 1. const { data: authUsers } = await supabase.auth.admin.listUsers();
        // 2. sujungti su jūsų user_roles lentele
    }, []);

    // Funkcija, kuri tikrina, ar dabartinis vartotojas (currentUserRole) gali veikti su kitu vartotoju (userRole)
    const canManageUser = (userRole: string) => {
        // Super Admin gali tvarkyti visus
        if (currentUserRole === 'Super Admin') return true; 
        
        // Admin gali tvarkyti User, bet NE Super Admin ir NE Kitus Admin
        if (currentUserRole === 'Admin' && userRole === 'User') return true;
        
        return false;
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        if (!window.confirm(`Ar tikrai norite pakeisti rolę į ${newRole}?`)) return;
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as UserProfile['role'] } : u));
    };

    const handleDelete = (userId: string) => {
        if (!window.confirm("Ar tikrai norite ištrinti šį vartotoją?")) return;
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleEdit = (userId: string) => {
         alert(`Vartotojo ID ${userId} koregavimo funkcija bus pridėta vėliau.`);
         // Čia bus modalas su koregavimo forma
    };
    

    const roleOptions = ['Super Admin', 'Admin', 'User']; // Galimos rolės pasirinkimui

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Vartotojų Valdymas</h2>
            
            <div className="flex justify-end mb-4">
                <button 
                    className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => alert("Naujo vartotojo kvietimo funkcija veiks per Supabase sendMagicLink funkcijas.")}
                >
                    + Pakviesti naują vartotoją
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">El. Paštas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statusas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rolė</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Veiksmai</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Kraunama...</td></tr>
                        ) : users.map((user) => {
                            // Ar prisijungęs vartotojas yra Super Admin?
                            const isCurrentUserSuperAdmin = currentUserRole === 'Super Admin';
                            // Ar tai yra Super Admin vartotojo įrašas?
                            const isTargetSuperAdmin = user.role === 'Super Admin';
                            
                            // Saugikliai: Trinti ir keisti galima TIK jei prisijungęs yra SA ir TIK jei taikoma ne sau pačiam
                            const isDeleteDisabled = isTargetSuperAdmin || !isCurrentUserSuperAdmin;
                            const isRoleChangeDisabled = isTargetSuperAdmin || !isCurrentUserSuperAdmin;


                            return (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.status === 'AKTYVUS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={isRoleChangeDisabled}
                                    >
                                        {roleOptions.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {/* NAUJAS KOREGAVIMO MYGTUKAS */}
                                    <button 
                                        className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                                        onClick={() => handleEdit(user.id)}
                                        disabled={isRoleChangeDisabled}
                                    >
                                        Koreguoti
                                    </button>
                                    <button 
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        onClick={() => handleDelete(user.id)}
                                        disabled={isDeleteDisabled}
                                    >
                                        Trinti
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SettingsUsers;