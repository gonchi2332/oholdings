import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers - order matters for some browsers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400', // 24 hours
}

// Helper function to create responses with CORS headers
const corsResponse = (body: any, status: number = 200) => {
    return new Response(
        typeof body === 'string' ? body : JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            }
        }
    )
}

serve(async (req) => {
    // Handle CORS preflight - MUST be the first thing
    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            status: 204,
            headers: corsHeaders
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return corsResponse({ error: 'Unauthorized' }, 401)
        }

        // Check user role from profiles
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isEmployee = profile?.role === 'employee' || profile?.role === 'admin';

        if (req.method === 'POST') {
            const { empresa, tipo_consulta, descripcion, fecha_consulta, modalidad, direccion, employee_id, user_id, duracion_consulta } = await req.json()

            if (!fecha_consulta) {
                return corsResponse({ error: 'Date is required' }, 400)
            }

            // Determine target user_id and employee_id
            let targetUserId = user.id;
            let targetEmployeeId = employee_id;

            if (isEmployee) {
                // If employee is booking, they MUST provide a user_id (client)
                // And they are the employee (unless they are admin assigning to others, but let's assume they book for themselves for now)
                if (!user_id) {
                    return corsResponse({ error: 'Client (user_id) is required for employee booking' }, 400)
                }
                targetUserId = user_id;
                targetEmployeeId = user.id; // Employee books for themselves
            } else {
                // Regular user booking
                if (!employee_id) {
                    return corsResponse({ error: 'Employee is required' }, 400)
                }
            }

            const startDate = new Date(fecha_consulta)
            // Use duracion_consulta if provided, default to 60 minutes
            const durationMinutes = duracion_consulta ? parseInt(duracion_consulta) : 60;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

            // Conflict Check: Check for APPROVED appointments for this employee
            const { data: conflicts, error: conflictError } = await supabaseClient
                .from('citas')
                .select('id')
                .eq('employee_id', targetEmployeeId)
                .eq('status', 'approved')
                .lt('fecha_consulta', endDate.toISOString())
                .gt('end_time', startDate.toISOString())

            if (conflictError) throw conflictError

            if (conflicts && conflicts.length > 0) {
                return corsResponse({ error: 'This time slot is already booked.' }, 409)
            }

            const { data, error } = await supabaseClient
                .from('citas')
                .insert([
                    {
                        user_id: targetUserId,
                        empresa,
                        tipo_consulta,
                        descripcion,
                        fecha_consulta: startDate.toISOString(),
                        end_time: endDate.toISOString(),
                        modalidad,
                        direccion,
                        employee_id: targetEmployeeId,
                        status: isEmployee ? 'approved' : 'pending' // Auto-approve if employee books
                    },
                ])
                .select()
                .single()

            if (error) throw error

            return corsResponse(data)
        }

        if (req.method === 'GET') {
            // Fetch appointments. Join with profiles to get employee name.
            // Note: Supabase JS join syntax depends on FK. 
            // We have employee_id -> profiles.id

            // Get employee_id from query parameters
            const url = new URL(req.url);
            const requestedEmployeeId = url.searchParams.get('employee_id');

            let query = supabaseClient
                .from('citas')
                .select(`
            *,
            employee:profiles!citas_employee_id_fkey(full_name, specialty)
        `)
                .order('fecha_consulta', { ascending: true })

            if (isEmployee) {
                // Employees can only see their own appointments
                query = query.eq('employee_id', user.id)
            } else {
                // Regular users (customers)
                if (requestedEmployeeId) {
                    // If requesting appointments for a specific specialist, show approved appointments of that specialist
                    query = query.eq('employee_id', requestedEmployeeId).eq('status', 'approved')
                } else {
                    // Otherwise, show their own appointments
                    query = query.eq('user_id', user.id)
                }
            }

            const { data, error } = await query

            if (error) throw error

            return corsResponse({ appointments: data, isEmployee })
        }

        if (req.method === 'PUT') {
            const { id, status } = await req.json()

            if (!id || !status) {
                return corsResponse({ error: 'ID and Status are required' }, 400)
            }

            // Check if user has permission to update this appointment
            const { data: existingAppointment, error: fetchError } = await supabaseClient
                .from('citas')
                .select('user_id, employee_id, status')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            // Employees can update status of their own appointments
            // Customers can only accept/reject their own appointments (that were created by employees)
            if (isEmployee) {
                // Employee can only update their own appointments
                if (existingAppointment.employee_id !== user.id) {
                    return corsResponse({ error: 'Forbidden: You can only update your own appointments' }, 403)
                }
            } else {
                // Customer can only update their own appointments
                if (existingAppointment.user_id !== user.id) {
                    return corsResponse({ error: 'Forbidden: You can only update your own appointments' }, 403)
                }
            }

            const { data, error } = await supabaseClient
                .from('citas')
                .update({ status })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            return corsResponse(data)
        }

        if (req.method === 'DELETE') {
            let id;
            try {
                const body = await req.json();
                id = body?.id;
            } catch (e) {
                // If body is empty or invalid, try to get from URL params as fallback
                const url = new URL(req.url);
                id = url.searchParams.get('id');
            }

            if (!id) {
                return corsResponse({ error: 'ID is required' }, 400)
            }

            let query = supabaseClient.from('citas').delete().eq('id', id)

            if (!isEmployee) {
                query = query.eq('user_id', user.id).eq('status', 'pending')
            }

            const { error } = await query

            if (error) throw error

            return corsResponse({ message: 'Deleted successfully' })
        }

        return corsResponse({ error: 'Method not allowed' }, 405)

    } catch (error) {
        return corsResponse({ error: error.message || 'Internal server error' }, 500)
    }
})
