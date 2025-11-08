-- Pataisytas kodas, kuris nenaudoja uuid_generate_v4() DB pusėje.
-- UUID bus sukuriami per React/Node.js kodą ir atsiunčiami į DB.

-- Įjungimas, kad nepritrūktų kitoms Supabase funkcijoms
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 

-- 1. Sukuriam ROLIŲ lentelę
CREATE TABLE public.roles (
    role_id uuid not null, -- Nėra default vertės
    name text not null,
    description text null,
    primary key (role_id),
    unique (name)
);
alter table public.roles enable row level security;


-- 2. Sukuriam kliento profilio lentelę (client_data)
create table
  public.client_data (
    client_id uuid not null, -- Nėra default vertės
    company_name text not null,
    company_pvm_code text not null,
    company_code text null,
    bank_account text null,
    email_for_invoices text null,
    rivile_code_prefix text null,
    primary key (client_id)
  );
alter table public.client_data enable row level security;


-- 3. Sukuriam Vartotojo Profilių lentelę (user_profiles)
CREATE TABLE public.user_profiles (
    user_id uuid not null, -- Supabase Auth vartotojo ID
    client_id uuid not null references public.client_data (client_id),
    role_id uuid not null references public.roles (role_id),
    primary key (user_id),
    unique (client_id, user_id)
);
alter table public.user_profiles enable row level security;


-- 4. Sukuriam Prekių/Paslaugų Medį (items_master)
create table
  public.items_master (
    item_id uuid not null, -- Nėra default vertės
    client_id uuid not null references public.client_data (client_id),
    item_type text not null, -- PREKĖ, PASLAUGA
    client_item_code text null,
    description text null,
    supplier_item_code text null,
    korespondencijos_saskaita text not null, -- Pvz., 6117
    uom_code text null,
    weight_netto numeric null,
    primary key (item_id)
  );
alter table public.items_master enable row level security;


-- 5. Sukuriam Sąskaitų Antraštes (invoices)
create table
  public.invoices (
    invoice_id uuid not null, -- Nėra default vertės
    client_id uuid not null references public.client_data (client_id),
    invoice_type text not null default 'PIRKIMAS'::text, -- PIRKIMAS / PARDAVIMAS
    status text not null default 'KARANTINAS'::text, -- KARANTINAS / ATIDUOTA / NETINKA
    invoice_number text not null,
    invoice_date date not null,
    total_netto numeric null,
    supplier_name text null,
    supplier_pvm_code text null,
    document_url text null, -- Nuoroda į failą Supabase Storage
    primary key (invoice_id)
  );
alter table public.invoices enable row level security;


-- 6. Sukuriam Sąskaitų Eilutes (invoice_items)
create table
  public.invoice_items (
    item_line_id uuid not null, -- Nėra default vertės
    invoice_ref_id uuid not null references public.invoices (invoice_id) on delete cascade,
    master_item_ref_id uuid null references public.items_master (item_id),
    ai_description text null,
    ai_quantity numeric null,
    ai_netto_price numeric null,
    ai_vat_rate numeric null,
    is_vat_object boolean not null default true, -- Delspinigių atskyrimui
    primary key (item_line_id)
  );
alter table public.invoice_items enable row level security;


-- Įterpiam pradines roles, Dabar ID sugeneruojam atskirai ir įrašome
INSERT INTO public.roles (name, role_id) VALUES 
('Super Admin', '10000000-0000-0000-0000-000000000001'), 
('Admin', '10000000-0000-0000-0000-000000000002'), 
('User', '10000000-0000-0000-0000-000000000003'),
('Bookkeeper', '10000000-0000-0000-0000-000000000004'),
('Viewer', '10000000-0000-0000-0000-000000000005')
ON CONFLICT (name) DO NOTHING;