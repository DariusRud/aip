import React, { useState, useEffect, useRef } from 'react';

// Tipas paimtas iš App.tsx (svarbu, kad sutaptų)
// PATAISYTA: Įtrauktas 'settings-profile' į View tipą, jei jo trūko (jūsų App.tsx jį turi)
type View = 'dashboard' | 'upload-document' | 'unprocessed-invoices' | 'purchase-invoices' | 'sales-invoices' | 'purchase-items' | 'sales-items' | 'product-tree' | 'companies' | 'export' | 'reports' | 'settings-company' | 'settings-users' | 'settings-clients' | 'users' | 'settings-profile'; 

interface HeaderProps {
  currentDate: string;
  userEmail: string;
  userRole: string;
  onLogout: () => void;
  setCurrentView: (view: View) => void; // Dabar naudojame šį prop'są!
}

// Išskleidžiame setCurrentView iš props
const Header: React.FC<HeaderProps> = ({ currentDate, userEmail, userRole, onLogout, setCurrentView }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const getFriendlyRoleName = (role: string) => {
    if (role === 'admin' || role === 'Admin') return 'Administratorius';
    if (role === 'Super Admin') return 'Super Administratorius';
    return 'Vartotojas';
  };
  
  return (
    <header className="relative bg-white border-b border-slate-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between h-10">
          
          {/* 1. Kairė pusė: Logotipas */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <span className="text-xl font-semibold text-slate-800 block leading-none">AIPLENK</span>
            </div>
          </div>

          {/* 2. Vidurinė dalis: Data */}
          <div className="flex-1 text-center">
            <span className="text-sm text-slate-500 hidden md:block">{currentDate}</span>
          </div>

          {/* 3. Dešinė pusė: Vartotojo Dropdown */}
          <div className="flex items-center space-x-4">
            
            <button className="text-slate-500 hover:text-slate-700 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition relative">
              <i className="fas fa-bell"></i>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">3</span>
            </button>
            
            <div className="relative" ref={dropdownRef}>
              
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {userEmail.substring(0, 2).toUpperCase()}
              </button>

              {/* PATAISYMAS: Pridėtas 'z-50', kad dropdown būtų aukščiausiai */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="text-sm font-medium text-slate-800 truncate">{userEmail}</div>
                    <div className="text-xs text-slate-500">{getFriendlyRoleName(userRole)}</div>
                  </div>
                  <div className="py-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        // PATAISYTA: Nukreipiame į vartotojo nustatymų vaizdą
                        setCurrentView('settings-profile' as View);
                        setIsDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Paskyros nustatymai
                    </a>
                  </div>
                  <div className="border-t border-slate-200">
                    <button
                      onClick={() => {
                        onLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      Atsijungti
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;