import React from 'react';
// Importuojame 'View' tipą tiesiai iš App.tsx
import type { View } from '../App';

interface Stats {
  needsReview: number;
}

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  stats: Stats;
}

function Sidebar({ currentView, setCurrentView, stats }: SidebarProps) {
  
  const [openMenus, setOpenMenus] = React.useState({
      atpazinimas: false,
      pirkimai: false,
      pardavimai: false,
      nustatymai: false,
  });

  React.useEffect(() => {
    const activeSection = {
        atpazinimas: currentView === 'unprocessed-invoices' || currentView === 'upload-document',
        pirkimai: currentView === 'purchase-invoices' || currentView === 'purchase-items' || currentView === 'product-tree',
        pardavimai: currentView === 'sales-invoices' || currentView === 'sales-items' || (currentView as string).includes('product-tree'),
        // Nustatymų meniu turėtų būti atidarytas, jei esame bet kuriame nustatymų vaizde
        nustatymai: currentView === 'settings-company' || currentView === 'settings-users' || currentView === 'settings-clients' || currentView === 'users' || currentView === 'settings-profile',
    };
    setOpenMenus(activeSection);
  }, [currentView]);
  
  const toggleMenu = (menuKey: keyof typeof openMenus) => {
    setOpenMenus(prev => {
        const newState = Object.fromEntries(
            Object.keys(prev).map(key => [key, false])
        ) as typeof openMenus;
        return {
            ...newState,
            [menuKey]: !prev[menuKey]
        };
    });
  };
  
  const isActive = (viewName: View) => currentView === viewName;
    
    // Naudojame šią papildomą funkciją, kad "Įmonės" meniu neliktų aktyvus, jei esame spec. sąrašuose
    const isCompaniesActive = () => {
        // 'companies' raktas aktyvus tik tada, kai esame tame vaizde
        if (currentView === 'companies') return true;
        
        // Jei esame kitoje SĄRAŠINĖJE puslapio versijoje, jis nėra aktyvus
        if (currentView === 'settings-clients' || currentView === 'users' || currentView === 'settings-users') {
             return false;
        }
        return false;
    }


  return (
    <nav className="w-64 sidebar flex flex-col bg-white border-r border-slate-200">
      
      <ul className="flex-grow px-3 space-y-1 overflow-y-auto pt-6">
        
        {/* 1. DARBALAUKIS */}
        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}
            href="#"
            className={`nav-link ${isActive('dashboard') ? 'active bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} flex items-center px-4 py-3 rounded-lg`}
          >
            <i className="fas fa-home w-5 mr-3 text-base"></i>
            <span>Darbalaukis</span>
          </a>
        </li>

        {/* 2. ATPAŽINIMAS (GAVIMAS) */}
        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atpažinimas</span>
        </li>
        
        <li>
            <button
                onClick={() => toggleMenu('atpazinimas')}
                className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${openMenus.atpazinimas ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
            >
                <i className="fas fa-cloud-upload-alt w-5 mr-3 text-base"></i>
                <span className="flex-1 text-left">Įkelti dokumentai</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${openMenus.atpazinimas ? 'rotate-180' : ''}`}></i>
            </button>
            {openMenus.atpazinimas && (
                <ul className="mt-1 ml-4 space-y-1">
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('unprocessed-invoices'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('unprocessed-invoices') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Sąskaitos</span>
                            {stats.needsReview > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {stats.needsReview}
                                </span>
                            )}
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('upload-document'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('upload-document') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Įkelti dokumentus</span>
                        </a>
                    </li>
                </ul>
            )}
        </li>

        {/* 3. DOKUMENTAI */}
        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dokumentai</span>
        </li>

        {/* 3A. PIRKIMAI */}
        <li>
            <button
                onClick={() => toggleMenu('pirkimai')}
                className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${openMenus.pirkimai ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
            >
                <i className="fas fa-shopping-cart w-5 mr-3 text-base"></i>
                <span className="flex-1 text-left">Pirkimai</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${openMenus.pirkimai ? 'rotate-180' : ''}`}></i>
            </button>
            {openMenus.pirkimai && (
                <ul className="mt-1 ml-4 space-y-1">
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('purchase-invoices'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('purchase-invoices') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Pirkimo sąskaitos</span>
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('purchase-items'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('purchase-items') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Perkamos prekės</span>
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('product-tree'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('product-tree') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Prekių medis</span>
                        </a>
                    </li>
                </ul>
            )}
        </li>
        
        {/* 3B. PARDAVIMAI */}
        <li>
            <button
                onClick={() => toggleMenu('pardavimai')}
                className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${openMenus.pardavimai ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
            >
                <i className="fas fa-receipt w-5 mr-3 text-base"></i>
                <span className="flex-1 text-left">Pardavimai</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${openMenus.pardavimai ? 'rotate-180' : ''}`}></i>
            </button>
            {openMenus.pardavimai && (
                <ul className="mt-1 ml-4 space-y-1">
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('sales-invoices'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('sales-invoices') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Pardavimo sąskaitos</span>
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('sales-items'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('sales-items') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Parduodamos prekės</span>
                        </a>
                    </li>
                    <li>
                         <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('product-tree'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('product-tree') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Prekių medis</span>
                        </a>
                    </li>
                </ul>
            )}
        </li>

        {/* 4. SISTEMA */}
        <li className="pt-4 pb-2 px-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sistema</span>
        </li>
        
        <li>
          <a
            onClick={(e) => { e.preventDefault(); setCurrentView('companies'); }}
            href="#"
            // PATAISYTA: Dabar "Įmonės" aktyvios TIK, kai currentView yra TIK 'companies'
            className={`nav-link ${isCompaniesActive() ? 'active bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} flex items-center px-4 py-3 rounded-lg`}
          >
            <i className="fas fa-building w-5 mr-3 text-base"></i>
            <span>Įmonės</span>
          </a>
        </li>
        
        <li>
            <a
                onClick={(e) => { e.preventDefault(); setCurrentView('export'); }}
                href="#"
                className={`nav-link ${isActive('export') ? 'active bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} flex items-center px-4 py-3 rounded-lg`}
            >
                <i className="fas fa-file-export w-5 mr-3 text-base"></i>
                <span>Eksportai</span>
            </a>
        </li>

        <li>
            <a
                onClick={(e) => { e.preventDefault(); setCurrentView('reports'); }}
                href="#"
                className={`nav-link ${isActive('reports') ? 'active bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} flex items-center px-4 py-3 rounded-lg`}
            >
                <i className="fas fa-chart-bar w-5 mr-3 text-base"></i>
                <span>Ataskaitos</span>
            </a>
        </li>

        {/* 5. NUSTATYMAI */}
        <li>
            <button
                onClick={() => toggleMenu('nustatymai')}
                className={`nav-link flex items-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg ${openMenus.nustatymai ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
            >
                <i className="fas fa-cogs w-5 mr-3 text-base"></i>
                <span className="flex-1 text-left">Nustatymai</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${openMenus.nustatymai ? 'rotate-180' : ''}`}></i>
            </button>
            {openMenus.nustatymai && (
                <ul className="mt-1 ml-4 space-y-1">
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('settings-company'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('settings-company') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Įmonės Informacija</span>
                        </a>
                    </li>
                    <li>
                        <a
                            // NURODYMAS: Vartotojų sąrašas per pagrindinį meniu
                            onClick={(e) => { e.preventDefault(); setCurrentView('users'); }}
                            href="#"
                            // PATAISYTA: Tikriname, ar vaizdas yra 'users' ARBA senas raktas 'settings-users'
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('users') || isActive('settings-users') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Vartotojai</span>
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={(e) => { e.preventDefault(); setCurrentView('settings-clients'); }}
                            href="#"
                            className={`nav-link flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm ${isActive('settings-clients') ? 'active bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                        >
                            <span>Sistemos naudotojai</span>
                        </a>
                    </li>
                </ul>
            )}
        </li>

      </ul>

      <div className="p-4 mt-auto border-t border-slate-200">
        <span className="text-xs text-slate-400 block text-center">v1.0.0</span>
      </div>
      
    </nav>
  );
}

export default Sidebar;