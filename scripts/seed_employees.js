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

const employees = [
    {
        email: 'sarah.smith@example.com',
        password: 'pass123',
        full_name: 'Dr. Sarah Smith',
        specialty: 'General Consultation',
        role: 'employee'
    },
    {
        email: 'john.doe@example.com',
        password: 'pass123',
        full_name: 'Eng. John Doe',
        specialty: 'Technical Support',
        role: 'employee'
    },
    {
        email: 'alice.johnson@example.com',
        password: 'pass123',
        full_name: 'Alice Johnson',
        specialty: 'Sales Representative',
        role: 'employee'
    }
];

async function seedEmployees() {
    console.log('Seeding employees...');

    for (const emp of employees) {
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: emp.email,
                password: emp.password,
                email_confirm: true,
                user_metadata: { full_name: emp.full_name }
            });

            if (authError) {
                console.error(`Error creating auth user for ${emp.email}:`, authError.message);
                continue; // Skip if user already exists or error
            }

            const userId = authData.user.id;
            console.log(`Created auth user: ${emp.email} (${userId})`);

            // 2. Update Profile (Trigger might have created it, but we need to set role/specialty)
            // Wait a bit for trigger? Or just upsert.

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: emp.email,
                    full_name: emp.full_name,
                    role: emp.role,
                    specialty: emp.specialty,
                    updated_at: new Date()
                });

            if (profileError) {
                console.error(`Error updating profile for ${emp.email}:`, profileError.message);
            } else {
                console.log(`Updated profile for ${emp.email}`);
            }

        } catch (err) {
            console.error(`Unexpected error for ${emp.email}:`, err);
        }
    }

    console.log('Seeding complete.');
}

seedEmployees();
