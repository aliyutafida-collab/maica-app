# MaiCa - Business Management Mobile App

## Overview

MaiCa is a React Native mobile application built with Expo that provides comprehensive business management tools for small and medium-sized enterprises. The app focuses on inventory management, sales tracking, expense recording, tax calculations, and business analytics. It supports multiple languages (English, French, Hausa, Yoruba, Igbo) and offers both free trial and paid subscription tiers with AI-powered business advisory features.

The application is designed for Nigerian small business owners who need simple, accessible tools to manage their operations, track finances, and understand tax obligations. The app features a clean, intuitive interface with full cloud synchronization via a dedicated Node.js/Express backend and Supabase PostgreSQL database.

**Recent Architecture Update (Nov 24, 2025):**
- Migrated from offline-first AsyncStorage to full-stack backend architecture
- Backend: Node.js/Express with Supabase PostgreSQL
- Authentication: Supabase Auth with password reset via email
- Real-time sync across devices with cloud-based data persistence

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Platform**
- **Technology**: Expo SDK ~54.0 with React Native 0.81.5 and React 19.1.0
- **Rationale**: Expo provides a managed workflow that simplifies mobile development, handles native module configuration, and enables rapid iteration. The new architecture is enabled for better performance.
- **Navigation**: React Navigation v7 with bottom tabs and native stack navigators, providing a familiar mobile-first navigation pattern.
- **Styling**: Custom theme system with light/dark mode support, using design tokens for consistency across the app.

**State Management & Context**
- **Approach**: React Context API for global state (Auth, Language, Theme, Subscription)
- **Rationale**: Context API provides sufficient state management for this app's scale without adding Redux complexity. Each context handles a specific concern:
  - `AuthContext`: User authentication, biometric login, and session management
  - `LanguageContext`: Multi-language support with i18n key lookup
  - `ThemeContext`: Light/dark theme switching with system preference detection
  - `SubscriptionContext`: Trial period tracking and feature gating

**UI Component Architecture**
- **Design System**: Custom themed components (ThemedText, ThemedView) that automatically adapt to the active theme
- **Reusable Components**: Screen-level layout components (ScreenScrollView, ScreenKeyboardAwareScrollView, ScreenFlatList) handle safe area insets and keyboard avoidance consistently
- **Animations**: React Native Reanimated v4 for performant animations with spring-based interactions
- **Form Handling**: Custom TextInput component with validation error display

### Authentication & Authorization

**Backend Authentication System**
- **Implementation**: Supabase Auth with email/password and JWT tokens
- **User Data Structure**: Users managed by Supabase Auth, profiles extended in PostgreSQL
- **Password Requirements**: 8+ characters with uppercase, lowercase, number, and special character validation
- **Session Management**: JWT tokens stored in device AsyncStorage with automatic refresh
- **Password Reset**: Email-based token flow with 1-hour expiry via Nodemailer
- **Biometric Support**: Optional fingerprint/face recognition using expo-local-authentication for quick login
- **Multi-Device**: Users can login from multiple devices simultaneously

**Business Setup Flow**
- **Onboarding**: New users must complete a 3-step business setup before accessing the main app:
  1. Business name entry
  2. Product category selection
  3. First product creation
- **Rationale**: Ensures users have initial data to experience the full app functionality immediately

### Data Storage & Persistence

**Cloud-First Architecture with Supabase PostgreSQL**
- **Storage Technology**: Supabase PostgreSQL with REST API layer (Express backend)
- **Data Models**:
  - **profiles**: id, first_name, last_name, push_tokens, subscription_plan, trial_ends_at
  - **products**: id, owner_id, name, category, price, cost_price, qty, description
  - **sales**: id, owner_id, product_id, product_name, quantity, unit_price, tax_rate, discount, tax_amount, total
  - **expenses**: id, owner_id, category, amount, description
  - **product_photos**: id, product_id, url
  - **transactions**: id, owner_id, type, category, amount (unified transaction log)
- **Row Level Security (RLS)**: Enabled to ensure users only access their own data
- **Sync Strategy**: Real-time cloud storage with automatic device sync via REST API calls
- **Offline Support**: Mobile app can cache data locally for offline access and sync when reconnected

### Business Logic & Tax Calculations

**Tax System**
- **Default Tax Rate**: 7.5% (Nigerian VAT)
- **Tax Calculation Functions**:
  - `calcTax()`: Supports both inclusive and exclusive tax calculations
  - `calcTotal()`: Computes final sale amount including tax and discounts
  - `calcSubtotal()`: Calculates line item subtotals
- **Implementation**: Centralized in `lib/tax.ts` for consistent calculations across sales and reports

**Financial Calculations**
- **Sales Tracking**: Automatic total calculation with tax and discount support
- **Stock Management**: Inventory levels updated on product creation/editing
- **Expense Categories**: Predefined categories (Inventory, Utilities, Salaries, Rent, Marketing, Other)
- **Reporting**: Aggregated sales, tax, expense, and profit calculations

### Subscription & Monetization

**Subscription Tiers**
1. **Trial**: 60-day free trial for all new users
2. **Standard** (₦2,500/month): Full inventory, sales, expenses, reports, multi-language
3. **Premium** (₦5,000/month): Standard features + AI Advisor + tax optimization + advanced exports

