# MaiCa Quick Start Guide

## What Changed
MaiCa has evolved from offline-only to a full-stack app with cloud sync:
- ✅ Node.js + Express backend
- ✅ Supabase PostgreSQL database
- ✅ Cloud-based authentication
- ✅ Multi-device sync
- ✅ Password reset via email
- ✅ Push notifications ready

## 3-Step Setup

### Step 1: Create Supabase Project (5 minutes)

1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Copy **Project URL** and **Service Role Key** from Settings → API

### Step 2: Configure Backend

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your Supabase credentials:
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=4000
```

Run migrations in Supabase SQL Editor:
- Open SQL Editor in Supabase dashboard
- Copy & paste contents of `backend/migrations/001_initial_schema.sql`
- Execute (creates all tables with proper security)

### Step 3: Start Backend

```bash
cd backend
npm install
npm start
```

Backend runs on **http://localhost:4000**

### Step 4: Configure Mobile App

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings:
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=http://localhost:4000
```

Mobile app will now:
- Register/login via backend
- Sync products to cloud
- Store sales & expenses in database
- Support multi-device access

## File Structure

```
maica/
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Supabase client, email, etc.
│   │   └── index.js        # Main server
│   ├── migrations/         # Database schema
│   ├── package.json
│   └── .env.example
├── app.json                # Expo config
├── App.tsx                 # React Native entry
├── screens/                # Mobile screens
├── contexts/               # Auth, Language, Theme, Subscription
└── .env.example
```

## API Endpoints

All routes available at `http://localhost:4000`:

**Auth:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/forgot` - Request password reset
- `POST /auth/reset` - Reset password with token

**Products:**
- `GET /products` - List all
- `POST /products` - Create
- `PUT /products/:id` - Update
- `DELETE /products/:id` - Delete
- `GET /products/:id/photos` - Get photos
- `POST /products/:id/photos` - Add photo

## Next Steps

1. **Set up email (optional but recommended)** for password resets:
   - Gmail: Use App Password
   - SendGrid: Use API key
   - Update `SMTP_*` vars in `.env`

2. **Test on physical device:**
   - Backend must be accessible from device (not localhost)
   - Update `EXPO_PUBLIC_API_URL` to your computer's IP
   - Example: `http://192.168.1.100:4000`

3. **Deploy to production:**
   - Backend: Heroku, Render, Railway, etc.
   - Database: Supabase hosting
   - Update API URL in mobile app

4. **Add more features:**
   - Analytics dashboard
   - Push notifications
   - Advanced reports
   - AI advisor

## Troubleshooting

**Backend won't start:**
```
Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
→ Check backend/.env has correct credentials
```

**Mobile can't connect:**
```
Error: Connection refused to http://localhost:4000
→ Use computer IP instead: http://192.168.x.x:4000
```

**Auth fails:**
```
Error: Invalid token
→ Check SUPABASE_SERVICE_ROLE_KEY is correct (not anon key)
```

## Support

- See `BACKEND_SETUP.md` for detailed setup
- See `backend/README.md` for API docs
- Check `backend/migrations/001_initial_schema.sql` for schema

---

**You're ready to build!** 🚀
