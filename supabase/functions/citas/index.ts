import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, corsResponse } from "./utils/cors.ts"
import { getSupabaseClient } from "./utils/supabaseClient.ts"
import { CitasService } from "./services/citasService.ts"
import { CitasController } from "./controllers/citasController.ts"

serve(async (req) => {
    // Handle CORS preflight - MUST be the first thing
    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            status: 204,
            headers: corsHeaders
        })
    }

    try {
        // Validate environment variables
        const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing required environment variables')
            return corsResponse({ error: 'Server configuration error' }, 500)
        }

        // Get Supabase client
        const authHeader = req.headers.get('Authorization')
        const supabaseClient = getSupabaseClient(authHeader)

        // Authenticate user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return corsResponse({ error: 'Unauthorized' }, 401)
        }

        // Get user role from profiles (join with roles table)
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select(`
                role_id,
                role:roles!profiles_role_id_fkey(name)
            `)
            .eq('id', user.id)
            .single()

        const roleName = profile?.role?.name || 'user'
        const isEmployee = roleName === 'employee' || roleName === 'admin'

        // Create service instance
        const citasService = new CitasService(supabaseClient, user.id, isEmployee)

        // Route to controller based on HTTP method
        switch (req.method) {
            case 'POST':
                return await CitasController.create(req, citasService)
            case 'GET':
                return await CitasController.getAll(req, citasService)
            case 'PUT':
                return await CitasController.update(req, citasService)
            case 'DELETE':
                return await CitasController.delete(req, citasService)
            default:
                return corsResponse({ error: 'Method not allowed' }, 405)
        }

    } catch (error: any) {
        // Log full error details server-side (in production, use proper logging service)
        console.error('Edge Function Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        })

        // Return generic error to client (don't expose internal details)
        return corsResponse({ error: 'An internal error occurred. Please try again later.' }, 500)
    }
})

