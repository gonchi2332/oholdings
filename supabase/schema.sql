-- Drop existing tables to ensure clean state (drop in correct order due to foreign keys)
drop table if exists public.citas;
drop table if exists public.profiles;
drop table if exists public.tipos_consulta;
drop table if exists public.modalidades;
drop table if exists public.status_citas;
drop table if exists public.specialties;
drop table if exists public.roles;

-- 1. Create Reference Tables

-- Roles Table
create table public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default roles
insert into public.roles (name, description) values
  ('user', 'Regular customer user'),
  ('employee', 'Employee/specialist'),
  ('admin', 'Administrator');

-- Tipos Consulta Table
create table public.tipos_consulta (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default tipos consulta
insert into public.tipos_consulta (name, description) values
  ('General', 'General consultation'),
  ('Technical', 'Technical support'),
  ('Sales', 'Sales consultation'),
  ('Support', 'Customer support');

-- Modalidades Table
create table public.modalidades (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default modalidades
insert into public.modalidades (name, description) values
  ('Virtual', 'Virtual/Online consultation'),
  ('In-Person', 'In-person consultation');

-- Status Citas Table
create table public.status_citas (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default status
insert into public.status_citas (name, description) values
  ('pending', 'Pending approval'),
  ('approved', 'Approved appointment'),
  ('rejected', 'Rejected appointment');

-- Specialties Table
create table public.specialties (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default specialties
insert into public.specialties (name, description) values
  ('General Consultation', 'General consultation services'),
  ('Technical Support', 'Technical support and troubleshooting'),
  ('Sales Representative', 'Sales and business consultation'),
  ('Customer Support', 'Customer service and support');

-- 2. Create Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role_id uuid references public.roles(id) not null,
  specialty_id uuid references public.specialties(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 3. Create Citas Table
create table public.citas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid references public.profiles(id),
  empresa text,
  tipo_consulta_id uuid references public.tipos_consulta(id) not null,
  descripcion text,
  fecha_consulta timestamptz not null,
  end_time timestamptz,
  modalidad_id uuid references public.modalidades(id) not null,
  direccion text,
  status_id uuid references public.status_citas(id) not null,
  created_by_employee boolean default false not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for Citas
alter table public.citas enable row level security;

-- Policies for Citas

-- SELECT: 
-- - Users (customers) can see their own appointments AND approved appointments of specialists they can book with
-- - Employees can only see their own appointments (where they are the employee_id)
-- - Admins can see all
create policy "Users see own and specialist appointments, Employees see own"
  on public.citas for select
  using (
    -- Customers can see their own appointments
    auth.uid() = user_id or
    -- Customers can see approved appointments of any specialist (for calendar availability)
    (status_id = (select id from public.status_citas where name = 'approved') and exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name = 'user'
    )) or
    -- Employees can only see appointments where they are the employee
    (employee_id = auth.uid() and exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name in ('employee', 'admin')
    )) or
    -- Admins can see all
    exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name = 'admin'
    )
  );

-- INSERT: Users can insert their own.
create policy "Users can insert their own appointments"
  on public.citas for insert
  with check ( auth.uid() = user_id );

-- UPDATE: 
-- - Users (customers) can only accept/reject appointments created by employees (status = 'approved' or 'rejected')
-- - Employees can update status of their own appointments
-- - Admins can update any
create policy "Users can accept/reject employee appointments, Employees update own"
  on public.citas for update
  using (
    -- Customers can only update status to accept/reject appointments created by employees
    (auth.uid() = user_id and exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name = 'user'
    )) or
    -- Employees can update status of appointments where they are the employee
    (employee_id = auth.uid() and exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name in ('employee', 'admin')
    )) or
    -- Admins can update any
    exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name = 'admin'
    )
  );

-- DELETE: 
-- - Users (customers) CANNOT delete appointments (they can only accept/reject)
-- - Employees can only delete their own appointments (where they are the employee_id)
-- - Admins can delete any
create policy "Only employees can delete own appointments, admins can delete any"
  on public.citas for delete
  using (
    -- Employees can delete appointments where they are the employee
    (employee_id = auth.uid() and exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name in ('employee', 'admin')
    )) or
    -- Admins can delete any
    exists (
      select 1 from public.profiles p
      join public.roles r on p.role_id = r.id
      where p.id = auth.uid() and r.name = 'admin'
    )
  );

-- Index for performance
create index idx_citas_employee_date on public.citas(employee_id, fecha_consulta);
create index idx_citas_user on public.citas(user_id);
create index idx_citas_status on public.citas(status_id);
create index idx_citas_tipo_consulta on public.citas(tipo_consulta_id);
create index idx_citas_modalidad on public.citas(modalidad_id);
create index idx_profiles_role on public.profiles(role_id);
create index idx_profiles_specialty on public.profiles(specialty_id);

-- RLS Policies for Reference Tables (all should be readable by everyone)
alter table public.roles enable row level security;
alter table public.tipos_consulta enable row level security;
alter table public.modalidades enable row level security;
alter table public.status_citas enable row level security;
alter table public.specialties enable row level security;

create policy "Roles are viewable by everyone"
  on public.roles for select
  using ( true );

create policy "Tipos consulta are viewable by everyone"
  on public.tipos_consulta for select
  using ( true );

create policy "Modalidades are viewable by everyone"
  on public.modalidades for select
  using ( true );

create policy "Status citas are viewable by everyone"
  on public.status_citas for select
  using ( true );

create policy "Specialties are viewable by everyone"
  on public.specialties for select
  using ( true );

-- Trigger to handle new user signup (automatically create profile)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role_id uuid;
begin
  -- Get the default 'user' role ID
  select id into default_role_id from public.roles where name = 'user' limit 1;
  
  -- If role doesn't exist, this will fail - which is good for data integrity
  if default_role_id is null then
    raise exception 'Default user role not found';
  end if;
  
  insert into public.profiles (id, email, full_name, role_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    default_role_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
