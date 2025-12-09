# Comandos SQL para Configurar Supabase

Copia y pega todo el siguiente bloque de código en el **SQL Editor** de tu proyecto en Supabase para configurar la base de datos completa.

```sql
-- 1. TABLA DE PERFILES (Gestiona roles y nombres)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  updated_at timestamp with time zone,
  email text,
  full_name text,
  avatar_url text,
  role text default 'USER',
  primary key (id)
);

-- 2. TABLA DE ÍTEMS (Inventario)
create table public.items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text not null,
  quantity integer default 0,
  available integer default 0,
  description text,
  image text,
  manual_url text,
  usage_instructions text,
  specifications jsonb default '{}'::jsonb,
  observations jsonb default '[]'::jsonb
);

-- 3. TABLA DE SOLICITUDES (Préstamos)
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid not null,
  user_name text not null,
  item_id uuid not null,
  item_name text not null,
  quantity integer not null,
  status text not null,
  notes text
);

-- 4. BUCKET DE ALMACENAMIENTO (Para imágenes y PDFs)
insert into storage.buckets (id, name, public) values ('inventory', 'inventory', true);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.requests enable row level security;

-- Permisos Perfiles
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );
create policy "Users can insert their own profile" on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );

-- Permisos Ítems
create policy "Items are viewable by everyone" on items for select using ( true );
create policy "Authenticated can update items" on items for all using ( auth.role() = 'authenticated' );

-- Permisos Solicitudes
create policy "Requests are viewable by everyone" on requests for select using ( true );
create policy "Authenticated can create requests" on requests for all using ( auth.role() = 'authenticated' );

-- Permisos Almacenamiento
create policy "Public Access Bucket" on storage.objects for select using ( bucket_id = 'inventory' );
create policy "Auth Upload Bucket" on storage.objects for insert with check ( bucket_id = 'inventory' and auth.role() = 'authenticated' );

-- 6. TRIGGER DE USUARIO NUEVO (Crea el perfil automáticamente al registrarse)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, 'USER');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```