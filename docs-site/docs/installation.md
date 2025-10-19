---
sidebar_position: 2
---

# Installation Guide

This guide will help you set up the Problem Solver Foundation project locally.

## Prerequisites

- **Node.js 22+** and npm
- **Firebase project** created
- **Git**

## 1. Clone Repository

```bash
git clone https://github.com/Problem-Solvers-Foundation/psf-web.git
cd psf-web
```

## 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to **Firestore Database** → **Create database**
   - Start in **production mode**
   - Choose location: `southamerica-east1` (São Paulo)

4. Download Service Account Key:
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate new private key**
   - Save as `backend/serviceAccountKey.json`
   - ⚠️ **NEVER commit this file to Git!**

## 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your actual credentials (NEVER commit this file!)

# Start server
npm start
```

Server will run at: `http://localhost:3000`

## 4. Environment Variables

See the [Environment Variables](./environment-variables.md) page for complete configuration guide.

### Quick setup:

```bash
# backend/.env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
FRONTEND_URL=http://localhost:5173
```

## 5. Access the Application

- **Homepage:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Blog:** http://localhost:3000/blog

## 6. Create Admin User

```bash
cd backend
node create-admin.js
```

Follow the prompts to create your first admin user.

## Troubleshooting

### Firebase Connection Error

If you see `❌ Erro ao conectar Firebase`:
- Verify `backend/serviceAccountKey.json` exists
- Check that environment variables are set correctly
- Ensure Firebase project ID matches

### Port Already in Use

If port 3000 is already in use:
```bash
# Change PORT in backend/.env
PORT=3001
```

### Module Not Found Errors

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- [Configuration Guide](./configuration.md)
- [Deployment Guide](./deployment.md)
- [Security Best Practices](./security.md)
