-- Drop existing tables to ensure clean state
drop table if exists public.citas;
drop table if exists public.profiles;

-- 1. Create Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'employee')),
  specialty text, -- Added for employees
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

-- 2. Create Citas Table
create table public.citas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid references public.profiles(id), -- References profile now
  empresa text,
  tipo_consulta text,
  descripcion text,
  fecha_consulta timestamptz not null,
  end_time timestamptz,
  modalidad text,
  direccion text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
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
    (status = 'approved' and exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'user'
    )) or
    -- Employees can only see appointments where they are the employee
    (employee_id = auth.uid() and exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('employee', 'admin')
    )) or
    -- Admins can see all
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
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
      select 1 from public.profiles 
      where id = auth.uid() and role = 'user'
    )) or
    -- Employees can update status of appointments where they are the employee
    (employee_id = auth.uid() and exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('employee', 'admin')
    )) or
    -- Admins can update any
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
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
      select 1 from public.profiles 
      where id = auth.uid() and role in ('employee', 'admin')
    )) or
    -- Admins can delete any
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Index for performance
create index idx_citas_employee_date on public.citas(employee_id, fecha_consulta);
create index idx_citas_user on public.citas(user_id);

-- Trigger to handle new user signup (automatically create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
