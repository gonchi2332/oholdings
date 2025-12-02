import { supabase } from '../lib/supabase';

export const appointmentService = {
    async createAppointment(appointment) {
        const { data, error } = await supabase.functions.invoke('citas', {
            body: appointment,
            method: 'POST',
        });
        if (error) throw error;
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

    async updateStatus(id, status) {
        const { data, error } = await supabase.functions.invoke('citas', {
            body: { id, status },
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
        // Fetch profiles where role is employee or admin
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, specialty')
            .in('role', ['employee', 'admin']);

        if (error) throw error;
        return data;
    },

    async getClients() {
        // Fetch profiles where role is user
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'user');

        if (error) throw error;
        return data;
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

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'user')
            .in('id', userIds);

        if (profileError) throw profileError;
        return profiles || [];
    }
};
