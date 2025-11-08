import React, { useState, useEffect } from 'react';

// ČIA BUS IMPORTOJAMA JŪSŲ SUPABASE KLIENTO INSTANCIJA
// Tarkime, kad ji yra src/lib/supabase.ts
// import { supabase } from '../lib/supabase'; 

interface UserProfile {
    id: string;
    email: string;
    role: string; // Iš DB
    status: 'AKTYVUS' | 'NEAKTYVUS';
}

// Bazinė vartotojų lentelės struktūra
const DUMMY_USERS: UserProfile[] = [
    { id: '1', email: 'analitikas@dariusrudvalis.lt', role: 'Super Admin', status: 'AKTYVUS' },
    { id: '2', email: 'buhalteris@imone.lt', role: 'Bookkeeper', status: 'AKTYVUS' },
    { id: '3', email: 'jonas@imone.lt', role: 'Viewer', status: 'NEAKTYVUS' },
];


const SettingsUsers: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>(DUMMY_USERS);
    const [isLoading, setIsLoading] = useState(false);
    
    // Čia vyktų tikras duomenų iš Supabase gavimas
    // Pavyzdžiui, gauti vartotojus iš auth.users ir susieti juos su role
    // useEffect(() => {
    //     async function fetchUsers() {
    //         setIsLoading(true);
    //         // Logika: 1. Gauti visus auth.users. 2. Prijungti role iš user_roles.
    //         // Pakeisti DUMMY_USERS i gautus users
    //         setIsLoading(false);
    //     }
    //     fetchUsers();
    // }, []);


    const handleRoleChange = (userId: string, newRole: string) => {
        // Logika rolei pakeisti
        console.log(`Keičiama vartotojo ${userId} rolė į ${newRole}`);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    const handleDelete = (userId: string) => {
         // Logika vartotojui ištrinti (TIK ADMIN)
        console.log(`Trinamas vartotojas ${userId}`);
        setUsers(users.filter(u => u.id !== userId));
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Vartotojų Valdymas</h2>
            
            <div className="flex justify-end mb-4">
                 {/* Būtų pridėtas mygtukas naujam vartotojui kviesti (per el. paštą) */}
                <button 
                    className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => alert("Ši funkcija bus sukurta vėliau: Naujo vartotojo kvietimas.")}
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
                        ) : users.map((user) => (
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
                                    {/* Rolės pasirinkimo drop-down */}
                                    <select
                                        className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        // Pakeitimas rolės atvaizdavimui (galite pritaikyti savo roles iš DB)
                                        disabled={user.role === 'Super Admin'} // Neleidžiame keisti Super Admin rolės
                                    >
                                        <option value="Super Admin">Super Administratorius</option>
                                        <option value="Admin">Administratorius</option>
                                        <option value="Bookkeeper">Buhalteris</option>
                                        <option value="Viewer">Peržiūros Vartotojas</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        className="text-red-600 hover:text-red-900 ml-4 disabled:opacity-50"
                                        onClick={() => handleDelete(user.id)}
                                        disabled={user.role === 'Super Admin'}
                                    >
                                        Trinti
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SettingsUsers;