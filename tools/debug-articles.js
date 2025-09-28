// Debug script to check article data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugArticles() {
    try {
        console.log('Fetching articles...');
        
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title_kn, title_en, content_kn, content_en, image_url, reporter, created_at')
            .limit(5);
        
        if (error) {
            console.error('Error fetching articles:', error);
            return;
        }
        
        console.log('Articles found:', articles.length);
        console.log('\nArticle details:');
        
        articles.forEach((article, index) => {
            console.log(`\n--- Article ${index + 1} ---`);
            console.log('ID:', article.id);
            console.log('Title KN:', article.title_kn);
            console.log('Title EN:', article.title_en);
            console.log('Has Content KN:', !!article.content_kn);
            console.log('Has Content EN:', !!article.content_en);
            console.log('Image URL:', article.image_url);
            console.log('Reporter:', article.reporter);
            console.log('Created:', article.created_at);
        });
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugArticles();
