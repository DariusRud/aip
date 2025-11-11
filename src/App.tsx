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
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    // === PRISIJUNGUSIO VARTOTOJO IMITACIJA ===
    // Kad patikrintumėte Buhalterį Demo, atkomentuokite šias eilutes ir užkomentuokite Super Admin eilutes žemiau:
    // const [userEmail, setUserEmail] = useState('jonas@demo.lt'); // Buhalterio el. paštas
    // const [userRole, setUserRole] = useState('Admin'); // Buhalterio rolė
    // const userCompanyId = 'CLIENT-2'; // Buhalterio įmonės ID (Buhalteris Demo)

    // DABARTINĖ SUPER ADMIN BŪSENA:
    const [userEmail, setUserEmail] = useState('analitikas@lokalus.lt');
    const [userRole, setUserRole] = useState('Super Admin');
    const userCompanyId = 'IV-1'; // Sistemos savininko ID (Dariaus Rudvalio IV)
    // =======================================

    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [stats] = useState<Stats>({
        needsReview: 5,
        todayUploaded: 8,
        todayValidated: 12,
        todayExported: 15,
        todayCorrections: 23
    });
    // Būsena, skirta vartotojų filtravimui
    const [userFilterCompany, setUserFilterCompany] = useState<string | undefined>(undefined); 

    // PATAISYTA: Sukuriame atskirą handleClearFilter funkciją, kad ją perduotume tiesiai
    const handleClearUserFilter = () => {
        setUserFilterCompany(undefined);
    };
    
    // PATAISYTA: Vientisa funkcija, nukreipianti į vartotojų sąrašą su filtru (naudojama iš Companies.tsx)
    const handleViewUsers = (companyName: string) => {
        setUserFilterCompany(companyName);
        setCurrentView('users'); 
    };
    
    // PATAISYTA LOGIKA: dabar aiškiai nustatomas naujas vaizdas ir išvalomas filtras tik tada, kai reikia.
    const handleSetCurrentView = (view: View) => {
        
        // Išvalome filtrą, jei perjungiam į Vartotojų sąrašą (be įmonės filtro)
        if (view === 'users' || view === 'settings-users') {
             setUserFilterCompany(undefined); 
        } else {
            // Jei perjungiam į BET KURĮ kitą vaizdą, pilnai išvalom vartotojo filtrą
            setUserFilterCompany(undefined);
        }
        // Visada išsaugome naują vaizdą, net jei jis sutampa (užtikrinam re-render)
        setCurrentView(view);
    }
    
    // ... (praleista useEffect, loadUserProfile, handleLogout ir pan. dalys)

    const renderMainView = () => {
        
        switch (currentView) {
            case 'dashboard':
                return <Dashboard
                    currentDate={currentDate} 
                    stats={stats}
                    setShowUploadModal={setShowUploadModal}
                    setCurrentView={handleSetCurrentView} 
                />;
            
            // DOKUMENTAI: PRIDĖTAS userCompanyId
            case 'unprocessed-invoices': 
            case 'purchase-invoices':
                return <PurchaseInvoices 
                    userRole={userRole} 
                    userCompanyId={userCompanyId}
                />; 
            
            // DOKUMENTAI: PRIDĖTAS userCompanyId
            case 'upload-document':
                return <UploadDocument 
                    onUploadSuccess={() => handleSetCurrentView('unprocessed-invoices')}
                    userCompanyId={userCompanyId}
                />;
            
            // DOKUMENTAI: PRIDĖTAS userCompanyId
            case 'uploaded-documents':
                return <UploadedDocuments 
                    userCompanyId={userCompanyId}
                />;
            
            // PREKĖS: PRIDĖTAS userCompanyId
            case 'purchase-items':
                return <Purchases 
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                />;
            
            // PREKĖS: PRIDĖTAS userCompanyId
            case 'product-tree':
                return <ProductTree 
                    userRole={userRole}
                    userCompanyId={userCompanyId}
                />;

            // SISTEMA (COMPANIES)
            case 'companies':
                return <Companies 
                    userRole={userRole} 
                    userCompanyId={userCompanyId} 
                    viewType="all" 
                    onViewUsers={handleViewUsers} 
                />;
            
            // NUSTATYMAI
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
                    setCurrentView={handleSetCurrentView} // <== TRŪKSTAMAS PROP'sas PRIDĖTAS
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
    
    // ... (praleista if blokai, bet originaliame kode jie būtų čia)

    const handleLogin = () => { /* ... */ };
    const handleLogout = async () => { window.location.reload(); };


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

            {/* Čia būtų modalo logika */}
        </div>
    );
}

export default App;
