
  # FrontDash - Restaurant Ordering & Delivery Platform

  This is a code bundle for Order Confirmation and Payment. The original project is available at https://www.figma.com/design/UivQAfQDqaYs5ItPptIfNR/Order-Confirmation-and-Payment.

  ## Features

  - Customer ordering and payment
  - Restaurant registration and management
  - Admin dashboard for restaurant approvals
  - Staff and driver management
  - Real-time order tracking
  - Multiple payment methods

  ## Quick Start

  ### 1. Install Dependencies

  ```bash
  npm i
  ```

  ### 2. Set Up Supabase (Database)

  FrontDash uses Supabase as its backend database. Follow these steps:

  1. **Install Supabase CLI** (optional but recommended):
     ```bash
     npm install -g supabase
     ```

  2. **Create a Supabase account** at [https://supabase.com](https://supabase.com)

  3. **Create a new project** in your Supabase dashboard

  4. **Get your credentials**:
     - Go to Settings → API
     - Copy your project URL and anon key

  5. **Create `.env` file** in the project root:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

  6. **Set up the database**:
     - In Supabase dashboard, go to SQL Editor
     - Copy and run `supabase-schema.sql`

  For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

  ### 3. Run Development Server

  ```bash
  npm run dev
  ```

  The app will be available at `http://localhost:3000`

  ## Project Structure

  ```
  src/
  ├── components/          # React components
  │   ├── ui/             # Reusable UI components
  │   └── utils/           # Utility components
  ├── lib/                 # Library and services
  │   ├── supabase.ts     # Supabase client configuration
  │   └── services/        # Database and auth services
  ├── styles/              # Global styles
  └── guidelines/          # Development guidelines
  ```

  ## Database Schema

  - **restaurants** - Restaurant information
  - **orders** - Customer orders
  - **order_items** - Order line items
  - **restaurant_registrations** - Partner registrations
  - **staff_members** - Staff accounts
  - **drivers** - Delivery drivers
  - **withdrawal_requests** - Restaurant withdrawals

  ## Available Services

  The project includes pre-built services for:
  - Authentication (auth.ts)
  - Database operations (database.ts)
  - Restaurant management
  - Order processing
  - Staff and driver management

  See `src/lib/services/` for implementation details.

  ## Documentation

  - [Supabase Setup Guide](./SUPABASE_SETUP.md) - Detailed database setup
  - [Development Guidelines](./src/guidelines/Guidelines.md)

  ## Tech Stack

  - **Frontend**: React + TypeScript + Vite
  - **UI**: Tailwind CSS + Radix UI components
  - **Backend**: Supabase (PostgreSQL + Auth + Storage)
  - **State Management**: React Hooks

  ## License

  Private project
  