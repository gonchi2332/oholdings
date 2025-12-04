import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export function getSupabaseClient(authHeader: string | null) {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing required environment variables')
    }

    return createClient(
        supabaseUrl,
        supabaseAnonKey,
        { global: { headers: { Authorization: authHeader || '' } } }
    )
}

