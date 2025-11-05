import React from 'react';

interface Stats {
  needsReview: number;
  todayUploaded: number;
  todayValidated: number;
  todayExported: number;
  todayCorrections: number;
}

type View = 'dashboard' | 'purchase-invoices' | 'sales-invoices' | 'companies' | 'purchases' | 'product-tree' | 'export' | 'reports' | 'users' | 'uploaded-documents' | 'upload-document';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  stats: Stats;
  userEmail: string;
  userRole: string;
  onLogout: () => void;
}

function Sidebar({ currentView, setCurrentView, stats, userEmail, userRole, onLogout }: SidebarProps) {
  const [isPurchasesOpen, setIsPurchasesOpen] = React.useState(false);

  const [isDocumentsOpen, setIsDocumentsOpen] = React.useState(false);

  React.useEffect(() => {
    if (currentView === 'purchases' || currentView === 'product-tree') {
      setIsPurchasesOpen(true);
    }
    if (currentView === 'uploaded-documents' || currentView === 'upload-document') {
      setIsDocumentsOpen(true);
    }
  }, [currentView]);

  return (
    <nav className="w-64 sidebar flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <span className="text-xl font-semibold text-slate-800 block leading-none">AIPLENK</span>
            <span className="text-xs text-slate-500">v1.0.0</span>
          </div>
        </div>
      </div>

      <ul className="flex-grow px-3 space-y-1">
        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'dashboard' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-home w-5 mr-3 text-base"></i>
            <span>Darbalaukis</span>
          </a>
        </li>

        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atpažinimas</span>
        </li>

        <li>
          <button
            onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
            className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              (currentView === 'uploaded-documents' || currentView === 'upload-document') ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-cloud-upload-alt w-5 mr-3 text-base"></i>
            <span className="flex-1 text-left">Įkelti dokumentai</span>
            <i className={`fas fa-chevron-down text-xs transition-transform ${
              isDocumentsOpen ? 'rotate-180' : ''
            }`}></i>
          </button>
          {isDocumentsOpen && (
            <ul className="mt-1 ml-4 space-y-1">
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); setCurrentView('uploaded-documents'); }}
                  href="#"
                  className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${
                    currentView === 'uploaded-documents' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
                  }`}
                >
                  <span>Sąrašas</span>
                </a>
              </li>
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); setCurrentView('upload-document'); }}
                  href="#"
                  className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${
                    currentView === 'upload-document' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
                  }`}
                >
                  <span>Įkelti naują</span>
                </a>
              </li>
            </ul>
          )}
        </li>

        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dokumentai</span>
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('purchase-invoices'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'purchase-invoices' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-file-invoice w-5 mr-3 text-base"></i>
            <span>Pirkimo Sąskaitos</span>
            {stats.needsReview > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.needsReview}
              </span>
            )}
          </a>
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('sales-invoices'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'sales-invoices' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-receipt w-5 mr-3 text-base"></i>
            <span>Pardavimo Sąskaitos</span>
          </a>
        </li>

        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sistema</span>
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('companies'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'companies' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-building w-5 mr-3 text-base"></i>
            <span>Įmonės</span>
          </a>
        </li>

        <li>
          <button
            onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
            className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              (currentView === 'purchases' || currentView === 'product-tree') ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-shopping-cart w-5 mr-3 text-base"></i>
            <span className="flex-1 text-left">Pirkimai</span>
            <i className={`fas fa-chevron-down text-xs transition-transform ${
              isPurchasesOpen ? 'rotate-180' : ''
            }`}></i>
          </button>
          {isPurchasesOpen && (
            <ul className="mt-1 ml-4 space-y-1">
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); setCurrentView('purchases'); }}
                  href="#"
                  className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${
                    currentView === 'purchases' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
                  }`}
                >
                  <span>Prekės</span>
                </a>
              </li>
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); setCurrentView('product-tree'); }}
                  href="#"
                  className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${
                    currentView === 'product-tree' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
                  }`}
                >
                  <span>Prekių medis</span>
                </a>
              </li>
            </ul>
          )}
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('export'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'export' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-file-export w-5 mr-3 text-base"></i>
            <span>Eksportai</span>
          </a>
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('reports'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'reports' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-chart-bar w-5 mr-3 text-base"></i>
            <span>Ataskaitos</span>
          </a>
        </li>

        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('users'); }}
            href="#"
            className={`nav-link flex items-center px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${
              currentView === 'users' ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''
            }`}
          >
            <i className="fas fa-users w-5 mr-3 text-base"></i>
            <span>Vartotojai</span>
          </a>
        </li>
      </ul>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700 truncate">{userEmail}</div>
            <div className="text-xs text-slate-500">{userRole === 'admin' ? 'Administratorius' : 'Vartotojas'}</div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Atsijungti"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