**Feature Gating**
- `hasFeature()` method checks subscription level before enabling premium features
- Trial period calculated from initial signup date stored in AsyncStorage
- Subscription data stored per-user: `@maica_subscription_{userId}`

### Internationalization (i18n)

**Multi-Language Support**
- **Languages**: English, French, Hausa, Yoruba, Igbo
- **Implementation**: Custom translation system with key-based lookup stored in `lib/translations.ts`
- **Device Detection**: Auto-detects user's device language on first launch using expo-localization
- **Storage**: Selected language persisted to `@maica_language` in AsyncStorage
- **Translation Function**: `t(key, options)` method in LanguageContext for runtime translation

**Design Decision**: Custom i18n implementation rather than a library like react-i18next provides full control over translation structure and reduces bundle size.

### Theme System

**Theme Architecture**
- **Modes**: Light, Dark, System (follows device preference)
- **Color Palette**:
  - Primary: #0B234A (Navy Blue - brand color)
  - Accent: #17AEBF (Teal - brand accent)
  - Semantic colors for success, error, warning states
- **Navigation Integration**: Theme automatically applied to React Navigation's theme object
- **Platform Adaptation**: iOS uses blur effects for tab bar; Android uses solid background

**Accessibility**
- Safe area insets handled consistently via `useScreenInsets` hook
- Dynamic color contrast for text readability
- Gesture handler integration for native feel

## Backend Infrastructure

### Backend Stack
- **Framework**: Express.js (Node.js)
- **Database**: Supabase PostgreSQL with PostGIS and full-text search
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage for product photos
- **Email**: Nodemailer for password resets and notifications
- **Port**: 4000 (development), configurable for deployment

### Backend Routes
- **Auth**: `/auth/register`, `/auth/login`, `/auth/forgot`, `/auth/reset`, `/auth/save-push-token`
- **Products**: `GET/POST/PUT/DELETE /products`, `GET/POST /products/:id/photos`
- **Analytics**: `GET /analytics/summaries`
- **Push Notifications**: `POST /push/notify`

### Database Schema
Located in `backend/migrations/001_initial_schema.sql`
- Automatic UUID generation
- Timestamped records (created_at)
- Indexed columns for performance
- Foreign key constraints with CASCADE delete

## External Dependencies

### Native Features & SDKs

**Expo Modules**
- `expo-local-authentication`: Biometric authentication (fingerprint/face recognition)
- `expo-blur`: iOS blur effects for glass morphism UI
- `expo-haptics`: Tactile feedback for interactions
- `expo-localization`: Device locale detection for auto-language selection
- `expo-web-browser`: In-app browser for payment flows and external links
- `expo-linking`: Deep linking support (scheme: `com.maica.app`)
- `expo-splash-screen`: Branded splash screen with navy blue background

**React Native Core Libraries**
- `@react-native-async-storage/async-storage`: Local data persistence
- `react-native-gesture-handler`: Native gesture system
- `react-native-reanimated`: High-performance animations with worklets
- `react-native-keyboard-controller`: Advanced keyboard management
- `react-native-screens`: Native screen optimization
- `react-native-safe-area-context`: Safe area inset handling

### UI & Interaction Libraries

**Navigation**
- `@react-navigation/native`: Core navigation infrastructure
- `@react-navigation/native-stack`: Native stack navigation
- `@react-navigation/bottom-tabs`: Bottom tab navigation with 5 tabs
- `@react-navigation/elements`: Shared navigation UI components

**UI Components**
- `@expo/vector-icons`: Icon system (Feather icons primary)
- `@react-native-picker/picker`: Native picker for dropdowns (used in expense categories, product selection)
- `expo-symbols`: SF Symbols support for iOS

### Development & Build Tools

**Build Configuration**
- `babel-plugin-module-resolver`: Path aliasing (`@/` prefix for imports)
- `eslint-config-expo`: Expo-specific linting rules
- `eslint-plugin-prettier`: Code formatting integration
- **React Compiler**: Experimental React compiler enabled for optimization

**Platform Targeting**
- iOS: Bundle ID `com.maica.business`, tablet support disabled
- Android: Package name `com.maica.business`, edge-to-edge display, predictive back gesture disabled
- Web: Single-page output with favicon

### Future Integration Points

**Payment Processing**
- Subscription payments planned via webview integration (Paystack or Flutterwave)
- `expo-web-browser` module already included for payment checkout flows

**AI Advisory Features**
- Placeholder AIAdvisorScreen exists for premium tier
- Will require backend API integration for AI model access
- API keys must be stored server-side, not in mobile client

**Backend Sync** (Not Currently Implemented)
- Current architecture is offline-first with local storage only
- Future consideration: Sync to cloud database (Postgres via Drizzle) for multi-device access
- Authentication would need to migrate to proper backend (Firebase, Supabase, or custom)

**Analytics & Monitoring**
- No analytics SDK currently integrated
- Consider adding crash reporting (Sentry) and analytics (Firebase Analytics, Mixpanel)

### Build & Deployment

**Replit Configuration**
- Custom dev script sets `EXPO_PACKAGER_PROXY_URL` and `REACT_NATIVE_PACKAGER_HOSTNAME` for Replit environment
- Static build script in `scripts/build.js` handles Expo web builds with deployment URL injection

**EAS Build Preparation**
- App configured for EAS builds with `newArchEnabled: true`
- Bundle identifiers and package names configured for both platforms
- Adaptive icons and splash screens configured for Android