# MaiCa Full-Stack Setup Checklist

## Phase 1: Supabase Database Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy Project URL from Settings → API
- [ ] Copy Service Role Key from Settings → API  
- [ ] Copy Anon Key from Settings → API
- [ ] Go to SQL Editor in Supabase dashboard
- [ ] Copy entire contents of `backend/migrations/001_initial_schema.sql`
- [ ] Paste and Execute in SQL Editor
- [ ] Verify all tables created (check the "Tables" sidebar)

## Phase 2: Backend Configuration

- [ ] `cp backend/.env.example backend/.env`
- [ ] Edit `backend/.env` and fill in:
  - [ ] `SUPABASE_URL=` (from Phase 1)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY=` (from Phase 1)
  - [ ] `PORT=4000`
  - [ ] `MAICA_WEB_URL=http://localhost:3000`
  - [ ] (Optional) Email settings for password resets

## Phase 3: Start Backend Server

- [ ] Navigate to backend: `cd backend`
- [ ] Install dependencies: `npm install`
- [ ] Start server: `npm start`
- [ ] Verify server running: `curl http://localhost:4000/health`
- [ ] Should see: `{"status":"ok"}`

## Phase 4: Mobile App Configuration

- [ ] `cp .env.example .env` (in root directory)
- [ ] Edit `.env` and fill in:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL=` (from Phase 1)
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY=` (from Phase 1)
  - [ ] `EXPO_PUBLIC_API_URL=http://localhost:4000`

## Phase 5: Start Mobile App

- [ ] `npm run dev` (in root directory)
- [ ] Scan QR code with Expo Go (iOS/Android)
- [ ] Or open web version at http://localhost:8081
- [ ] Test app loads without errors

## Phase 6: Test Core Features

- [ ] Register new user account
- [ ] Login with credentials
- [ ] Create first product
- [ ] Add a sale transaction
- [ ] View products in cloud (should persist)
- [ ] Logout and login again (verify data persists)

## Phase 7: (Optional) Email Setup

For password reset emails to work:

**Gmail:**
- [ ] Enable 2-Factor Authentication
- [ ] Generate App Password at [myaccount.google.com](https://myaccount.google.com)
- [ ] Update `backend/.env`:
  - [ ] `SMTP_HOST=smtp.gmail.com`
  - [ ] `SMTP_PORT=587`
  - [ ] `SMTP_USER=your_email@gmail.com`
  - [ ] `SMTP_PASS=your_app_password`
  - [ ] `EMAIL_FROM="MaiCa <noreply@maica.app>"`

## Phase 8: Production Deployment

See `DEPLOYMENT.md` for:
- [ ] Backend deployment (Heroku, Railway, Render)
- [ ] Database (Supabase handles this)
- [ ] Mobile app build (EAS Build)
- [ ] Environment variables for production

## Troubleshooting

**Backend won't start:**
```
Error: Missing SUPABASE_URL
→ Check backend/.env exists and has correct credentials
```

**Mobile can't connect to backend:**
```
Error: Cannot reach http://localhost:4000
→ Use your computer's IP instead: http://192.168.x.x:4000
→ Or ensure backend server is running on port 4000
```

**Auth fails:**
```
Error: Invalid token
→ Verify SUPABASE_SERVICE_ROLE_KEY (not anon key)
→ Check Supabase project settings
```

**Database migration fails:**
```
→ Check all SQL executed without errors in Supabase SQL editor
→ Look for "error" messages in the output
→ Tables may already exist if running migration twice
```

## File Structure

```
maica/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.js      # Auth routes
│   │   │   ├── products.js  # Product CRUD
│   │   │   ├── analytics.js # Analytics
│   │   │   └── push.js      # Push notifications
│   │   ├── utils/           # Helper functions
│   │   │   ├── supabaseClient.js
│   │   │   ├── email.js
│   │   │   └── pushSender.js
│   │   └── index.js         # Express app
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database setup
│   ├── package.json
│   ├── .env                 # Local config (don't commit)
│   └── .env.example
├── app.json                 # Expo config
├── App.tsx                  # React Native entry
├── .env                     # Mobile config (don't commit)
├── .env.example
├── QUICK_START.md           # Quick setup guide
├── BACKEND_SETUP.md         # Detailed backend guide
├── DEPLOYMENT.md            # Production deployment
└── SETUP_CHECKLIST.md       # This file
```

## Next Steps After Setup

1. **Integrate mobile app with backend** - Update auth contexts to use API calls
2. **Test authentication flow** - Register → Login → Logout
3. **Sync products** - Create products via API instead of local storage
4. **Test on device** - Scan QR code with Expo Go
5. **Deploy to production** - See DEPLOYMENT.md

---

**Status:** Backend ready to deploy ✅
**Next:** Complete setup phases 1-4, then test integration
