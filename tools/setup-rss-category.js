// Script to ensure RSS category exists in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRssCategory() {
    try {
        console.log('Setting up RSS category...');
        
        // Check if RSS category exists
        const { data: existingCategory, error: fetchError } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', 'rss')
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }
        
        if (existingCategory) {
            console.log('RSS category already exists:', existingCategory);
            return;
        }
        
        // Create RSS category
        const { data: newCategory, error: createError } = await supabase
            .from('categories')
            .insert({
                name: 'RSS',
                slug: 'rss'
            })
            .select()
            .single();
        
        if (createError) {
            throw createError;
        }
        
        console.log('RSS category created successfully:', newCategory);
        
    } catch (error) {
        console.error('Error setting up RSS category:', error);
        process.exit(1);
    }
}

setupRssCategory();

