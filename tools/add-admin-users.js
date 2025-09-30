// Tool to add admin users programmatically
// Run with: node tools/add-admin-users.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const adminEmails = [
    'p.s.veeresh@gmail.com',
    'c.sushmachandhru@gmail.com',
    'srilathayadav6@gmail.com',
    'reachsharath26@gmail.com'
];

async function addAdminUsers() {
    console.log('Adding admin users...');

    try {
        // First, get the user IDs for these email addresses from auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('Error fetching auth users:', authError);
            return;
        }

        const usersToUpdate = authUsers.users.filter(user =>
            adminEmails.includes(user.email)
        );

        if (usersToUpdate.length === 0) {
            console.log('No matching users found in auth.users table.');
            console.log('Make sure these users have signed up first:');
            adminEmails.forEach(email => console.log(`- ${email}`));
            return;
        }

        console.log(`Found ${usersToUpdate.length} users to make admin`);

        // Update user profiles to admin role
        for (const user of usersToUpdate) {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    role: 'admin',
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                    preferred_language: 'en'
                }, {
                    onConflict: 'user_id'
                });

            if (updateError) {
                console.error(`Error updating ${user.email}:`, updateError);
            } else {
                console.log(`✅ Added admin role to: ${user.email}`);
            }
        }

        // Verify admin users
        const { data: adminUsers, error: verifyError } = await supabase
            .from('user_profiles')
            .select('email, role, full_name')
            .eq('role', 'admin')
            .in('email', adminEmails);

        if (verifyError) {
            console.error('Error verifying admin users:', verifyError);
        } else {
            console.log('\n📋 Current admin users:');
            adminUsers.forEach(user => {
                console.log(`- ${user.email} (${user.full_name}) - ${user.role}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the script
addAdminUsers();
