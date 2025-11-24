# Backend Setup Guide for MaiCa

## Architecture Change
MaiCa has migrated from offline-first (AsyncStorage) to a full-stack architecture with:
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **API:** RESTful backend at `/backend`

## Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **Service Role Key** (from Settings → API)
3. Go to **SQL Editor** and run the migration from `backend/migrations/001_initial_schema.sql`

## Step 2: Configure Backend Environment

1. Create `.env` file in `/backend`:
```bash
cp backend/.env.example backend/.env
```

2. Fill in your Supabase credentials:
```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=4000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAICA_WEB_URL=http://localhost:3000
```

## Step 3: Configure Mobile App Environment

1. Create `.env` file in root directory:
```bash
cp .env.example .env
```

2. Fill in:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=http://localhost:4000
```

## Step 4: Start the Backend

```bash
cd backend
npm install
npm start        # Production mode
# OR
npm run dev      # Development with hot reload
```

Backend will be available at `http://localhost:4000`

## Step 5: Update Mobile App

The mobile app contexts now use the backend API instead of AsyncStorage:
- Auth requests go through `/auth/login`, `/auth/register`
- Product operations use `/products` endpoints
- Sales/expenses are synced to Supabase

## Database Schema

See `backend/migrations/001_initial_schema.sql` for complete schema including:
- profiles (users)
- products
- sales
- expenses  
- product_photos
- password_resets

## API Documentation

See `backend/README.md` for full API route documentation.

## Environment Variables for Deployment

When deploying:
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in backend
- Set `EXPO_PUBLIC_API_URL` to your backend domain
- Use `process.env.SUPABASE_ANON_KEY` for mobile authentication

## Troubleshooting

**Backend won't start:**
- Check `.env` file has correct Supabase credentials
- Ensure `SUPABASE_URL` format is correct (https://xxx.supabase.co)

**Mobile app can't connect:**
- Verify `EXPO_PUBLIC_API_URL` points to running backend
- Check CORS is enabled in Express (should be by default)
- Network connectivity from device to backend

**Database errors:**
- Ensure migration SQL was run in Supabase SQL editor
- Check table names match API expectations
