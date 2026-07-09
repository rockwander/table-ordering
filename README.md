# Ramani's Cafe - Table Ordering System

A comprehensive cafe table ordering application built with Next.js, Material-UI, and Supabase.

## Features

### Customer Features
- 📱 QR code scanning to access menu with table context
- 🍽️ Browse menu by categories
- 🛒 Shopping cart with item customization
- 📝 Special instructions for each item
- 📊 Real-time order tracking
- 💰 Bill viewing and request functionality

### Admin Features
- 🔐 Secure authentication
- 📊 Dashboard with order statistics
- 📋 Order management with status updates
- 🍜 Menu management (categories and items)
- 🏷️ QR code generation for tables
- ⚙️ Restaurant settings configuration

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Material-UI
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Authentication**: Supabase Auth
- **QR Codes**: qrcode library

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient)

### 2. Supabase Setup

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API**
3. Copy your **Project URL** and **anon/public key**

### 3. Database Schema Setup

**IMPORTANT: Do this first before running the app!**

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `SUPABASE_SETUP.md` in this project
3. Copy the entire SQL script from the file
4. Paste it into the SQL Editor and click **Run**
5. This will create all necessary tables, indexes, and Row Level Security policies

### 4. Enable Realtime

1. Go to **Database > Replication** in your Supabase dashboard
2. Enable realtime for these tables:
   - `orders`
   - `order_items`
   - `menu_items`
   - `tables`

### 5. Create Admin User

1. Go to **Authentication > Users** in Supabase
2. Click **Add User**
3. Enter email: `admin@ramaniscafe.com` (or your preferred email)
4. Enter a strong password
5. Set **Email Confirm** to Yes
6. Click **Save**

### 6. Environment Setup

The `.env.local` file has already been created with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xjozstiklaqtgdmamfue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9O7ox-EnIsc_E03pGeKHBw_r8I_AGRZ
```

### 7. Install Dependencies

```bash
npm install
```

### 8. Upload Menu Data

**After setting up the database schema**, upload the menu items from the PDF:

```bash
npx tsx scripts/upload-menu.ts
```

This will create all categories and menu items from the Ramani's Cafe menu.

### 9. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### For Admin

1. Navigate to [http://localhost:3000](http://localhost:3000) (will redirect to admin login)
2. Login with your admin credentials
3. You'll see the dashboard with order statistics

#### Managing Tables and QR Codes

1. Go to **QR Codes & Tables** in the sidebar
2. Click **Add Table** to create tables
3. Click **View QR Code** on any table to see/download its QR code
4. Print these QR codes and place them on your restaurant tables
5. Use **Download All QRs** to batch download all table QR codes

#### Managing Menu

1. Go to **Menu Management**
2. Switch between **Categories** and **Menu Items** tabs
3. Add, edit, or delete items as needed
4. Toggle availability for items (items marked unavailable won't show to customers)

#### Managing Orders

1. Go to **Orders** to see all orders
2. Click **View Details** on any order to see items and update status
3. Order statuses: Pending → Confirmed → Preparing → Ready → Served → Bill Requested → Paid
4. Orders update in real-time

#### Restaurant Settings

1. Go to **Settings**
2. Update restaurant name, tax rate, and currency
3. Optionally add a logo URL

### For Customers

1. Scan the QR code on the table (using phone camera)
2. Browser opens with the menu page (table number is automatically detected)
3. Browse menu by categories
4. Click on items to add to cart with quantity and special instructions
5. View cart using the floating cart button
6. Review order and place it
7. Track order status in real-time
8. When order is served, click **Request Bill**
9. Staff will bring the bill to the table

## Project Structure

```
table-ordering/
├── app/
│   ├── admin/              # Admin panel pages
│   │   ├── dashboard/      # Dashboard with statistics
│   │   ├── login/          # Admin login
│   │   ├── menu/           # Menu management
│   │   ├── orders/         # Order management
│   │   ├── settings/       # Restaurant settings
│   │   └── tables/         # Table & QR code management
│   ├── cart/               # Customer cart page
│   ├── menu/               # Customer menu page
│   ├── order/[id]/         # Order tracking page
│   └── page.tsx            # Home page (redirects to admin)
├── components/
│   ├── AdminLayout.tsx     # Admin panel layout
│   ├── Header.tsx          # App header
│   ├── Logo.tsx            # Brand logo component
│   ├── ProtectedRoute.tsx  # Auth protection HOC
│   └── ThemeProvider.tsx   # MUI theme provider
├── contexts/
│   ├── AuthContext.tsx     # Authentication context
│   └── CartContext.tsx     # Shopping cart context
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── theme.ts            # MUI theme configuration
├── scripts/
│   └── upload-menu.ts      # Menu data upload script
├── types/
│   ├── database.ts         # Database type definitions
│   └── index.ts            # App type definitions
└── SUPABASE_SETUP.md       # Database schema SQL
```

## Database Schema

- **tables**: Restaurant tables with QR codes
- **categories**: Menu categories
- **menu_items**: Individual menu items
- **orders**: Customer orders
- **order_items**: Items in each order
- **restaurant_settings**: Restaurant configuration

## Customization

### Branding

1. Update the logo in `components/Logo.tsx`
2. Change colors in `lib/theme.ts`
3. Update restaurant info in **Admin > Settings**

### Menu

1. Use the admin panel to add/edit categories and items
2. Or modify `scripts/upload-menu.ts` and re-run it

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

The QR codes will automatically use your production URL once deployed.

## Troubleshooting

### Database errors
- Make sure you've run the SQL schema from `SUPABASE_SETUP.md`
- Check that realtime is enabled for the necessary tables

### Menu upload fails
- Ensure database schema is created first
- Check that environment variables are set correctly

### Orders not updating in real-time
- Enable realtime replication in Supabase for `orders` and `order_items` tables

### Admin can't login
- Create an admin user in Supabase Authentication
- Make sure email is confirmed

## Support

For issues or questions:
1. Check the Supabase logs in your dashboard
2. Check browser console for errors
3. Review `SUPABASE_SETUP.md` for database schema

## License

MIT

---

**Built with ❤️ for Ramani's Cafe**
