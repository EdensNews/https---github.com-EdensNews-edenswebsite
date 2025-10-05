-- Edens News - PostgreSQL Database Schema
-- Run this on your DigitalOcean PostgreSQL database

-- Connect to the database first:
-- psql -U edensnews_user -d edensnews -h your_droplet_ip

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT,
    title_kn TEXT,
    title_ta TEXT,
    title_te TEXT,
    title_hi TEXT,
    title_ml TEXT,
    content_en TEXT,
    content_kn TEXT,
    content_ta TEXT,
    content_te TEXT,
    content_hi TEXT,
    content_ml TEXT,
    excerpt_en TEXT,
    excerpt_kn TEXT,
    excerpt_ta TEXT,
    excerpt_te TEXT,
    excerpt_hi TEXT,
    excerpt_ml TEXT,
    reporter VARCHAR(255),
    reporter_en VARCHAR(255),
    reporter_kn VARCHAR(255),
    reporter_ta VARCHAR(255),
    reporter_te VARCHAR(255),
    reporter_hi VARCHAR(255),
    reporter_ml VARCHAR(255),
    image_url TEXT,
    video_url TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    category VARCHAR(255),
    is_breaking BOOLEAN DEFAULT FALSE,
    breaking_expires_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article categories junction table
CREATE TABLE IF NOT EXISTS article_categories (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Analytics views table
CREATE TABLE IF NOT EXISTS analytics_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name_en VARCHAR(255),
    site_name_kn VARCHAR(255),
    description_en TEXT,
    description_kn TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address_en TEXT,
    contact_address_kn TEXT,
    copyright_text_en TEXT,
    copyright_text_kn TEXT,
    social_facebook VARCHAR(255),
    social_twitter VARCHAR(255),
    social_youtube VARCHAR(255),
    social_instagram VARCHAR(255),
    ai_app_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream settings table
CREATE TABLE IF NOT EXISTS stream_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_url TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    subtitle VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL,
    day_name_en VARCHAR(50),
    day_name_kn VARCHAR(50),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    show_name_en VARCHAR(255),
    show_name_kn VARCHAR(255),
    show_name_ta VARCHAR(255),
    show_name_te VARCHAR(255),
    show_name_hi VARCHAR(255),
    show_name_ml VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSS feeds table
CREATE TABLE IF NOT EXISTS rss_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON articles(is_breaking);
CREATE INDEX IF NOT EXISTS idx_article_categories_article_id ON article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_category_id ON article_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_views_article_id ON analytics_views(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_views_viewed_at ON analytics_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_settings_updated_at BEFORE UPDATE ON stream_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rss_feeds_updated_at BEFORE UPDATE ON rss_feeds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO edensnews_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO edensnews_user;

-- Success message
SELECT 'Database schema created successfully!' AS status;
