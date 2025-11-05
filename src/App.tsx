import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Users from './components/Users';

interface Stats {
  needsReview: number;
  todayUploaded: number;
  todayValidated: number;
  todayExported: number;
  todayCorrections: number;
}

type View = 'dashboard' | 'purchase-invoices' | 'sales-invoices' | 'companies' | 'products' | 'export' | 'reports' | 'users';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
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
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setUserRole(data.role);
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
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex h-screen">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        stats={stats}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && (
          <Dashboard
            currentDate={currentDate}
            stats={stats}
            setShowUploadModal={setShowUploadModal}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'users' && (
          <Users currentUserRole={userRole} />
        )}

        {currentView !== 'dashboard' && currentView !== 'users' && (
          <div className="max-w-7xl mx-auto p-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                {currentView === 'purchase-invoices' && 'Pirkimo Sąskaitos'}
                {currentView === 'sales-invoices' && 'Pardavimo Sąskaitos'}
                {currentView === 'companies' && 'Įmonės'}
                {currentView === 'products' && 'Prekių Medis'}
                {currentView === 'export' && 'Eksportai'}
                {currentView === 'reports' && 'Ataskaitos'}
              </h2>
              <p className="text-slate-600">Funkcionalumas bus pridėtas vėliau...</p>
            </div>
          </div>
        )}
      </main>

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
