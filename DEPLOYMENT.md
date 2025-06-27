# 🚀 Deployment Guide: Local vs Remote Y.js Server

This guide covers **three deployment strategies** for your Y.js WebSocket server, from local development to production deployment.

## 🏗️ **Deployment Strategies**

| Strategy | Use Case | Setup Time | Best For |
|----------|----------|------------|----------|
| **Local Docker** | Local development | 2 mins | Solo development, offline work |
| **Hybrid** | Team development | 5 mins | Teams, testing multiplayer |
| **CI/CD Production** | Production | 10 mins | Production apps, automatic deployments |

---

## 🐳 **Strategy 1: Local Docker Development**

Perfect for developing and testing locally with containerized Y.js server.

### Quick Start
```bash
# Configure for local Docker
node scripts/configure-env.js local-docker

# Start Y.js server + frontend
pnpm run dev:local

# Or just Y.js server
pnpm run server:dev
```

### What This Does
- 🐳 Runs Y.js server in Docker container
- 🔌 WebSocket available at `ws://localhost:1234`
- 🚀 Frontend connects to local container
- 📊 Health monitoring and logs
- 🔄 Hot reload for server changes

---

## 🌐 **Strategy 2: Hybrid (Remote Server + Local Frontend)**

Best for teams - shared Y.js server, local frontend development.

### Setup

#### Option A: CI/CD (Recommended)
```bash
# 1. Push to GitHub (auto-deploys to Railway)
git add . && git commit -m "Deploy Y.js server"
git push origin main

# 2. Configure local frontend for remote server
node scripts/configure-env.js remote
# Update NEXT_PUBLIC_YJS_SERVER in .env.remote with your Railway URL

# 3. Start local frontend
pnpm run dev:remote
```

#### Option B: Manual Railway Deploy
```bash
# 1. Login to Railway
railway login

# 2. Create and deploy
railway create seasonal-board-game-server
cd apps/server && railway up

# 3. Get your URL and configure
railway status
node scripts/configure-env.js remote
# Update .env.remote with your Railway URL
```

---

## 🚀 **Strategy 3: Full CI/CD Production**

Enterprise-grade setup with automatic deployments, testing, and staging.

### Initial Setup

#### 1. **Railway Account & GitHub Integration**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and connect to GitHub
railway login
railway connect  # Connect to your GitHub repo
```

#### 2. **GitHub Secrets Configuration**
Go to GitHub → Repository → Settings → Secrets and Variables → Actions

Add these secrets:
```
RAILWAY_TOKEN=<your-railway-token>
RAILWAY_SERVICE_ID=<production-service-id>
RAILWAY_STAGING_SERVICE_ID=<staging-service-id>  # Optional
```

Get tokens:
```bash
# Get Railway token
railway auth

# Get service IDs after first deploy
railway status
```

#### 3. **Branch Strategy**
```bash
# Production branch (auto-deploys to production)
git checkout main
git push origin main

# Staging branch (auto-deploys to staging)
git checkout -b develop
git push origin develop
```

### Automated Workflow

#### **Every Push to `main`:**
1. ✅ Runs tests and linting
2. 🐳 Tests Docker build
3. 🚀 Deploys to Railway production
4. 🏥 Runs health checks
5. 📝 Updates environment files
6. 💬 Comments deployment status

#### **Every Push to `develop`:**
1. ✅ Same tests
2. 🚀 Deploys to Railway staging
3. 🔍 Staging environment for testing

#### **Pull Requests:**
1. ✅ Runs tests only
2. 📊 Shows test results
3. 🚀 No deployment (safety)

---

## 🔧 **Environment Management**

### Automatic Configuration
```bash
# Switch between environments easily
node scripts/configure-env.js local-docker   # Local Docker
node scripts/configure-env.js remote         # Railway/production
node scripts/configure-env.js status         # Show current config
```

### Manual Configuration
Edit these files directly:
- `.env.docker` - Local Docker settings
- `.env.remote` - Railway production settings
- `.env.local.example` - Template for native development

---

## 📊 **Monitoring & Debugging**

### Local Development
```bash
# View logs
pnpm run server:logs

# Health check
curl http://localhost:1234/health

# Stop services
pnpm run server:stop
```

### Railway Production
```bash
# View deployment status
railway status

# View logs
railway logs

# Health check
curl https://your-app.railway.app/health
```

### GitHub Actions
- View deployment status in **Actions** tab
- See detailed logs for each deployment
- Monitor test results and build status

---

## 🎯 **Recommendations by Use Case**

### **Solo Developer**
- ✅ Start with **Local Docker** (`pnpm run dev:local`)
- ✅ Deploy to Railway when ready to share

### **Small Team (2-5 people)**
- ✅ Use **Hybrid approach** with CI/CD
- ✅ Shared Railway server, individual local frontends

### **Production Application**
- ✅ Full **CI/CD with staging**
- ✅ Automated testing and deployment
- ✅ Branch protection and code reviews

---

## 🔒 **Security Best Practices**

### Railway Deployment
- ✅ Environment variables stored securely
- ✅ HTTPS/WSS automatic SSL certificates
- ✅ Network isolation and security

### GitHub Secrets
- ✅ Railway tokens stored as GitHub secrets
- ✅ No tokens in code or commits
- ✅ Separate staging/production environments

### Local Development
- ✅ `.env.local` in `.gitignore`
- ✅ Docker network isolation
- ✅ Health checks and monitoring

---

## 🚀 **Quick Commands Reference**

```bash
# Development
pnpm run dev:local          # Local Docker + Frontend
pnpm run dev:remote         # Remote Railway + Local Frontend  
pnpm run dev:full-docker    # Everything in Docker

# Server Management
pnpm run server:dev         # Y.js server only
pnpm run server:logs        # View server logs
pnpm run server:stop        # Stop all containers

# Environment
node scripts/configure-env.js <type>   # Configure environment
node scripts/configure-env.js status   # Show current config

# Deployment
git push origin main        # Auto-deploy to production
railway up                  # Manual deploy to Railway
railway status             # Check deployment status
```

---

## 💰 **Cost Comparison**

| Strategy | Railway Cost | Complexity | Best For |
|----------|-------------|------------|----------|
| **Local Only** | $0 | Low | Solo development |
| **Hybrid** | $5/month | Medium | Small teams |
| **Full CI/CD** | $5-20/month | High | Production apps |

Railway's Hobby plan ($5/month) is perfect for most use cases and includes everything you need for a production multiplayer game server.

---

*Choose the strategy that fits your needs and scale up as your project grows! 🎮*
