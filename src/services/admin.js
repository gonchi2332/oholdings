import { supabase } from '../lib/supabase';

export const adminService = {
    // Get current user role
    async getUserRole() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                role_id,
                role:roles!profiles_role_id_fkey(name)
            `)
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return profile?.role?.name || 'user';
    },

    // Check if user is admin or employee
    async isAdminOrEmployee() {
        const role = await this.getUserRole();
        return role === 'admin' || role === 'employee';
    },

    // Check if user is admin
    async isAdmin() {
        const role = await this.getUserRole();
        return role === 'admin';
    },

    // Get all employees
    async getAllEmployees() {
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .in('name', ['employee', 'admin']);

        if (roleError) throw roleError;
        if (!roleData || roleData.length === 0) return [];

        const roleIds = roleData.map(r => r.id);
        
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                specialty:specialties!profiles_specialty_id_fkey(id, name),
                role:roles!profiles_role_id_fkey(name),
                created_at
            `)
            .in('role_id', roleIds)
            .order('full_name', { ascending: true });

        if (profileError) throw profileError;
        return profiles || [];
    },

    // Get all users (customers)
    async getAllUsers() {
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'user')
            .single();

        if (roleError) throw roleError;
        if (!roleData) return [];

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                role:roles!profiles_role_id_fkey(name),
                created_at
            `)
            .eq('role_id', roleData.id)
            .order('full_name', { ascending: true });

        if (profileError) throw profileError;
        return profiles || [];
    },

    // Create a new employee (admin only - requires creating auth user first)
    // This is a helper that will be used after creating the auth user
    async updateUserRole(userId, roleName, specialtyId = null) {
        // Get role ID
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();

        if (roleError) throw roleError;
        if (!roleData) throw new Error(`Role ${roleName} not found`);

        // Update profile with role and specialty
        const updateData = {
            role_id: roleData.id
        };

        if (specialtyId) {
            updateData.specialty_id = specialtyId;
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get all specialties
    async getSpecialties() {
        const { data, error } = await supabase
            .from('specialties')
            .select('id, name, description')
            .order('name');

        if (error) throw error;
        return data || [];
    }
};

