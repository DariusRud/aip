// src/components/SettingsProfile.tsx
import React from 'react';

// Šis komponentas bus iškviečiamas, kai paspausite "Koreguoti"
const SettingsProfile: React.FC = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Redaguoti Profilį</h2>
      
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Štai laukai, kuriuos "Koreguoti" mygtukas redaguos: */}
            
            <label className="block">
              <span className="text-slate-700 font-medium">Vartotojo vardas:</span>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                placeholder="Vardenis Pavardenis"
              />
            </label>

            <label className="block">
              <span className="text-slate-700 font-medium">El. Paštas:</span>
              <input 
                type="email" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-100"
                value="testas@testas.lt"
                readOnly 
              />
            </label>

            <label className="block">
              <span className="text-slate-700 font-medium">Rolė:</span>
              <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                <option>Super Admin</option>
                <option>Admin</option>
                <option>User</option>
              </select>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button 
              type="submit"
              className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg shadow hover:bg-indigo-700 transition"
            >
              Saugoti Pakeitimus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsProfile;