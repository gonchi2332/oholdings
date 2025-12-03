import { supabase } from '../lib/supabase';

export const appointmentService = {
    async createAppointment(appointment) {
        const { data, error } = await supabase.functions.invoke('citas', {
            body: appointment,
            method: 'POST',
        });
        if (error) {
            // If error comes from edge function response
            throw new Error(error.message || error.error || 'Failed to create appointment');
        }
        // Check if data contains an error (from edge function)
        if (data && data.error) {
            throw new Error(data.error);
        }
        return data;
    },

    async getAppointments(employeeId = null) {
        // Use query parameter for GET request instead of body
        const url = employeeId ? `citas?employee_id=${employeeId}` : 'citas';
        const { data, error } = await supabase.functions.invoke(url, {
            method: 'GET',
        });
        if (error) throw error;
        return data; // Returns { appointments: [], isEmployee: bool }
    },

    async updateStatus(id, status_name) {
        const { data, error } = await supabase.functions.invoke('citas', {
            body: { id, status_name },
            method: 'PUT',
        });
        if (error) throw error;
        return data;
    },

    async deleteAppointment(id) {
        const { data, error } = await supabase.functions.invoke('citas', {
            body: { id },
            method: 'DELETE',
        });
        if (error) throw error;
        return data;
    },


    async getEmployees() {
        // Get role IDs first, then filter profiles
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
                full_name, 
                specialty:specialties!profiles_specialty_id_fkey(name),
                role:roles!profiles_role_id_fkey(name)
            `)
            .in('role_id', roleIds);

        if (profileError) throw profileError;
        return profiles || [];
    },

    async getClients() {
        // Fetch profiles where role is user (using join with roles table)
        const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'user')
            .single();

        if (!roleData) throw new Error('User role not found');

        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id, 
                full_name, 
                email,
                role:roles!profiles_role_id_fkey(name)
            `)
            .eq('role_id', roleData.id);

        if (error) throw error;
        return data || [];
    },

    async getCompanies() {
        // Get unique companies from citas table
        const { data, error } = await supabase
            .from('citas')
            .select('empresa')
            .not('empresa', 'is', null);

        if (error) throw error;
        
        // Extract unique companies from citas
        const uniqueCompanies = [...new Set((data || []).map(c => c.empresa).filter(Boolean))];
        
        // If no companies in citas, return empty array
        return uniqueCompanies.length > 0 ? uniqueCompanies : [];
    },

    async getClientsByCompany(company) {
        // Get clients that have appointments with this company
        const { data: appointments, error: appError } = await supabase
            .from('citas')
            .select('user_id, empresa')
            .eq('empresa', company);

        if (appError) throw appError;

        const userIds = [...new Set((appointments || []).map(a => a.user_id))];
        
        if (userIds.length === 0) {
            // If no appointments, return all clients (fallback)
            return this.getClients();
        }

        const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'user')
            .single();

        if (!roleData) throw new Error('User role not found');

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id, 
                full_name, 
                email,
                role:roles!profiles_role_id_fkey(name)
            `)
            .eq('role_id', roleData.id)
            .in('id', userIds);

        if (profileError) throw profileError;
        return profiles || [];
    },

    async getTiposConsulta() {
        const { data, error } = await supabase
            .from('tipos_consulta')
            .select('id, name, description')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getModalidades() {
        const { data, error } = await supabase
            .from('modalidades')
            .select('id, name, description')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getStatusCitas() {
        const { data, error } = await supabase
            .from('status_citas')
            .select('id, name, description')
            .order('name');

        if (error) throw error;
        return data || [];
    }
};
