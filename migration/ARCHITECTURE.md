# 🏗️ Architecture Overview

## Current Architecture (Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Web Browsers)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   NETLIFY (CDN)                              │
│              React App (Static Files)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  SUPABASE (Cloud)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Supabase Client Library                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │              Auto-Generated API                      │   │
│  │         (REST + GraphQL + Realtime)                  │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │          PostgreSQL Database                         │   │
│  │  • articles, users, bookmarks, etc.                  │   │
│  │  • 500MB storage (free) / 8GB (pro)                  │   │
│  │  • 5GB bandwidth (free) / 250GB (pro)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Cost: $0/month (free) or $25/month (pro)                   │
│  ⚠️ Bandwidth limit exceeded = Throttling/Timeouts          │
└──────────────────────────────────────────────────────────────┘
```

## New Architecture (Self-Hosted)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Web Browsers)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   NETLIFY (CDN)                              │
│              React App (Static Files)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │
┌────────────────────────▼────────────────────────────────────┐
│              DIGITALOCEAN DROPLET                            │
│                  ($6/month VPS)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 NGINX (Port 80/443)                  │   │
│  │           Reverse Proxy + SSL                        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │           EXPRESS API SERVER (Port 3001)             │   │
│  │  • Custom REST API                                   │   │
│  │  • PM2 Process Manager                               │   │
│  │  • Node.js 20                                        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │        POSTGRESQL 15 (Port 5432)                     │   │
│  │  • articles, users, bookmarks, etc.                  │   │
│  │  • 25GB storage                                      │   │
│  │  • Unlimited bandwidth*                              │   │
│  │  • Optimized indexes                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Resources:                                                  │
│  • 1GB RAM                                                   │
│  • 1 CPU Core                                                │
│  • 25GB SSD                                                  │
│  • 1TB Bandwidth*                                            │
│                                                              │
│  Cost: $6/month                                              │
│  ✅ No throttling, full control                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### Before (Supabase)
```
User Action → React Component → Supabase Client
    ↓
Supabase API (Auto-generated)
    ↓
PostgreSQL (Managed by Supabase)
    ↓
Response → React Component → UI Update

Latency: 500-1000ms
Bandwidth: Counted towards limit
Timeout: 60 seconds (can fail)
```

### After (Self-Hosted)
```
User Action → React Component → Custom DB Client
    ↓
Express API (Your server)
    ↓
PostgreSQL (Your database)
    ↓
Response → React Component → UI Update

Latency: 100-300ms
Bandwidth: Unlimited
Timeout: Configurable (no limits)
```

## Component Breakdown

### 1. Frontend (No Change)
```
React App (Vite)
├── Components
├── Pages
├── API Client (Updated)
└── Environment Variables (Updated)

Hosted on: Netlify (Free tier)
```

### 2. API Server (New)
```
Express.js Server
├── Routes
│   ├── /api/articles
│   ├── /api/categories
│   ├── /api/bookmarks
│   └── /api/analytics
├── Database Connection Pool
├── Error Handling
└── CORS Configuration

Managed by: PM2
Port: 3001 (internal)
```

### 3. Reverse Proxy (New)
```
Nginx
├── SSL/TLS Termination
├── Request Routing
├── Rate Limiting (optional)
└── Static File Serving (optional)

Port: 80 (HTTP) → 443 (HTTPS)
```

### 4. Database (Migrated)
```
PostgreSQL 15
├── Tables (10 total)
│   ├── articles
│   ├── categories
│   ├── users
│   └── ...
├── Indexes (optimized)
├── Triggers (auto-update timestamps)
└── Backup Scripts

Port: 5432
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  1. Firewall (UFW)                      │
│     • Allow: 22 (SSH), 80, 443          │
│     • Block: Everything else            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  2. Fail2ban                            │
│     • Blocks brute force attacks        │
│     • Auto-ban after 5 failed attempts  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  3. Nginx                               │
│     • SSL/TLS encryption                │
│     • Request validation                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  4. Express API                         │
│     • Input validation                  │
│     • Error handling                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  5. PostgreSQL                          │
│     • Password authentication           │
│     • Connection limits                 │
│     • Query timeouts                    │
└─────────────────────────────────────────┘
```

## Backup Strategy

```
Daily Backup (2 AM)
    ↓
