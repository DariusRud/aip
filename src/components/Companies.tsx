import React, { useState } from 'react';

// === 1. Sąsaja (Interface) ===
interface Company {
    id: string;
    name: string;
    company_code: string | null;
    vat_code: string | null;
    legal_address: string | null;
    correspondence_address: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_supplier: boolean; 
    is_buyer: boolean;  
    is_tenant: boolean;   // Sistemos Naudotojas
    owner_company_id: string | null; // Savininko ID
    country: string;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    type: string | null;
    notes: string | null;
    created_at: string;
}

// === 2. Pradiniai Duomenys (LOKALIAI) ===
const COMPANY_ID_MY_IV = 'IV-1'; // Dariaus Rudvalio IV ID (Super Admino įmonė)
const COMPANY_ID_DEMO = 'CLIENT-2'; // Buhalteris Demo ID (Kliento įmonė)
const COMPANY_ID_CLIENT_A = 'CA-4'; // Klientas A ID
const COMPANY_ID_CLIENT_B = 'CA-5'; // Klientas B ID

const DUMMY_COMPANIES: Company[] = [
    // 1. JŪS (Super Adminas) - Tiekėjas, Pirkėjas ir SISTEMOS NAUDOTOJAS
    { 
        id: COMPANY_ID_MY_IV, name: 'Dariaus Rudvalio IV', company_code: '300100200', vat_code: 'LT100200', legal_address: 'Gedimino 1, Vilnius', correspondence_address: null, contact_person: 'Darius', contact_email: 'admin@iv.lt', contact_phone: '+37060010001',
        is_supplier: true, is_buyer: true, is_tenant: true, owner_company_id: null, country: 'Lietuva', address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'both', notes: null, created_at: new Date().toISOString()
    },
    // 2. Buhalteris Demo - TIK Naudotojas (Savininkas: Dariaus Rudvalio IV)
    { 
        id: COMPANY_ID_DEMO, name: 'Buhalteris Demo', company_code: '400100200', vat_code: 'LT400200', legal_address: 'Demo g. 5, Vilnius', correspondence_address: null, contact_person: 'Jonas', contact_email: 'jonas@demo.lt', contact_phone: '+37060010002',
        is_supplier: false, is_buyer: false, is_tenant: true, owner_company_id: COMPANY_ID_MY_IV, country: 'Lietuva', address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'tenant', notes: null, created_at: new Date().toISOString()
    },
    // 3. Klientas A - TIK Pirkėjas (Savininkas: Buhalteris Demo)
    { 
        id: COMPANY_ID_CLIENT_A, name: 'Klientas A', company_code: '600100200', vat_code: 'LT600200', legal_address: 'A g. 1, Kaunas', correspondence_address: null, contact_person: 'Ona', contact_email: 'ona@klientasA.lt', contact_phone: null,
        is_supplier: false, is_buyer: true, is_tenant: false, owner_company_id: COMPANY_ID_DEMO, country: 'Lietuva', address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'buyer', notes: null, created_at: new Date().toISOString()
    },
    // 4. Klientas B - TIK Tiekėjas (Savininkas: Buhalteris Demo)
    { 
        id: COMPANY_ID_CLIENT_B, name: 'Klientas B', company_code: '700100200', vat_code: 'LT700200', legal_address: 'B g. 2, Klaipėda', correspondence_address: null, contact_person: 'Petras', contact_email: 'petras@klientasB.lt', contact_phone: null,
        is_supplier: true, is_buyer: false, is_tenant: false, owner_company_id: COMPANY_ID_DEMO, country: 'Lietuva', address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'supplier', notes: null, created_at: new Date().toISOString()
    },
    // 5. Tiekėjas - TIK Tiekėjas (Globalus/Bendras. Savininkas: Nėra)
    { 
        id: 'SUPP-6', name: 'Bitė Lietuva', company_code: '800100200', vat_code: 'LT800200', legal_address: 'Bite g. 10, Vilnius', correspondence_address: null, contact_person: 'Julius', contact_email: 'sales@bite.lt', contact_phone: null,
        is_supplier: true, is_buyer: false, is_tenant: false, owner_company_id: null, country: 'Lietuva', address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'supplier', notes: null, created_at: new Date().toISOString()
    },
];


