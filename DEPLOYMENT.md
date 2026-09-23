# Phase 10: Online Production Deployment Guide

## Architecture Overview
- **Frontend**: React + Vite (Static Site, deployed on Render Static Site or similar)
- **Backend**: Node.js + Express (Deployed on Render Web Service)
- **Database**: Managed PostgreSQL (e.g., Render Postgres, Neon, or Supabase)

## Environment Separation
It is critical to keep Development, Staging, and Production environments completely separated.

**Production Environment Variables (Backend)**
- \NODE_ENV=production\
- \PORT=5000\
- \DATABASE_URL="postgresql://<production-db>"\
- \JWT_SECRET="<secure-random-string>"\
- \CLIENT_URL="https://your-production-frontend.onrender.com"\

**Production Environment Variables (Frontend)**
- \VITE_API_URL="https://your-production-backend.onrender.com/api"\

## Deployment Steps (Render)

### 1. Database Setup
1. Create a PostgreSQL instance on Render.
2. Note the **Internal Database URL** for the backend, and **External Database URL** if you need to run migrations from your local machine.

### 2. Backend Deployment
1. Create a new "Web Service" on Render.
2. Select the repository.
3. Set the Root Directory to \server\.
4. Build Command: \
pm install && npx prisma generate\
5. Start Command: \
px prisma migrate deploy && npm start\
   - *CRITICAL*: Do not use \prisma migrate reset\ or \prisma db push\ in production.
6. Add the environment variables listed above.

### 3. Frontend Deployment
1. Create a new "Static Site" on Render.
2. Select the repository.
3. Set the Root Directory to \client\.
4. Build Command: \
pm install && npm run build\
5. Publish Directory: \client/dist\
6. Add the \VITE_API_URL\ environment variable.
7. Set rewrite rules for SPA:
   - Source: \/*\
   - Destination: \/index.html\
   - Action: \Rewrite\

## Backup Strategy
- **Production**: The application disables manual local file backups in production. All backups are handled by the Managed PostgreSQL provider's automated backup system (e.g., Render's daily backups and Point-in-Time Recovery).
- **Restoration**: Must be done via the Cloud Provider's console to avoid accidental destruction of production data.

## Hardware & Offline Capabilities
- **Scanner Support**: Barcode scanners function as keyboard emulators. Scanning a code triggers a rapid backend lookup via HTTPS.
- **Printing**: The POS utilizes browser-native printing (\window.print()\) which is universally compatible with standard USB/Network thermal receipt printers installed on the local OS.
- **Payments**: The Static QR code is printed on the bill or displayed on screen. Payment verification is manual. No automated payment API is connected.
- **Offline Mode**: Currently NOT supported. This is strictly an Online-First architecture.
