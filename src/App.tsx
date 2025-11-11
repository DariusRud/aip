import { useState, useEffect } from 'react'; // PATAISYTA: useEffect grąžintas
import { supabase } from './lib/supabase'; // PATAISYTA: Grąžintas
import Login from './components/Login'; // PATAISYTA: Grąžintas
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Purchases from './components/Purchases';
import ProductTree from './components/ProductTree';
import Companies from './components/Companies';
import PurchaseInvoices from './components/PurchaseInvoices';
import UploadedDocuments from './components/UploadedDocuments';
import UploadDocument from './components/UploadDocument';

import Header from './components/Header';
import SettingsUsers from './components/SettingsUsers'; 
import SettingsCompany from './components/SettingsCompany'; 
import SettingsProfile from './components/SettingsProfile'; 
// import { Session } from '@supabase/supabase-js'; // Nebūtinai reikalinga, jei nenaudojam tipo

interface Stats {
    needsReview: number;
    todayUploaded: number;
    todayValidated: number;
    todayExported: number;
    todayCorrections: number;
}

export type View = 'dashboard' | 'upload-document' | 'unprocessed-invoices' | 
                    'purchase-invoices' | 'sales-invoices' | 'purchase-items' | 
                    'sales-items' | 'product-tree' | 'companies' | 'export' | 
                    'reports' | 'settings-company' | 'settings-users' | 
                    'settings-clients' | 'users' | 'uploaded-documents' |
                    'settings-profile'; 

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // PATAISYTA: Pradžioje false
    const [isLoading, setIsLoading] = useState(true); // PATAISYTA: Pradžioje true, kol tikrinam
    
    // === PANAUDOJAME SUPABASE AUTENTIFIKACIJĄ ===
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
    // ============================================

    // Funkcija vartotojo duomenims gauti (bus kviečiama kelis kartus)
    const checkUser = async () => {
        setIsLoading(true);
        
        // 1. Gauname Supabase sesiją
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Session error:", sessionError.message);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
        }

        if (session && session.user) {
            // 2. Jei yra sesija, gauname vartotojo profilį (su role ir company_id)
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role, company_id')
                .eq('id', session.user.id)
                .single();
            
            if (profileError) {
                console.error("Profile fetch error:", profileError.message);
                // Vartotojas prisijungęs, bet profilio nėra - kritinė klaida
                await supabase.auth.signOut(); // Saugumo sumetimais atjungiame
                setIsAuthenticated(false);
            } else if (profile) {
                // Sėkmingai radom vartotoją ir profilį
                setUserEmail(session.user.email || null);
                setUserRole(profile.role);
                setUserCompanyId(profile.company_id);
                setIsAuthenticated(true);
            } else {
                console.warn("User session exists but no profile found.");
                setIsAuthenticated(false);
            }
        } else {
            // Nėra sesijos
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    };

    // PATAISYTA: useEffect tikrina vartotojo būseną
    useEffect(() => {
        checkUser(); // Patikrinam iškart užkrovus

        // Taip pat klausomės pasikeitimų (pvz., atsijungus)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                setUserEmail(null);
                setUserRole(null);
                setUserCompanyId(null);
            } else if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
                // Persikrauname vartotojo duomenis, kai jis prisijungia
                checkUser(); 
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);


    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [_showUploadModal, setShowUploadModal] = useState(false); // PATAISYTA: Pridėtas _
    const [currentDate, _setCurrentDate] = useState(''); // PATAISYTA: Pridėtas _
    const [stats] = useState<Stats>({
        needsReview: 5,
        todayUploaded: 8,
        todayValidated: 12,
        todayExported: 15,
        todayCorrections: 23
    });
    const [userFilterCompany, setUserFilterCompany] = useState<string | undefined>(undefined); 

    const handleClearUserFilter = () => {
        setUserFilterCompany(undefined);
    };
    
    const handleViewUsers = (companyName: string) => {
        setUserFilterCompany(companyName);
        setCurrentView('users'); 
    };
    
    const handleSetCurrentView = (view: View) => {
        if (view === 'users' || view === 'settings-users') {
              setUserFilterCompany(undefined); 
        } else {
            setUserFilterCompany(undefined);
        }
        setCurrentView(view);
    }
    
    const renderMainView = () => {
        // Svarbu: užtikrinam, kad turim reikiamus duomenis
        if (!userRole || !userCompanyId) {
            // Dar kraunasi arba profilis nepilnas
            return <div className="p-8">Kraunami vartotojo duomenys...</div>;
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard
                    currentDate={currentDate} 
                    stats={stats}
                    setShowUploadModal={setShowUploadModal}
                    setCurrentView={handleSetCurrentView} 
                />;
            
            case 'unprocessed-invoices': 
            case 'purchase-invoices':
                return <PurchaseInvoices 
                    userRole={userRole} 
                    userCompanyId={userCompanyId}
                />; 
            
            case 'upload-document':
                return <UploadDocument 
                    onUploadSuccess={() => handleSetCurrentView('unprocessed-invoices')}
           _        userCompanyId={userCompanyId}
                />;
            
            case 'uploaded-documents':
                return <UploadedDocuments 
                    userCompanyId={userCompanyId}
                />;
            
            case 'purchase-items':
                return <Purchases 
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                />;
            
            case 'product-tree':
                return <ProductTree 
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                />;

            case 'companies':
                return <Companies 
                    userRole={userRole} 
                    userCompanyId={userCompanyId} 
                    viewType="all" 
                    onViewUsers={handleViewUsers} 
                />;
            
            case 'settings-users':
            case 'users':
                return <SettingsUsers 
                    currentUserRole={userRole} 
                    userCompanyId={userCompanyId}
                    filterCompany={userFilterCompany} 
                    onClearFilter={handleClearUserFilter} 
                />; 

            case 'settings-company':
                return <SettingsCompany 
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                    setCurrentView={handleSetCurrentView}
                />;

            case 'settings-clients':
                return <Companies 
                    userRole={userRole} 
                    userCompanyId={userCompanyId} 
                    viewType="tenants" 
                    onViewUsers={handleViewUsers} 
            />; 
                 
            case 'settings-profile':
                return <SettingsProfile />;

            default:
                return (
                    <div className="max-w-7xl mx-auto p-8">
                        <div className="bg-white rounded-xl shadow-sm border-slate-200 p-8">
                            <p className="text-slate-600">Puslapis ruošiamas...</p>
                            <p className="text-sm text-slate-400 mt-2">Pasirinktas vaizdas: {currentView}</p>
                        </div>
       _           </div>
                );
        }
    };
    
    const handleLogout = async () => { 
        setIsLoading(true);
        await supabase.auth.signOut();
        // Visi state atsinaujins automatiškai per onAuthStateChange listener'į
    };

    // PATAISYTA: Rodyti krovimo būseną
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-100">
                <p>Kraunama...</p> 
            </div>
        );
    }

    // PATAISYTA: Rodyti prisijungimo langą
    if (!isAuthenticated) {
        // Kai Login komponentas sėkmingai prijungs vartotoją,
        // onAuthStateChange "pagaus" tai ir automatiškai
   F    // atnaujins būseną bei perkraus šį komponentą.
        return <Login />; 
    }

    // PATAISYTA: Rodyti pagrindinę aplikaciją, tik jei userRole ir userEmail egzistuoja
    if (!userEmail || !userRole) {
        return <div className="p-8">Klaida: Nepavyko gauti vartotojo duomenų. Įsitikinkite, kad jūsų 'user_profiles' lentelė turi įrašą šiam vartotojui.</div>
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
            
            <Header 
                    currentDate={new Date().toLocaleDateString('lt-LT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    userEmail={userEmail}
                    userRole={userRole}
                    onLogout={handleLogout}
                    setCurrentView={handleSetCurrentView} 
            />

            <div className="flex flex-1 overflow-hidden">
                
                <Sidebar
                    currentView={currentView}
                    setCurrentView={handleSetCurrentView} 
   Data          stats={stats}
                />

                <main className="flex-1 overflow-y-auto">
                    {renderMainView()}
                </main>
            </div>

            {/* Čia būtų modalo logika */}
    </div>
    );
}

export default App;