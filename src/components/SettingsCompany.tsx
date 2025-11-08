import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Importuojam Supabase

// Interface'as, atitinkantis Jūsų client_data lentelę
interface ClientData {
    client_id: string;
    company_name: string;
    company_pvm_code: string;
    company_code: string;
    bank_account: string;
    email_for_invoices: string;
    rivile_code_prefix: string;
}

// Pradinių duomenų būsena (tušti laukai)
const INITIAL_STATE: ClientData = {
    client_id: '',
    company_name: '',
    company_pvm_code: '',
    company_code: '',
    bank_account: '',
    email_for_invoices: '',
    rivile_code_prefix: '',
};

const SettingsCompany: React.FC<{ userRole: string }> = ({ userRole }) => {
    const [data, setData] = useState<ClientData>(INITIAL_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FUNKCIJA, GAUNANTI DUOMENIS IŠ DB
    useEffect(() => {
        const fetchCompanyData = async () => {
            setIsLoading(true);
            setError(null);
            
            // 1. Gauname prisijungusio vartotojo client_id iš user_profiles lentelės
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('client_id')
                .maybeSingle();

            if (profileError || !profileData) {
                setError('Kritinė klaida: Vartotojas nesusietas su įmone.');
                setIsLoading(false);
                return;
            }

            // 2. Gavus client_id, gauname įmonės info iš client_data
            const { data: clientData, error: clientError } = await supabase
                .from('client_data')
                .select('*')
                .eq('client_id', profileData.client_id)
                .maybeSingle();

            if (clientError) {
                setError('Klaida gaunant įmonės duomenis: ' + clientError.message);
            } else if (clientData) {
                // Sėkmė: įrašome duomenis į būseną
                setData(clientData);
            }
            setIsLoading(false);
        };

        fetchCompanyData();
    }, []);

    // FUNKCIJA, KOREGUOJANTI DUOMENIS IR SAUGANTI Į DB
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!data.client_id) {
            setError('Kritinė klaida: Nerastas įmonės ID.');
            setIsSaving(false);
            return;
        }

        // Leidžiame koreguoti tik Admin/Super Admin
        if (userRole !== 'Admin' && userRole !== 'Super Admin') {
            setError('Neturite teisių koreguoti šių duomenų.');
            setIsSaving(false);
            return;
        }

        // Atnaujiname įrašą client_data lentelėje
        const { error: updateError } = await supabase
            .from('client_data')
            .update({
                company_name: data.company_name,
                company_pvm_code: data.company_pvm_code,
                company_code: data.company_code,
                bank_account: data.bank_account,
                email_for_invoices: data.email_for_invoices,
                rivile_code_prefix: data.rivile_code_prefix,
            })
            .eq('client_id', data.client_id); // Užtikrina, kad atnaujinsime tik SAVO įrašą

        if (updateError) {
            setError('Klaida saugant: ' + updateError.message);
        } else {
            alert('Įmonės duomenys sėkmingai atnaujinti!');
        }
        setIsSaving(false);
    };


    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Kraunami įmonės nustatymai...</div>;
    }

    // Patikrinimas, ar vartotojas gali redaguoti
    const canEdit = userRole === 'Admin' || userRole === 'Super Admin';

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Įmonės Informacija</h2>
            
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <p className="text-lg font-medium text-slate-700 mb-4">Bazinis Kliento Profilis</p>
                <p className="text-sm text-slate-600 mb-4">
                    Šie duomenys naudojami automatiniam sąskaitų filtravimui (Jūsų PVM kodas) ir eksporto nustatymams.
                </p>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-slate-700 font-medium">Įmonės Pavadinimas:</span>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_name}
                                onChange={(e) => setData({ ...data, company_name: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                        <label className="block">
                            <span className="text-slate-700 font-medium">PVM Kodas (LT...):</span>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_pvm_code}
                                onChange={(e) => setData({ ...data, company_pvm_code: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                        <label className="block">
                            <span className="text-slate-700 font-medium">Juridinis/Asmens Kodas:</span>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_code}
                                onChange={(e) => setData({ ...data, company_code: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                        <label className="block">
                            <span className="text-slate-700 font-medium">Rivile/Buhalterijos Prefix'as:</span>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.rivile_code_prefix}
                                onChange={(e) => setData({ ...data, rivile_code_prefix: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                        <label className="block">
                            <span className="text-slate-700 font-medium">Banko Sąskaita:</span>
                            <input 
                                type="text" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.bank_account}
                                onChange={(e) => setData({ ...data, bank_account: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                        <label className="block">
                            <span className="text-slate-700 font-medium">Sąskaitų El. Paštas:</span>
                            <input 
                                type="email" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.email_for_invoices}
                                onChange={(e) => setData({ ...data, email_for_invoices: e.target.value })}
                                readOnly={!canEdit}
                            />
                        </label>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <button 
                            type="submit"
                            className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
                            disabled={!canEdit || isSaving}
                        >
                            {isSaving ? 'Saugoma...' : 'Saugoti Pakeitimus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SettingsCompany;