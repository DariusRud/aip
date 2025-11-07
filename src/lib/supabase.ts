import { createClient } from '@supabase/supabase-js';

// Kodas paims kintamuosius iš Vercel nustatymų
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Patikrinimas, ar kintamieji rasti
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Sukuriamas klientas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
