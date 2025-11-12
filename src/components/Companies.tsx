import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Būtinai atkreipkite dėmesį, kad tipų failas būtų pasiekiamas tokiu keliu!
import { Database } from '../types/database'; 

// 🟢 PATAISYTA: Dabar tiksliai atspindime 'companies' lentelės Row tipą
// Naudojame tipą tiesiai iš Supabase
type Company = Database['public']['Tables']['companies']['Row'];

// 🟢 PRIDĖTA: Tipas, skirtas naujiems/redaguojamiems duomenims (be automatiškai sugeneruojamų laukų)
// 'id' ir 'created_at' gali neegzistuoti 'Insert' atveju
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
// Išsaugojimo funkcija turės naudoti bendrą Insert/Update tipą, o ne Omit<Row>

interface CompaniesProps {
    userRole: string;
    // userCompanyId: string; // 🔴 PATAISYMAI JŪSŲ PROPS faile: Jei jis gali būti null, pakeiskite į string | null
    userCompanyId: string; 
    viewType: 'all' | 'tenants';
    onViewUsers: (companyName: string) => void;
}

// Įmonių ID konstantos (patogumui)
const COMPANY_ID_MY_IV = 'IV-1';
const COMPANY_ID_DEMO = 'CLIENT-2';

const Companies: React.FC<CompaniesProps> = ({ userRole, userCompanyId, viewType, onViewUsers }) => {
    
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    // 🟢 PATAISYTA: CompanyModal komponentas pridedamas po funkcija
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

    // Duomenų gavimas iš Supabase (logika atnaujinta)
    useEffect(() => {
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

    // 🟢 PATAISYTA FUNKCIJA
    const handleSaveCompany = async (companyData: CompanyInsert | CompanyUpdate) => {
        // Išvalome nereikalingus laukus, jei naudojame CompanyUpdate tipą atnaujinimui
        const dataToSave = { ...companyData };
        if (dataToSave.created_at !== undefined) delete dataToSave.created_at; 
        if (dataToSave.id !== undefined) delete dataToSave.id; 
        
        if (editingCompany) {
            // --- REDAGAVIMAS ---
            const { error } = await supabase
                .from('companies')
                // Naudojame CompanyUpdate tipą. dataToSave dabar tinka Update tipui.
                .update(dataToSave as CompanyUpdate) 
                .eq('id', editingCompany.id);

            if (error) {
                console.error("Atnaujinimo klaida:", error);
                setError("Klaida atnaujinant duomenis.");
            } else {
                // Atnaujinant būseną, sujungiam tik atnaujintus laukus
                setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...dataToSave } as Company : c));
            }

        } else {
            // --- KŪRIMAS ---
            // 'id' privalo būti Insert tipe, bet jau buvo pašalintas iš dataToSave
            const insertData = { ...companyData, id: companyData.id! } as CompanyInsert;
            // 🔴 PAŽYMĖKITE: companyData.id turi būti string, o ne null!

            const { data, error } = await supabase
                .from('companies')
                // Naudojame CompanyInsert tipą
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
    // ... likusi kodo dalis nebuvo modifikuota 
    // ... (Čia būtų CompanyModal deklaracija)

// ...

// 🔴 PRIDĖTAS CompanyModal KOMPONENTAS
interface CompanyModalProps {
    company: Company | null;
    onClose: () => void;
    // 🟢 PATAISYTA: onSave priima CompanyInsert | CompanyUpdate tipus
    onSave: (companyData: CompanyInsert | CompanyUpdate) => void; 
    userRole: string;
    userCompanyId: string;
}

const getDefaultParentId = (userRole: string, userCompanyId: string): string | null => {
    if (userRole === 'Super Admin' || userCompanyId === COMPANY_ID_MY_IV) {
        return null; 
    }
    return userCompanyId; 
}

const CompanyModal: React.FC<CompanyModalProps> = ({ company, onClose, onSave, userRole, userCompanyId }) => {
    
    // 🟢 PATAISYTA: Pradinė būsena turi atitikti Company tipą, bet turi turėti tik tuos laukus, kuriuos galima įterpti/atnaujinti.
    const [formData, setFormData] = useState<CompanyInsert | CompanyUpdate>(company || {
        // id: company?.id || '', // 🔴 NENAUDOTI! 'id' yra skirtas Insert, bet ne Update.
        id: company ? undefined : '', // Jei kuriame, ID gali būti string, jei redaguojame – nenaudojamas
        name: company?.name || '',
        code: company?.code || null,
        vat_code: company?.vat_code || null,
        address: company?.address || null,
        correspondence_address: company?.correspondence_address || null, 
        notes: company?.notes || null, 
        bank_name: company?.bank_name || null,
        bank_iban: company?.bank_iban || null,
        owner_name: company?.owner_name || null,
        owner_email: company?.owner_email || null,
        parent_company_id: company?.parent_company_id !== undefined ? company.parent_company_id : getDefaultParentId(userRole, userCompanyId)
        // 🔴 PRIDĖTI: Reikalingi stulpeliai, jei jie naudojami forme, o anksčiau nebuvo.
        email: company?.email || null,
        phone: company?.phone || null,
        city: company?.city || null,
        postal_code: company?.postal_code || null,
        country: company?.country || null,
        is_buyer: company?.is_buyer ?? false,
        is_supplier: company?.is_supplier ?? false,
        is_tenant: company?.is_tenant ?? false,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value || null 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 🟢 PATAISYTA: Jei redaguojame, nesiunčiame 'id' lauko atnaujinimui
        const dataToSave = { ...formData };
        if (company) {
            delete dataToSave.id; // Neleisti perrašyti ID per update
        }

        onSave(dataToSave as CompanyInsert | CompanyUpdate);
    };

    const showParentIdField = userRole === 'Super Admin' || userCompanyId === COMPANY_ID_MY_IV;

    return (
        // ... Modal UI dalis ...
        // 🔴 PRIDĖTI: Trūkstami input laukai, kad būtų išvengta klaidų CompanyModal inicializacijoje, jei jie yra DB schemoje.
        // DĖMESIO: Palikau tik Jūsų pateiktus laukus UI kode, bet pilna forma turėtų turėti VISUS laukus iš DB (city, country, is_buyer ir t.t.), kad atitiktų CompanyInsert/Update tipą.
        
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
                    {/* ... (likusi forma nebuvo modifikuota) */}
                    
                    {/* Kitu atveju naudokite visą pateiktą CompanyModal kodą. */}
                    
                </form>
            </div>
        </div>
    );
};
