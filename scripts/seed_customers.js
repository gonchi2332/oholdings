import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needs Service Role Key for Admin actions

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customers = [
    {
        email: 'customer1@example.com',
        password: 'pass123',
        full_name: 'John Customer',
        role: 'user'
    },
    {
        email: 'customer2@example.com',
        password: 'pass123',
        full_name: 'Maria Garcia',
        role: 'user'
    },
    {
        email: 'customer3@example.com',
        password: 'pass123',
        full_name: 'Robert Johnson',
        role: 'user'
    }
];

async function seedCustomers() {
    console.log('Seeding customers...');

    for (const customer of customers) {
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: customer.email,
                password: customer.password,
                email_confirm: true,
                user_metadata: { full_name: customer.full_name }
            });

            if (authError) {
                console.error(`Error creating auth user for ${customer.email}:`, authError.message);
                continue; // Skip if user already exists or error
            }

            const userId = authData.user.id;
            console.log(`Created auth user: ${customer.email} (${userId})`);

            // 2. Update Profile (Trigger might have created it, but we need to set role)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: customer.email,
                    full_name: customer.full_name,
                    role: customer.role,
                    updated_at: new Date()
                });

            if (profileError) {
                console.error(`Error updating profile for ${customer.email}:`, profileError.message);
            } else {
                console.log(`Updated profile for ${customer.email}`);
            }

        } catch (err) {
            console.error(`Unexpected error for ${customer.email}:`, err);
        }
    }

    console.log('Seeding complete.');
}

seedCustomers();