PostgreSQL Dump
    ↓
/root/backups/edensnews_YYYYMMDD.sql
    ↓
Keep last 7 days
    ↓
(Optional) Upload to DigitalOcean Spaces
```

## Monitoring Points

```
1. Server Health
   • CPU usage
   • Memory usage
   • Disk space
   • Network traffic

2. API Performance
   • Response times
   • Error rates
   • Request counts
   • Active connections

3. Database Health
   • Query performance
   • Connection pool
   • Table sizes
   • Index usage

4. Application Metrics
   • Page views
   • User actions
   • Error logs
   • API calls
```

## Scaling Options

### Vertical Scaling (Upgrade Droplet)
```
$6/month  → $12/month  → $24/month  → $48/month
1GB RAM   → 2GB RAM    → 4GB RAM    → 8GB RAM
1 CPU     → 2 CPU      → 2 CPU      → 4 CPU
25GB SSD  → 50GB SSD   → 80GB SSD   → 160GB SSD
```

### Horizontal Scaling (Future)
```
Load Balancer
    ↓
┌───────┬───────┬───────┐
│ API 1 │ API 2 │ API 3 │
└───┬───┴───┬───┴───┬───┘
    └───────┴───────┘
            ↓
    PostgreSQL Primary
            ↓
    Read Replicas (optional)
```

## Migration Path

```
Phase 1: Setup Infrastructure
├── Create DigitalOcean droplet
├── Install PostgreSQL
├── Install Node.js
├── Install Nginx
└── Configure firewall

Phase 2: Migrate Data
├── Export from Supabase
├── Create schema
├── Import data
└── Verify integrity

Phase 3: Deploy API
├── Upload API server
├── Install dependencies
├── Configure PM2
└── Setup Nginx proxy

Phase 4: Update App
├── Update database client
├── Modify repositories
├── Update environment
└── Test thoroughly

Phase 5: Go Live
├── Point domain to API
├── Setup SSL
├── Monitor performance
└── Decommission Supabase
```

## Cost Analysis

### Monthly Costs
```
Supabase Pro:     $25.00
DigitalOcean:     $ 6.00
Backups:          $ 1.20 (optional)
Domain:           $ 1.00 (if using subdomain)
                  -------
Total:            $ 8.20

Savings:          $16.80/month
Annual Savings:   $201.60/year
```

### Break-even Analysis
```
Migration Time Investment: 2 hours
Hourly Rate: $25/hour
Migration Cost: $50

Break-even: 3 months
ROI after 1 year: 303%
```

## Performance Comparison

### Query Performance
```
Supabase:
├── Simple query: 200-500ms
├── Complex query: 1-3s
└── Timeout: 60s (then fails)

Self-Hosted:
├── Simple query: 50-150ms
├── Complex query: 200-800ms
└── Timeout: Configurable (no hard limit)
```

### Bandwidth
```
Supabase Free:
├── 5GB/month
└── Throttled after limit

Supabase Pro:
├── 250GB/month
└── $0.09/GB after

Self-Hosted:
├── 1TB/month included
└── $0.01/GB after (rare)
```

## Technology Stack

```
Frontend:
├── React 18
├── Vite
├── TailwindCSS
└── Lucide Icons

Backend:
├── Node.js 20
├── Express.js 4
├── PostgreSQL 15
└── PM2

Infrastructure:
├── Ubuntu 22.04 LTS
├── Nginx
├── UFW Firewall
└── Fail2ban

DevOps:
├── Git
├── SSH
└── Cron (backups)
```

---

**This architecture provides:**
- ✅ Better performance
- ✅ Lower costs
- ✅ Full control
- ✅ Scalability
- ✅ No vendor lock-in
