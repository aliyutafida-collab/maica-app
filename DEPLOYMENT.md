# Deployment Guide

## Backend Deployment (Choose One)

### Heroku (Recommended)
```bash
heroku login
heroku create maica-backend
git push heroku main
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Railway.app
1. Connect GitHub repo
2. Create new service
3. Add environment variables
4. Deploy

### Render.com
1. New Web Service
2. Connect GitHub
3. Set environment variables
4. Deploy

## Database (Supabase)

Supabase automatically hosts your PostgreSQL database.
- URL: Provided in project settings
- Migrations: Already applied to schema
- Backups: Automatic daily

## Mobile App Deployment

### iOS (App Store)
```bash
eas build --platform ios
eas submit --platform ios
```

### Android (Google Play)
```bash
eas build --platform android
eas submit --platform android
```

### Web
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, etc.
```

## Environment Variables (Production)

**Backend:**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MAICA_WEB_URL=https://yourdomain.com
- SMTP_HOST, SMTP_USER, SMTP_PASS (for emails)

**Mobile:**
- EXPO_PUBLIC_API_URL=https://your-backend-url.com
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

---

See `QUICK_START.md` for local development.
