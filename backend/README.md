# MaiCa Backend

Node.js/Express backend for MaiCa business management app with Supabase PostgreSQL and authentication.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
Copy `.env.example` to `.env` and fill in your Supabase credentials

3. **Create Supabase project:**
- Go to https://supabase.com and create a project
- Copy your project URL and Service Role Key
- Run the migration SQL from `migrations/001_initial_schema.sql` in Supabase SQL editor

4. **Run the server:**
```bash
npm start        # production
npm run dev      # development with hot reload
```

Server listens on port 4000 by default.

## API Routes

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/forgot` - Request password reset
- `POST /auth/reset` - Reset password with token
- `POST /auth/logout` - Logout
- `POST /auth/save-push-token` - Save Expo push token

### Products
- `GET /products` - List products (paginated)
- `GET /products/:id` - Get product details
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Product Photos
- `POST /products/:id/photos` - Add photo to product
- `GET /products/:id/photos` - Get product photos
- `DELETE /products/photos/:photoId` - Delete photo

### Analytics
- `GET /analytics/summaries` - Get sales and expense summaries

### Push Notifications
- `POST /push/notify` - Send push notification