interface CompaniesProps {
    userRole: string;
    userCompanyId: string;
    viewType: 'all' | 'tenants'; // 'all' (Įmonės) arba 'tenants' (Sistemos naudotojai)
    onViewUsers: (companyName: string) => void; 
}

function Companies({ userRole, userCompanyId, viewType, onViewUsers }: CompaniesProps) {
    const [companies, setCompanies] = useState<Company[]>(DUMMY_COMPANIES);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // === FILTRŲ BŪSENOS ===
    const [filterName, setFilterName] = useState('');
    const [filterType, setFilterType] = useState<'' | 'is_tenant' | 'is_supplier' | 'is_buyer'>('');
    const [filterOwner, setFilterOwner] = useState(''); 

    const initialFormData: Omit<Company, 'id' | 'owner_company_id'> = {
        name: '', company_code: '', vat_code: '', legal_address: '', correspondence_address: '', contact_person: '', contact_email: '', contact_phone: '',
        is_supplier: false, is_buyer: false, is_tenant: false, country: 'Lietuva', 
        address: null, city: null, postal_code: null, phone: null, email: null, website: null, type: 'both', notes: null, created_at: new Date().toISOString(),
    };
    const [formData, setFormData] = useState<Omit<Company, 'id' | 'owner_company_id'>>(initialFormData);
    

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCompany(null);
        setError('');
    };

    const handleOpenModal = (company?: Company) => {
        // Negalima redaguoti, jei vartotojas nėra Super Admin, NEBENT tai yra jo paties įmonė
        if (company && company.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin') {
             setError('Tik Super Admin gali redaguoti sistemos savininko įmonę.');
             return;
        }

        if (company) {
            setEditingCompany(company);
            setFormData({
                name: company.name,
                company_code: company.company_code || '',
                vat_code: company.vat_code || '',
                legal_address: company.legal_address || '',
                correspondence_address: company.correspondence_address || '',
                contact_person: company.contact_person || '',
                contact_email: company.contact_email || '',
                contact_phone: company.contact_phone || '',
                is_supplier: company.is_supplier,
                is_buyer: company.is_buyer,
                is_tenant: company.is_tenant,
                country: company.country,
                notes: company.notes,
                address: company.address, city: company.city, postal_code: company.postal_code, phone: company.phone, email: company.email, website: company.website, type: company.type, created_at: company.created_at,
            });
        } else {
            setEditingCompany(null);
            setFormData(initialFormData);
        }
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Patikrinimas: tik Super Adminas gali redaguoti/kurti be savininko ID
        if (userRole !== 'Super Admin' && !editingCompany) {
            // Leidžiame kurti ne Super Adminui TIK su sąlyga, kad tai bus jo klientas
            if (!formData.is_supplier && !formData.is_buyer) {
                 setError('Ne Super Admin gali pridėti tik Tiekėjus ar Pirkėjus.');
                 return;
            }
        }
        
        // Patikrinimas: Drausti saugoti sistemos savininko įmonės pakeitimus ne Super Adminui
        if (editingCompany && editingCompany.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin') {
             setError('Neturite teisės išsaugoti sistemos savininko įmonės pakeitimų.');
             return;
        }

        const submittedData: Company = {
            ...formData,
            id: editingCompany ? editingCompany.id : Date.now().toString(),
            // Nustatome owner_company_id pagal rolę
            owner_company_id: editingCompany && editingCompany.id === COMPANY_ID_MY_IV 
                ? null 
                : (editingCompany 
                    ? editingCompany.owner_company_id 
                    : (userRole === 'Super Admin' 
                        ? (formData.is_tenant ? COMPANY_ID_MY_IV : null) // Super Adminas tenant'us priskiria IV-1, o Tiekėjus/Pirkėjus palieka globalius (null)
                        : userCompanyId // Kiti kuria TIEKĖJUS/PIRKĖJUS po savo įmonės vėliava
                    )
                ), 
            company_code: formData.company_code || null,
            vat_code: formData.vat_code || null,
            legal_address: formData.legal_address || null,
            correspondence_address: formData.correspondence_address || null,
            contact_person: formData.contact_person || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            notes: formData.notes || null,
            address: formData.address || null, 
            city: formData.city || null, 
            postal_code: formData.postal_code || null, 
            phone: formData.contact_phone || null, 
            email: formData.contact_email || null, 
            website: formData.website || null, 
            type: formData.type || 'none', 
            created_at: editingCompany?.created_at || new Date().toISOString(),
        } as Company;

        setCompanies(prev => {
            if (editingCompany) {
                return prev.map(c => c.id === submittedData.id ? submittedData : c);
            } else {
                return [...prev, submittedData];
            }
        });
        
        console.log("Lokalus Įmonės Įrašas:", submittedData);

        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (userRole !== 'Super Admin') {
            console.error('Klaida: Tik Super Admin gali trinti įmones.');
            return;
        }

        if (id === COMPANY_ID_MY_IV) {
            alert('Sistemos savininko įmonė negali būti ištrinta.');
            return;
        }
        
        if (!confirm('Ar tikrai norite ištrinti šią įmonę?')) return;
        setCompanies(prev => prev.filter(c => c.id !== id));
    };

    const getCompanyNameById = (id: string | null) => {
        if (!id) return 'Super Administravimas';
        return companies.find(c => c.id === id)?.name || 'Nežinoma Įmonė';
    };

    // --- PATAISYTA: PAGRINDINĖ FILTRAVIMO LOGIKA ---
    const filteredCompanies = companies.filter(company => {
        
        // 1. **Vartotojo Rolės Matomumas (Hierarchijos filtras)**
        // Ši dalis apriboja, KURIAS įmones vartotojas apskritai mato
        const isMyCompany = company.id === userCompanyId;
        const isMyOwnedCompany = company.owner_company_id === userCompanyId;
        const isGlobal = company.owner_company_id === null;

        if (userRole === 'Super Admin') {
            
            // SUPER ADMINUI: Bendrame sąraše ('all') rodome tik GLOBAL ir SAVO (IV-1) įrašus.
            if (viewType === 'all') {
                // Jei tai nėra Sistemos savininko įmonė ARBA globalus įrašas, bet jis turi owner_company_id (t.y. priklauso kitam tenantui)
                if (!isMyCompany && !isGlobal && company.owner_company_id !== null) {
                    return false; // Pašaliname Buhalteris Demo, Klientas A, Klientas B
                }
            }
            
            // Tenant sąraše ('tenants') mato visus tenantus
            // (papildomų filtrų nereikia, tai reguliuoja viewType filtras žemiau)
            
        } else {
            // NE Super Adminui (Buhalteris Demo): Matyti TIK savo, savo klientų ir globalias įmones.
            if (!isMyCompany && !isMyOwnedCompany && !isGlobal) {
                 return false; 
            }
        }

        // 2. **VAIZDO LOGIKA (viewType filtras)**
        // Ši dalis filtruoja pagal tai, koks sąrašas (vaizdas) rodomas
        if (viewType === 'tenants') {
            // Rodo TIK tas įmones, kurios yra is_tenant
            if (!company.is_tenant) return false;
            
            // Užtikriname, kad ne Super Adminas matytų tik sau priklausančius tenantus (išskyrus save)
            if (userRole !== 'Super Admin' && !isMyCompany && !isMyOwnedCompany) {
                 return false;
            }

        } else { // viewType === 'all' (Įmonės sąrašas)
            // Pašaliname tas, kurios TIK is_tenant (pvz. Buhalteris Demo)
            const isOnlyTenant = company.is_tenant && !company.is_supplier && !company.is_buyer;
            if (isOnlyTenant) return false;
        }
        
        // 3. Pavadinimo/Kodo filtras
        if (filterName && 
            !company.name.toLowerCase().includes(filterName.toLowerCase()) && 
            !company.company_code?.toLowerCase().includes(filterName.toLowerCase())
        ) {
            return false;
        }

        // 4. Tipo filtras 
        if (viewType === 'all' && filterType) {
            if (filterType === 'is_tenant' && !company.is_tenant) return false;
            if (filterType === 'is_supplier' && !company.is_supplier) return false;
            if (filterType === 'is_buyer' && !company.is_buyer) return false;
        }
        
        // 5. Savininko (Owner) filtras (tik Super Admin gali matyti)
        if (userRole === 'Super Admin' && filterOwner) {
            // Naudojame owner ID (nes pavadinimas gali kartotis)
            const selectedOwnerCompanyId = companies.find(c => c.name === filterOwner)?.id || null;
            if (getCompanyNameById(company.owner_company_id) !== filterOwner && selectedOwnerCompanyId !== company.id) {
                 return false;
            }
        }

        return true;
    });
    
    // Unikalūs Savininkai filtravimui: 
    // Super Admin mato visus ownerius (tenant'us), kiti mato tik Super Adminą ir save.
    const uniqueOwners = Array.from(new Set(
        companies
            .filter(c => c.is_tenant && (userRole === 'Super Admin' || c.id === userCompanyId || c.id === COMPANY_ID_MY_IV) )
            .map(c => getCompanyNameById(c.owner_company_id))
    )).filter(Boolean); // Pašalinti 'Super Administravimas' iš filtro

    
    const getTypeBadges = (company: Company, currentViewType: 'all' | 'tenants') => {
        const badges = [];
        
        if (company.is_tenant && currentViewType === 'tenants') { 
            badges.push(<span key="tenant" className="bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium rounded">Naudotojas</span>);
        }
        
        if (company.is_supplier) {
            badges.push(<span key="supplier" className="bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium rounded">Tiekėjas</span>);
        }
        if (company.is_buyer) {
            badges.push(<span key="buyer" className="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium rounded">Pirkėjas</span>);
        }
        
        return <div className="flex flex-wrap gap-1">{badges}</div>;
    };


    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Kraunama...</div></div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{viewType === 'tenants' ? 'Sistemos Naudotojų Įmonės' : 'Įmonės'}</h1>
                        <p className="text-sm text-slate-500 mt-1">{viewType === 'tenants' ? 'Įmonės, kurios turi vartotojų valdymo prieigą' : 'Valdomi visi partneriai ir klientai sistemoje'}</p>
                    </div>
                    {/* LEIDŽIAME PRIDĖTI ĮMONĘ: Super Admin visada, kiti tik 'all' sąraše (kurdami sau Tiekėjus/Pirkėjus) */}
                    {((userRole === 'Super Admin') || (viewType === 'all')) && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Pridėti Įmonę
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* === FILTRAVIMO JUOSTA === */}
            <div className="bg-white px-8 pt-4 pb-6 border-b border-slate-200">
                <div className="grid grid-cols-5 gap-4 items-end">
                    
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Įmonės pavadinimas / Kodas</label>
                        <input
                            type="text"
                            placeholder="Įveskite pavadinimą ar kodą"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    
                    {/* TIPŲ FILTRAS RODOMAS TIK "ALL" VAIZDE */}
                    {viewType === 'all' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Įmonės Tipas</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Visi tipai</option>
                                {/* Sistemos Naudotojo tipas rodomas tik Super Adminui (All sąraše) */}
                                {userRole === 'Super Admin' && <option value="is_tenant">Sistemos Naudotojas</option>}
                                <option value="is_supplier">Tiekėjas</option>
                                <option value="is_buyer">Pirkėjas</option>
                            </select>
                        </div>
                    ) : (
                        // Jei rodomas 'tenants' vaizdas, stulpelis paliekamas tuščias.
                        <div className="col-span-1"></div> 
                    )}

                    {/* SAVININKO FILTRAS RODOMAS TIK SUPER ADMINUI */}
                    {userRole === 'Super Admin' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Savininkas</label>
                            <select
                                value={filterOwner}
                                onChange={(e) => setFilterOwner(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Visi Savininkai</option>
                                {uniqueOwners.map(ownerName => (
                                    <option key={ownerName} value={ownerName}>{ownerName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div>
                        <button
                            onClick={() => { setFilterName(''); setFilterType(''); setFilterOwner(''); }}
                            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <i className="fas fa-trash-alt mr-2"></i>
                            Valyti
                        </button>
                    </div>

                    {/* Rodome aktyvius filtrus kaip pavyzdį */}
                    {(filterName || filterType || filterOwner) && (
                        <div className="col-span-5 mt-2 text-sm text-slate-600">
                            **Aktyvūs filtrai:**
                            {filterName && <span className="ml-2 px-2 py-1 bg-indigo-100 rounded-md">Pavadinimas/Kodas: {filterName}</span>}
                            {filterType && <span className="ml-2 px-2 py-1 bg-indigo-100 rounded-md">Tipas: {filterType}</span>}
                            {filterOwner && <span className="ml-2 px-2 py-1 bg-indigo-100 rounded-md">Savininkas: {filterOwner}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* === LENTELĖS VAIZDAS === */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] divide-y divide-slate-200">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-10">ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-60">PAVADINIMAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-32">TIPAI</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-24">ĮMONĖS KODAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-24">PVM KODAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-48">ADRESAI</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-32">KONTAKTAS</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 w-32">SAVININKAS</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-700 w-20">VEIKSMAI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50">
                                        <td className="py-3 px-4 text-sm text-slate-500">{company.id}</td>
                                        <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                            {company.name}
                                            {/* Rodyti Vartotojus mygtukas */}
                                            {company.is_tenant && (
                                                <button
                                                    onClick={() => onViewUsers(company.name)} 
                                                    title={`Rodyti ${company.name} vartotojus`}
                                                    className="ml-2 text-indigo-500 hover:text-indigo-800 transition"
                                                >
                                                    <i className="fas fa-users text-sm"></i>
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm">{getTypeBadges(company, viewType)}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{company.company_code}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">{company.vat_code || 'Nėra'}</td>
                                        <td className="py-3 px-4 text-sm text-slate-600">
                                            {company.legal_address}, {company.country}
                                            {company.correspondence_address && <span className="text-xs text-slate-400 block">Koresp.: {company.correspondence_address}</span>}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600">
                                            {company.contact_person} 
                                            {company.contact_email && <span className="text-xs text-slate-400 block">{company.contact_email}</span>}
                                            {company.contact_phone && <span className="text-xs text-slate-400 block">Tel: {company.contact_phone}</span>}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-indigo-700">
                                            {getCompanyNameById(company.owner_company_id)}
                                        </td>
                                        {/* Veiksmų mygtukai: Redagavimas leidžiamas Super Adminui ARBA jei tai paties vartotojo įmonė. */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center space-x-2">
                                                {(userRole === 'Super Admin' || company.id === userCompanyId) && (
                                                    <button
                                                        onClick={() => handleOpenModal(company)}
                                                        title="Redaguoti"
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <i className="fas fa-edit text-base"></i>
                                                    </button>
                                                )}
                                                
                                                {/* Trynimas leidžiamas tik Super Adminui ir ne sistemos savininko įmonei */}
                                                {(userRole === 'Super Admin' && company.id !== COMPANY_ID_MY_IV) && (
                                                    <button
                                                        onClick={() => handleDelete(company.id)}
                                                        title="Trinti"
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <i className="fas fa-trash text-base"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === MODALAS (ĮMONĖS KORTELĖ) === */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                               <h2 className="text-xl font-bold text-slate-800">
                                   {editingCompany ? 'Redaguoti Įmonę' : 'Nauja Įmonė'}
                               </h2>
                               <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                   <i className="fas fa-times text-xl"></i>
                               </button>
                          </div>
                          <form onSubmit={handleSubmit} className="p-6">
                               <div className="grid grid-cols-2 gap-4">
                                   
                                   {/* Pagrindinė Informacija */}
                                   <div className="col-span-2">
                                       <label className="block text-sm font-medium text-slate-700 mb-1">
                                           Pavadinimas <span className="text-red-500">*</span>
                                       </label>
                                       <input
                                           type="text"
                                           name="name"
                                           value={formData.name}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           required
                                           disabled={editingCompany?.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin'} 
                                       />
                                   </div>

                                   {/* Kodai */}
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Įmonės kodas</label>
                                       <input
                                           type="text"
                                           name="company_code"
                                           value={formData.company_code || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           disabled={editingCompany?.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin'}
                                       />
                                   </div>

                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">PVM kodas</label>
                                       <input
                                           type="text"
                                           name="vat_code"
                                           value={formData.vat_code || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           disabled={editingCompany?.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin'}
                                       />
                                   </div>

                                   {/* Adresai */}
                                   <div className="col-span-2">
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Registracijos adresas</label>
                                       <input
                                           type="text"
                                           name="legal_address"
                                           value={formData.legal_address || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Korespondencijos adresas</label>
                                       <input
                                           type="text"
                                           name="correspondence_address"
                                           value={formData.correspondence_address || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>
                                   <div className="col-span-2">
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Šalis</label>
                                       <input
                                           type="text"
                                           name="country"
                                           value={formData.country}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>

                                   {/* Kontaktinė Informacija */}
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktinis asmuo</label>
                                       <input
                                           type="text"
                                           name="contact_person"
                                           value={formData.contact_person || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktinis el. paštas</label>
                                       <input
                                           type="email"
                                           name="contact_email"
                                           value={formData.contact_email || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Telefonas</label>
                                       <input
                                           type="text"
                                           name="contact_phone"
                                           value={formData.contact_phone || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                       />
                                   </div>
                                   
                                   {/* VAMNELĖS (Klientų Tipai) */}
                                   <div className="col-span-2 mt-4 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                       <h3 className="font-semibold text-sm text-slate-700 mb-2">Įmonės Tipai sistemoje</h3>
                                       
                                       <div className="flex items-center gap-4">
                                           <input 
                                                type="checkbox" 
                                                id="is_supplier" 
                                                name="is_supplier" 
                                                checked={formData.is_supplier} 
                                                onChange={handleChange} 
                                                className="w-4 h-4 text-green-600 rounded" 
                                            />
                                           <label htmlFor="is_supplier" className="text-sm text-slate-600">Tiekėjas (Jie išrašo mums sąskaitas)</label>
                                       </div>
                                       <div className="flex items-center gap-4">
                                           <input 
                                                type="checkbox" 
                                                id="is_buyer" 
                                                name="is_buyer" 
                                                checked={formData.is_buyer} 
                                                onChange={handleChange} 
                                                className="w-4 h-4 text-blue-600 rounded" 
                                            />
                                           <label htmlFor="is_buyer" className="text-sm text-slate-600">Pirkėjas (Mes išrašome jiems sąskaitas)</label>
                                       </div>
                                       
                                       {/* VAMNELĖ "Sistemos Naudotojas" rodoma ir keičiama tik Super Adminui */}
                                       {userRole === 'Super Admin' && (
                                           <div className="flex items-center gap-4">
                                               <input 
                                                    type="checkbox" 
                                                    id="is_tenant" 
                                                    name="is_tenant" 
                                                    checked={formData.is_tenant} 
                                                    onChange={handleChange} 
                                                    className="w-4 h-4 text-indigo-600 rounded" 
                                                />
                                               <label htmlFor="is_tenant" className="text-sm font-semibold text-indigo-700">Sistemos Naudotojas (Leidžia prisijungiančius vartotojus)</label>
                                           </div>
                                       )}
                                   </div>
                                   
                                   {/* Pastabos */}
                                   <div className="col-span-2 mt-4">
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Pastabos</label>
                                       <textarea
                                           name="notes"
                                           value={formData.notes || ''}
                                           onChange={handleChange}
                                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           rows={3}
                                       />
                                   </div>
                               </div>

                               <div className="col-span-2 flex justify-end mt-6">
                                   <button
                                       type="button"
                                       onClick={handleCloseModal}
                                       className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 mr-3"
                                   >
                                       Atšaukti
                                   </button>
                                   <button
                                       type="submit"
                                       disabled={editingCompany?.id === COMPANY_ID_MY_IV && userRole !== 'Super Admin'}
                                       className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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