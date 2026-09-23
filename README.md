# Store POS

A clean, scalable offline retail store POS and inventory management system.

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma

## Project Structure
- `/client`: React frontend
- `/server`: Node.js backend

## Getting Started

### Prerequisites
- Node.js
- PostgreSQL database (`store_pos`)

### Setup Database
1. Ensure PostgreSQL is running.
2. Create a database named `store_pos` (if you haven't already).
3. In `/server/.env`, set your database URL:
   `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/store_pos?schema=public"`

### Run Server
```bash
cd server
npm install
npx prisma db push
npm run dev
```

### Run Client
```bash
cd client
npm install
npm run dev
```
