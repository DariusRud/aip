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

// Importuojame naujus komponentus
import Header from './components/Header'; // NAUJAS HEADER
import SettingsUsers from './components/SettingsUsers'; 
import SettingsCompany from './components/SettingsCompany'; 

interface Stats {
  needsReview: number;
  todayUploaded: number;
  todayValidated: number;
  todayExported: number;
  todayCorrections: number;
}

// ATNAUJINTAS VIEW TIPAS
type View = 'dashboard' | 'upload-document' | 'unprocessed-invoices' | 'purchase-invoices' | 'sales-invoices' | 'purchase-items' | 'sales-items' | 'product-tree' | 'companies' | 'export' | 'reports' | 'settings-company' | 'settings-users' | 'settings-clients';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false); // Šis modalas greičiausiai bus iškeltas
  const [currentDate, setCurrentDate] = useState('');
  const [stats] = useState<Stats>({
    needsReview: 5, // Paimama iš DB
    // ... kiti stats
    todayUploaded: 8,
    todayValidated: 12,
    todayExported: 15,
    todayCorrections: 23
  });

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        loadUserProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
        setUserRole('');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAuthenticated(true);
      setUserEmail(session.user.email || '');
      await loadUserProfile(session.user.id);
    }
    setIsLoading(false);
  };

  const loadUserProfile = async (userId: string) => {
    // Ateityje čia sujungsime user_profiles ir roles
    const { data, error } = await supabase
      .from('user_profiles') // Naudojame naują user_profiles lentelę
      .select('*, roles(name)') // Pasiimame rolės pavadinimą
      .eq('user_id', userId)
      .maybeSingle();

    if (data && !error) {
      // @ts-ignore
      setUserRole(data.roles?.name || 'User'); // Nustatome rolę
    } else {
      setUserRole('User'); // Numatome, jei profilio nėra
    }
  };

  const handleLogin = () => {
    checkAuth();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setUserRole('');
    setCurrentView('dashboard');
  };

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('lt-LT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateDate();
  }, []);

  // Funkcija, kuri atvaizduoja pasirinktą puslapį
  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          stats={stats}
          setShowUploadModal={setShowUploadModal}
          setCurrentView={setCurrentView}
        />;
      
      // NAUJI PUSLAPIAI
      case 'unprocessed-invoices': // Karantinas
        return <PurchaseInvoices userRole={userRole} />; // Kol kas naudojame seną
      case 'upload-document':
        return <UploadDocument onUploadSuccess={() => setCurrentView('unprocessed-invoices')} />;
      case 'purchase-invoices':
        return <PurchaseInvoices userRole={userRole} />; // Ateityje bus Archyvas
      
      case 'purchase-items':
        return <Purchases userRole={userRole} />;
      case 'product-tree':
        return <ProductTree userRole={userRole} />;
      case 'companies':
        return <Companies userRole={userRole} />;
      
      // NUSTATYMAI
      case 'settings-users':
        return <SettingsUsers currentUserRole={userRole} />; 
      case 'settings-company':
        return <SettingsCompany userRole={userRole} />;
      
      // SENAS 'users' (nebenaudojamas)
      case 'users':
        return <SettingsUsers currentUserRole={userRole} />;

      // Visi kiti neatvaizduoti puslapiai
      default:
        return (
          <div className="max-w-7xl mx-auto p-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <p className="text-slate-600">Puslapis ruošiamas...</p>
              <p className="text-sm text-slate-400 mt-2">Pasirinktas vaizdas: {currentView}</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600">Kraunama...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      
      {/* 1. VIRŠUTINĖ JUOSTA (HEADER) - PERDUODAME VARTOTOJO DUOMENIS */}
      <Header 
        currentDate={currentDate}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. KAIRYSIS MENIU (SIDEBAR) - PAŠALINAME VARTOTOJO DUOMENIS */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          stats={stats}
        />

        {/* 3. PAGRINDINIS TURINYS (MAIN CONTENT) */}
        <main className="flex-1 overflow-y-auto">
          {renderMainView()}
        </main>
      </div>

      {/* MODALAS (lieka toks pats) */}
      {showUploadModal && (
         <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-semibold text-slate-800 mb-4">Įkelti Sąskaitą</h3>
            <p className="text-slate-600 mb-6">Funkcionalumas bus pridėtas vėliau...</p>
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Uždaryti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;