# MaiCa Mobile App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app manages user data (products, sales, expenses) that requires cloud sync and multi-device access.

**Implementation:**
- Use Firebase Authentication with email/password sign-in
- Include "Forgot Password" flow with email verification
- Store auth tokens in AsyncStorage for persistent sessions
- **Login Screen:**
  - MaiCa logo at top (vertically centered when keyboard hidden)
  - Email and password fields with validation
  - "Sign In" primary button
  - "Forgot Password?" link below
  - "Don't have an account? Sign Up" link at bottom
- **Register Screen:**
  - Full name, email, password, confirm password fields
  - Password strength indicator
  - Terms of Service and Privacy Policy checkboxes (placeholder links)
  - "Create Account" primary button
- **Profile/Settings Screen:**
  - User avatar (editable)
  - Display name and email (email read-only)
  - Language preference selector
  - Log out button (with confirmation alert)
  - Delete account option (nested under Advanced Settings with double confirmation)

### Navigation
**Tab Navigation** - The app has 5 core feature areas.

**Structure:**
- **Bottom Tab Bar (5 tabs):**
  1. **Dashboard** - Overview of sales, expenses, and key metrics
  2. **Products** - Product catalog management
  3. **Add** (Center FAB-style) - Quick create action (sales/expense/product)
  4. **Reports** - Tax calculations and business reports
  5. **More** - Settings, AI Advisor, profile, language

**Modal Screens:**
- Add/Edit Product
- Add Sale
- Add Expense
- AI Advisor Chat
- Payment Checkout (webview)

## Screen Specifications

### Dashboard Screen
- **Purpose:** Overview of business performance
- **Layout:**
  - Transparent header with "MaiCa" logo/wordmark (left), notification bell icon (right)
  - Scrollable content area with cards:
    - Summary card (today's sales, expenses, net)
    - Quick actions (3 buttons: Add Sale, Add Expense, View Reports)
    - Recent activity list (last 5 transactions)
- **Safe Area Insets:** 
  - Top: `headerHeight + Spacing.xl`
  - Bottom: `tabBarHeight + Spacing.xl`

### Products Screen
- **Purpose:** View and manage product catalog
- **Layout:**
  - Default navigation header with title "Products" and search icon (right)
  - SearchBar below header (collapsible on scroll)
  - FlatList of product cards with pull-to-refresh
  - Floating "Add Product" button (bottom-right) with shadow
- **Components:**
  - Product card: image thumbnail, name, price, stock level indicator
  - Empty state: "No products yet" with illustration
- **Safe Area Insets:**
  - Top: `Spacing.xl` (has header)
  - Bottom: `tabBarHeight + Spacing.xl + 60` (room for FAB)

### Add/Edit Product Screen (Modal)
- **Purpose:** Create or modify product details
- **Layout:**
  - Modal header with "Cancel" (left), "Add Product" title, "Save" (right)
  - Scrollable form with fields:
    - Product name (required)
    - Category (dropdown)
    - Price (number input)
    - Stock quantity (number input)
    - Description (multiline text)
  - Form uses Zod validation with inline error messages
  - Submit button in header (disabled until valid)
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `insets.bottom + Spacing.xl`

### Sales Screen
- **Purpose:** Record and view sales transactions
- **Layout:**
  - Default header with title "Sales" and filter icon (right)
  - Date range selector (default: today)
  - Scrollable list of sale transactions
  - Floating "Record Sale" button
- **Components:**
  - Sale card: product name, quantity, price, tax amount, total, timestamp
  - Tax badge showing tax percentage
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `tabBarHeight + Spacing.xl + 60`

### Add Sale Screen (Modal)
- **Purpose:** Record a new sale transaction
- **Layout:**
  - Modal header with "Cancel" (left), "Record Sale" title, "Save" (right)
  - Scrollable form:
    - Product selector (searchable dropdown)
    - Quantity (number stepper)
    - Unit price (auto-filled, editable)
    - Tax rate (default 7.5%, editable)
    - Discount (optional, percentage or amount)
    - Calculated total (read-only, prominent)
  - Submit button in header
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `insets.bottom + Spacing.xl`

### Expenses Screen
- **Purpose:** Track business expenses
- **Layout:**
  - Default header with title "Expenses" and filter icon (right)
  - Category filter chips (All, Inventory, Utilities, Salaries, etc.)
  - Scrollable expense list
  - Floating "Add Expense" button
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `tabBarHeight + Spacing.xl + 60`

### Reports Screen
- **Purpose:** View tax calculations and business analytics
- **Layout:**
  - Transparent header with title "Reports" and export icon (right)
  - Scrollable content:
    - Date range selector
    - Summary metrics cards (Total Sales, Total Tax, Net Profit)
    - Tax breakdown chart
    - Export CSV button
- **Safe Area Insets:**
  - Top: `headerHeight + Spacing.xl`
  - Bottom: `tabBarHeight + Spacing.xl`

### More/Settings Screen
- **Purpose:** Access secondary features and settings
- **Layout:**
  - Default header with title "More"
  - Scrollable grouped list:
    - Profile section (avatar, name, email)
    - Features (AI Business Advisor, Subscription)
    - Preferences (Language, Notifications, Theme)
    - Support (Help, Privacy Policy, Terms)
    - Account (Log Out, Delete Account)
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `tabBarHeight + Spacing.xl`

### AI Advisor Screen (Modal)
- **Purpose:** Get business insights from AI
- **Layout:**
  - Modal header with "Close" (left) and "AI Advisor" title
  - Chat interface (scrollable message list)
  - Suggested prompts chips at bottom
  - Text input with send button
- **Components:**
  - User message bubbles (right-aligned, accent color)
  - AI response bubbles (left-aligned, light gray)
  - Loading indicator for responses
- **Safe Area Insets:**
  - Top: `Spacing.xl`
  - Bottom: `insets.bottom + Spacing.xl`

## Design System

### Color Palette
```
Primary (Navy):    #052F5F
Accent (Teal):     #0FB1B7
Surface:           #FFFFFF
Background Light:  #F7F9FC
Background Dark:   #0B2545
Text Primary:      #0B2545
Text Secondary:    #6B7280
Success:           #2E7D32
Warning:           #F59E0B
Error:             #DC2626
Border:            #E5E7EB
```

### Typography
- **Headings:** System font (SF Pro Display on iOS, Roboto on Android)
  - H1: 28px, Bold
  - H2: 22px, Semibold
  - H3: 18px, Semibold
- **Body:** 
  - Regular: 16px, Regular
  - Small: 14px, Regular
  - Caption: 12px, Regular
- **Buttons:** 16px, Semibold

### Spacing Scale
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
```

### Visual Design
- **Cards:**
  - White background with subtle border (#E5E7EB, 1px)
  - Border radius: 12px
  - Padding: Spacing.lg
  - No drop shadow by default
  
- **Buttons:**
  - Primary: Navy background (#052F5F), white text, 12px border radius
  - Secondary: Teal outline (#0FB1B7), teal text, 12px border radius
  - Text button: Teal text, no background
  - Height: 48px minimum for touch target
  - Active state: Reduce opacity to 0.8
  
- **Floating Action Button:**
  - Teal background (#0FB1B7), white icon
  - 56px diameter, circular
  - Position: 16px from right edge, 16px from bottom (above tab bar)
  - Drop shadow specifications:
    - shadowOffset: {width: 0, height: 2}
    - shadowOpacity: 0.10
    - shadowRadius: 2
  
- **Form Inputs:**
  - Border: 1px solid #E5E7EB
  - Border radius: 8px
  - Padding: Spacing.md
  - Focus state: Border color changes to accent (#0FB1B7)
  - Error state: Border color #DC2626 with error text below

- **Icons:**
  - Use Feather icons from @expo/vector-icons
  - Common actions: 24px size
  - Navigation tabs: 26px size
  - Primary color for active states, #6B7280 for inactive

### Required Assets
1. **MaiCa Logo**
   - Square app icon (1024x1024)
   - Horizontal wordmark for headers
   - White version for dark backgrounds
   
2. **Splash Screen**
   - Navy background (#052F5F)
   - Centered white MaiCa logo
   
3. **Empty State Illustrations**
   - "No products" illustration (simple, teal accent)
   - "No sales" illustration
   - "No expenses" illustration
   
4. **Onboarding Graphics** (if needed)
   - 3 simple illustrations showing key features

### Interaction Design
- All touchable elements provide haptic feedback (light impact)
- Press state: Opacity 0.8 for 150ms
- Loading states: Show skeleton screens for lists, spinner for actions
- Pull-to-refresh on all data lists
- Swipe-to-delete on list items
- Offline indicator: Yellow banner at top when disconnected
- Success feedback: Green checkmark toast (3s duration)
- Error feedback: Red banner with retry button

### Accessibility
- Minimum touch target: 48x48px
- Color contrast ratio: 4.5:1 for text, 3:1 for UI elements
- Support dynamic type scaling (up to 200%)
- VoiceOver/TalkBack labels on all interactive elements
- Semantic HTML-like structure for screen readers
- Keyboard navigation support where applicable