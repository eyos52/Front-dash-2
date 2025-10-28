# Supabase Setup Checklist

Use this checklist to ensure your FrontDash project is fully set up with Supabase.

## ✅ Completed

### Infrastructure
- [x] Supabase dependencies installed
- [x] Client configuration created (`src/lib/supabase.ts`)
- [x] Database types defined
- [x] Service layer created (`src/lib/services/`)
- [x] Environment setup documented
- [x] SQL schema file created

### Documentation
- [x] README.md updated with Supabase instructions
- [x] SUPABASE_SETUP.md created with detailed guide
- [x] INTEGRATION_EXAMPLE.md created with code examples
- [x] Storage service created for file uploads
- [x] React hooks created for easy integration

## 🔧 Your Next Steps

### 1. Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Sign up for free account
- [ ] Create new project
- [ ] Wait for project initialization

### 2. Get API Credentials
- [ ] Go to Settings → API
- [ ] Copy project URL
- [ ] Copy anon/public key
- [ ] Keep these values secure

### 3. Configure Environment
- [ ] Create `.env` file in project root
- [ ] Add `VITE_SUPABASE_URL` with your project URL
- [ ] Add `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Verify no extra spaces in `.env` file

### 4. Set Up Database
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Open `supabase-schema.sql` file
- [ ] Copy all SQL code
- [ ] Paste into SQL Editor
- [ ] Click Run
- [ ] Verify all tables created in Table Editor

### 5. Set Up Storage
- [ ] Go to Storage in Supabase dashboard
- [ ] Create bucket named `restaurant-assets`
- [ ] Set bucket to public access
- [ ] Configure storage policies (see SUPABASE_SETUP.md)

### 6. Test Connection
- [ ] Run `npm run dev`
- [ ] Check browser console for errors
- [ ] Verify Supabase connection works

### 7. (Optional) Add Sample Data
- [ ] Insert test restaurants
- [ ] Insert test users
- [ ] Test order creation
- [ ] Test admin dashboard

## 📁 Files Created

### Core Files
```
src/lib/
├── supabase.ts              # Supabase client & types
└── services/
    ├── database.ts          # Database operations
    ├── auth.ts              # Authentication
    └── storage.ts            # File uploads
```

### Utility Files
```
src/lib/utils/
└── hooks.ts                 # React hooks for Supabase
```

### Documentation
```
├── README.md                # Updated with Supabase info
├── SUPABASE_SETUP.md        # Detailed setup guide
├── INTEGRATION_EXAMPLE.md   # Code examples
├── supabase-schema.sql      # Database schema
└── SETUP_CHECKLIST.md       # This file
```

## 🔍 Verification

Test that everything works:

1. **Database Connection**
   ```bash
   npm run dev
   # Should run without errors
   ```

2. **Check Network Tab**
   - Open browser dev tools
   - Look for requests to `*.supabase.co`
   - Verify 200 status codes

3. **Test Functions**
   ```typescript
   import { getRestaurants } from './lib/services/database';
   const restaurants = await getRestaurants();
   console.log(restaurants);
   ```

## 🚀 Ready to Use

Once you've completed the checklist:

1. ✅ All dependencies installed
2. ✅ Database schema created
3. ✅ Services and hooks ready
4. ✅ Documentation complete

Your project is ready to integrate with Supabase!

## 📚 Next: Integrate Components

See `INTEGRATION_EXAMPLE.md` for step-by-step guides on:
- Fetching restaurants from database
- Submitting restaurant registrations
- Processing customer orders
- Managing admin dashboard data

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
cd "Order Confirmation and Payment"
npm install
```

### "Invalid API key" error
- Check `.env` file exists
- Verify credentials are correct
- Restart dev server after creating `.env`

### "relation does not exist"
- Run `supabase-schema.sql` in SQL Editor
- Check Table Editor for tables

### "Failed to fetch" errors
- Verify Supabase project is active
- Check network connectivity
- Review browser console for details

## 📞 Need Help?

- Supabase Docs: https://supabase.com/docs
- Example Code: `INTEGRATION_EXAMPLE.md`
- Setup Guide: `SUPABASE_SETUP.md`

