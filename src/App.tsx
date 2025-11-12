import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
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
import { Session } from '@supabase/supabase-js'; // Reikalingas sesijos tipui

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
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Pakeista į false, kad veiktų login'o logika
    const [isLoading, setIsLoading] = useState(true); // Pakeista į true, kad tikrintų sesiją
    const [session, setSession] = useState<Session | null>(null); // Pridėtas sesijos būsena
    
    // === Vartotojo Būsena ===
    const [userEmail, setUserEmail] = useState(''); // Pradinė tuščia
    const [userRole, setUserRole] = useState(''); // Pradinė tuščia
    const [userCompanyId, setUserCompanyId] = useState<string | null>(null); // Pradinė null
    // =========================

    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(''); // Nustatomas useEffect
        
    // Stats (Palikta imitacija, bet galėtų būti gaunama iš API)
    const [stats] = useState<Stats>({
        needsReview: 5,
        todayUploaded: 8,
        todayValidated: 12,
        todayExported: 15,
        todayCorrections: 23
    });
    // Būsena, skirta vartotojų filtravimui
    const [userFilterCompany, setUserFilterCompany] = useState<string | undefined>(undefined); 
    
    // ----------------------------------------------------
    // *** AUTENTIFIKACIJOS FUNKCIJOS ***
    // ----------------------------------------------------

    const loadUserProfile = async (userId: string) => {
        setIsLoading(true);
        // Paimame vartotojo profilio duomenis
        const { data, error } = await supabase
            .from('user_profiles')
            .select('email, role, company_id') // Pataisykite stulpelių pavadinimus pagal savo Supabase schemą
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error loading user profile:", error);
            setIsAuthenticated(false);
        } else if (data) {
            setUserEmail(data.email);
            setUserRole(data.role);
            setUserCompanyId(data.company_id);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    };

    const handleLogin = (session: Session) => {
        setSession(session);
        if (session.user) {
            loadUserProfile(session.user.id);
        }
    };
    
    const handleLogout = async () => { 
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        setSession(null);
        setIsAuthenticated(false);
        setUserEmail('');
        setUserRole('');
        setUserCompanyId(null);
        window.location.reload(); // Tik papildomai peržiūrai
    };

    // Sesijos tikrinimas ir stebėjimas
    useEffect(() => {
        // 1. Pirminis sesijos patikrinimas
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        });

        // 2. Sesijos pokyčių stebėjimas
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                // Jei vartotojas prisijungė
                loadUserProfile(session.user.id);
            } else {
                // Jei vartotojas atsijungė
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        });

        // 3. Dabartinės datos nustatymas (TS6133 klaidai pašalinti)
        setCurrentDate(new Date().toLocaleDateString('lt-LT', { year: 'numeric', month: 'long', day: 'numeric' }));

        return () => subscription.unsubscribe();
    }, []);

    // ----------------------------------------------------
    // *** PAGALBINĖS FUNKCIJOS ***
    // ----------------------------------------------------
    
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
    
    // ----------------------------------------------------
    // *** VAIZDO RENDERINIMAS ***
    // ----------------------------------------------------

    const renderMainView = () => {
        
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
                    userCompanyId={userCompanyId}
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
                    </div>
                );
        }
    };
    
    // Vartotojo patikros blokai (naudojama isAuthenticated, isLoading, Login)
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <p className="text-xl text-slate-500">Kraunama...</p> 
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLogin} />;
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
                    stats={stats}
                />

                <main className="flex-1 overflow-y-auto">
                    {renderMainView()}
                </main>
            </div>

            {/* Čia būtų modalo logika (reikėtų įtraukti <UploadDocument /> modalo komponentą) */}
        </div>
    );
}

export default App;
