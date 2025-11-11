import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { View } from '../App';
import { Database } from '../types/database'; // Importuojame pagrindinius tipus

// Naudojame tipą tiesiai iš Supabase
type CompanyData = Database['public']['Tables']['companies']['Row'];

interface SettingsCompanyProps {
    userRole: string;
    userCompanyId: string;
    setCurrentView: (view: View) => void;
}

const SettingsCompany: React.FC<SettingsCompanyProps> = ({ userRole, userCompanyId, setCurrentView }) => {
    
    // Nustatome pradinius duomenis kaip 'null'
    const [companyData, setCompanyData] = useState<Partial<CompanyData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Duomenų atsisiuntimas iš Supabase
    useEffect(() => {
        const fetchCompanyData = async () => {
            setIsLoading(true);
            setError(null);

            // select('*') automatiškai paims naujus stulpelius
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', userCompanyId)
                .single();

            if (error) {
                console.error("Klaida gaunant įmonės duomenis:", error);
                setError("Nepavyko užkrauti įmonės duomenų.");
            } else if (data) {
                setCompanyData(data);
            }
            setIsLoading(false);
        };

        fetchCompanyData();
    }, [userCompanyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Naudojame 'value || null', kad tuščias laukas būtų išsaugotas kaip NULL
        setCompanyData(prev => ({ ...prev, [name]: value || null }));
    };

    // Išsaugojimas į Supabase
    const handleSave = async () => {
        setError(null);
        setShowSuccess(false);

        // Pašaliname laukus, kurių negalima atnaujinti
        const { id, created_at, ...updateData } = companyData;
        
        // Pataisymas: Išsaugant, boolean laukus grąžiname į boolean formatą
        const finalUpdateData = { ...updateData };
        
        // Įveskite boolean laukų konvertavimo logiką, jei juos redaguojate per tekstinius laukus
        // Kol kas paliekame taip, kaip yra, nes boolean laukai neįtraukti į formą

        const { error } = await supabase
            .from('companies')
            .update(finalUpdateData)
            .eq('id', userCompanyId);

        if (error) {
            console.error("Klaida išsaugant duomenis:", error);
            setError("Klaida išsaugant pakeitimus.");
        } else {
            setShowSuccess(true);
            setIsEditing(false);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const handleViewUsers = () => {
        if (companyData.name) {
            setCurrentView('users'); 
        }
    };

    // --- Rodymai ---

    if (isLoading) {
        return <div className="p-8">Kraunami įmonės duomenys...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-600">{error}</div>;
    }

    // PATAISYTA FUNKCIJA: Pridedamas String() konvertavimas, kad būtų išvengta klaidų su boolean reikšmėmis
    const renderField = (label: string, name: keyof CompanyData, placeholder: string = '') => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
                type="text"
                name={name}
                // Pataisymas: Konvertuojame į string, kad nebūtų klaidos su boolean tipu
                value={String(companyData[name] ?? '')} 
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={placeholder}
            />
        </div>
    );
    
    // PATAISYTA FUNKCIJA: Pridedamas String() konvertavimas
    const renderTextArea = (label: string, name: keyof CompanyData, placeholder: string = '') => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <textarea
                name={name}
                // Pataisymas: Konvertuojame į string, kad nebūtų klaidos su boolean tipu
                value={String(companyData[name] ?? '')}
                onChange={handleChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={placeholder}
            />
        </div>
    );


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Įmonės Informacija ({companyData.id})</h1>

            {showSuccess && (
                <div className="mb-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded-lg">
                    Duomenys sėkmingai atnaujinti!
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6">
                
                {renderField("Pavadinimas", "name", "Įmonės pavadinimas")}
                {renderField("Kodas (Juridinis/Asmens)", "code", "Įmonės kodas")}
                {renderField("PVM kodas", "vat_code", "LT...")}
                {renderField("Registracijos Adresas", "address", "Gatvė, miestas, šalis")}
                
                {/* --- PRIDĖTAS NAUJAS LAUKAS --- */}
                {renderField("Korespondencijos Adresas", "correspondence_address", "Gatvė, miestas, šalis (jei skiriasi)")}
                
                <hr className="my-6" />

                {renderField("Banko Pavadinimas", "bank_name", "Banko pavadinimas")}
                {renderField("Banko Sąskaita (IBAN)", "bank_iban", "LT...")}
                
                <hr className="my-6" />

                {renderField("Vadovas", "owner_name", "Vardas Pavardė")}
                {renderField("Sąskaitų El. Paštas", "owner_email", "el.pastas@imone.lt")}

                {/* --- PRIDĖTAS NAUJAS LAUKAS --- */}
                {renderTextArea("Pastabos", "notes", "Vidinė informacija, pastabos...")}


                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                    <button
                        onClick={handleViewUsers}
                        className="px-5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <i className="fas fa-users mr-2"></i>
                        Vartotojų Sąrašas
                    </button>
                    
                    <div className="flex gap-4">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    Atšaukti
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Saugoti Pakeitimus
                                </button>
                            </>
                        ) : (
                            <button
                                disabled={userRole !== 'Admin' && userRole !== 'Super Admin'}
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                            >
                                <i className="fas fa-edit mr-2"></i>
                                Redaguoti
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsCompany;