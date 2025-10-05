#!/bin/bash
# Edens News - Server Setup Script
# Run this on your DigitalOcean droplet after first login

set -e

echo "=========================================="
echo "Edens News - Server Setup"
echo "=========================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
echo "Installing PostgreSQL 15..."
sudo apt install -y postgresql postgresql-contrib

# Install other required packages
echo "Installing additional packages..."
sudo apt install -y nginx certbot python3-certbot-nginx ufw fail2ban

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw --force enable

# Start PostgreSQL
echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE edensnews;

-- Create user with password (CHANGE THIS PASSWORD!)
CREATE USER edensnews_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_STRONG_PASSWORD_123!@#';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE edensnews TO edensnews_user;

-- Connect to database and grant schema privileges
\c edensnews
GRANT ALL ON SCHEMA public TO edensnews_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edensnews_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edensnews_user;

-- Show databases
\l
EOF

# Configure PostgreSQL for remote connections
echo "Configuring PostgreSQL for remote connections..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf

# Add client authentication
echo "host    edensnews    edensnews_user    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/15/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Install Node.js (for API server)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Create app directory
echo "Creating application directory..."
sudo mkdir -p /var/www/edensnews-api
sudo chown -R $USER:$USER /var/www/edensnews-api

echo "=========================================="
echo "Server setup complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Change the database password!"
echo "Run: sudo -u postgres psql"
echo "Then: ALTER USER edensnews_user WITH PASSWORD 'your_new_strong_password';"
echo ""
echo "Your PostgreSQL is now running on port 5432"
echo "Database: edensnews"
echo "User: edensnews_user"
echo ""
