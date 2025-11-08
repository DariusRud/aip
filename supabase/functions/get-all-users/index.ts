// supabase/functions/get-all-users/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. Sukuriam Admin klientą (NAUDOJAME NAUJUS PAVADINIMUS)
    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('PROJECT_SERVICE_KEY') ?? ''
    );

    // 2. Gaunam visus vartotojus iš Auth lentelės
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 3. Gaunam visus profilius (roles ir client_id) iš mūsų DB
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        user_id,
        client_id,
        roles ( name ) 
      `);
    if (profileError) throw profileError;

    // 4. Sujungiam duomenis
    const users = authUsers.users.map(user => {
      // @ts-ignore
      const profile = profiles?.find(p => p.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        status: user.email_confirmed_at ? 'AKTYVUS' : 'NEAKTYVUS',
        // @ts-ignore
        role: profile?.roles?.name || 'User' // Priskiriam rolę iš DB
      };
    });

    return new Response(
      JSON.stringify(users),
      // Svarbu CORS nustatymai, kad localhost galėtų pasiekti funkciją
      { headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Vėliau pakeisti į localhost:5173
        } 
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    });
  }
});