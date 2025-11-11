import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase'; // Tikra Supabase instancija


// === Sąsaja be Rivile prefix ===
interface ClientData {
    client_id: string;
    company_name: string;
    company_pvm_code: string;
    company_code: string;
    bank_account: string;
    email_for_invoices: string;
    manager_name: string; 
}

// Lokalūs pavyzdiniai duomenys
const ALL_COMPANIES_DATA: Record<string, ClientData> = {
    'IV-1': { // Dariaus Rudvalio IV
        client_id: 'IV-1', 
        company_name: 'Dariaus Rudvalio IV (System)',
        company_pvm_code: 'LT100200',
        company_code: '300100200',
        bank_account: 'LT1210000111111111', 
        email_for_invoices: 'admin@iv.lt',
        manager_name: 'Darius Rudvalis',
    },
    'CLIENT-2': { // Buhalteris Demo
        client_id: 'CLIENT-2', 
        company_name: 'Buhalteris Demo (Client)',
        company_pvm_code: 'LT400200',
        company_code: '400100200',
        bank_account: 'LT9990000999999999', 
        email_for_invoices: 'buhalteris@demo.lt',
        manager_name: 'Jonas Buklauskas',
    },
}

interface SettingsCompanyProps {
    userRole: string;
    userCompanyId: string;
    setCurrentView: (view: any) => void; 
}


const SettingsCompany: React.FC<SettingsCompanyProps> = ({ userRole, userCompanyId, setCurrentView }) => {
    
    const [data, setData] = useState<ClientData>(ALL_COMPANIES_DATA[userCompanyId] || ALL_COMPANIES_DATA['IV-1']); 
    const [isLoading, setIsLoading] = useState(false); 
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);
        
        const fetchedData = ALL_COMPANIES_DATA[userCompanyId]; 
        
        if (fetchedData) {
            setData(fetchedData);
        } else {
            setError(`Įmonės ${userCompanyId} nustatymų nerasta.`);
        }
        setIsLoading(false);
    }, [userCompanyId]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        if (data.client_id !== userCompanyId) {
            setError('Saugumo klaida: Nesutampa prisijungusios įmonės ID.');
            setIsSaving(false);
            return;
        }

        if (userRole !== 'Admin' && userRole !== 'Super Admin') {
            setError('Neturite teisių koreguoti šių duomenų.');
            setIsSaving(false);
            return;
        }

        console.log('Duomenys sėkmingai paruošti siuntimui į DB:', data);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSuccessMessage(`Įmonės "${data.company_name}" duomenys sėkmingai atnaujinti LOKALIAI!`);
        setIsSaving(false);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData(prev => ({
            ...prev,
            [name as keyof ClientData]: value
        }));
    };

    const handleViewUsers = () => {
        setCurrentView('settings-users');
    };


    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Kraunami įmonės nustatymai...</div>;
    }

    const canEdit = userRole === 'Admin' || userRole === 'Super Admin';
    
    const displayError = error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4 font-medium">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
    );
    
    const displaySuccess = successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg mb-4 font-medium">
             <i className="fas fa-check-circle mr-2"></i> {successMessage}
        </div>
    );

    return (
        <div className="p-8">
            {/* ANTRAŠTĖ */}
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Įmonės Informacija ({data.client_id})</h2>
            
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                
                {displayError}
                {displaySuccess}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* PAGRINDINĖ INFORMACIJA (VIENAS STULPELIS) */}
                    <div className="grid grid-cols-1 gap-4">
                        
                        {/* 1. Pavadinimas */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">Pavadinimas:</span>
                            <input 
                                type="text" 
                                name="company_name"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_name}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>

                        {/* 2. Kodas */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">Kodas (Juridinis/Asmens):</span>
                            <input 
                                type="text" 
                                name="company_code"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_code}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>

                        {/* 3. PVM Kodas */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">PVM kodas:</span>
                            <input 
                                type="text" 
                                name="company_pvm_code"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.company_pvm_code}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>

                        {/* 4. Banko Sąskaita */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">Banko Sąskaita (IBAN):</span>
                            <input 
                                type="text" 
                                name="bank_account"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.bank_account}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>
                        
                        {/* 5. Vadovas */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">Vadovas:</span>
                            <input 
                                type="text" 
                                name="manager_name"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.manager_name}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>

                        {/* 6. Sąskaitų El. Paštas */}
                        <label className="block">
                            <span className="text-slate-700 font-bold">Sąskaitų El. Paštas:</span>
                            <input 
                                type="email" 
                                name="email_for_invoices"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
                                value={data.email_for_invoices}
                                onChange={handleChange}
                                readOnly={!canEdit}
                            />
                        </label>
                    </div>

                    {/* PAKEISTA: Taisyklingas mygtukų išdėstymas vienoje eilutėje, kairėje pusėje */}
                    <div className="pt-4 border-t border-slate-200 flex items-center gap-4">
                        
                        {/* Vartotojų Sąrašas mygtukas */}
                        <button 
                            type="button"
                            onClick={handleViewUsers}
                            className="text-indigo-600 hover:text-indigo-800 transition font-medium px-4 py-2"
                            title="Peržiūrėti visus šios įmonės vartotojus"
                        >
                            <i className="fas fa-users mr-2"></i> Vartotojų Sąrašas
                        </button>
                        
                        {/* Saugoti Pakeitimus mygtukas (su 1/2 pločio nustatymu ir flex-grow) */}
                        <button 
                            type="submit"
                            // Nustatome plotį (w-1/2, max-w-sm) ir pašaliname justify-end apvyniojimą
                            className="w-1/2 max-w-sm bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
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