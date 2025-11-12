import { useState } from 'react';
import { supabase } from '../lib/supabase';
// Importuojame Session tipą, nes onLoginSuccess tikisi jo
import { Session } from '@supabase/supabase-js'; 

interface LoginProps {
  // 🟢 PATAISYTA: Pavadinimas suderintas su App.tsx: onLoginSuccess
  // 🟢 PATAISYTA: Tipas suderintas su App.tsx: priima Supabase Session objektą
  onLoginSuccess: (session: Session) => void; 
}

// 🟢 PATAISYTA: Išarchyvuojame naują savybės pavadinimą
export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🟢 PATAISYTA: Naudojame signInWithPassword ir gauname visą duomenų atsaką
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      // 🟢 PATAISYTA: Jei prisijungimas sėkmingas, perduodame sesiją atgal į App.tsx
      if (data.session) {
        onLoginSuccess(data.session);
      } else {
        throw new Error('Nepavyko gauti prisijungimo sesijos.');
      }
    } catch (err: any) {
      setError(err.message || 'Prisijungimo klaida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">AI</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AIPLENK</h1>
            <p className="text-slate-600 mt-2">Prisijunkite prie sistemos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                El. paštas
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="jusu@pastas.lt"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Slaptažodis
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Jungiamasi...' : 'Prisijungti'}
            </button>
          </form>
        </div>
        {/* 🟢 PRIDĖTAS: Dabar Login komponente naudojama visa App.tsx logika, todėl jam nebereikia onLogin */}
      </div>
    </div>
  );
}
