# Supabase Setup Guide for FrontDash

This guide will help you set up Supabase for your FrontDash project.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Choose a strong database password (save it securely)
5. Select a region closest to your users
6. Wait for your project to be created (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy your project URL (e.g., `https://xxxxx.supabase.co`)
3. Copy your anon/public key
4. Keep this tab open - you'll need these values

## Step 3: Set Up Environment Variables

1. In your project root directory (`Order Confirmation and Payment/`), create a file named `.env`
2. Add the following content:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the placeholder values with your actual Supabase credentials

## Step 4: Create Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy all the SQL code
4. Paste it into the Supabase SQL Editor
5. Click **Run** to execute the schema
6. You should see "Success. No rows returned" messages

## Step 5: Verify the Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see the following tables created:
   - `restaurants`
   - `orders`
   - `order_items`
   - `restaurant_registrations`
   - `staff_members`
   - `drivers`
   - `withdrawal_requests`
   - `users`

## Step 6: Set Up Storage (for file uploads)

1. In Supabase dashboard, go to **Storage**
2. Create a bucket named `restaurant-assets` with **Public access**
3. Set up the following policies (go to Storage → Policies):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'restaurant-assets');

-- Allow public read access
CREATE POLICY "Public can read files" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-assets');
```

## Step 7: Test the Connection

1. Make sure your `.env` file is created and populated
2. Start your development server:

```bash
npm run dev
```

3. The application should now be connected to Supabase!

## Troubleshooting

### "Failed to fetch" errors
- Check that your `.env` file exists and has the correct values
- Verify that your Supabase project is active
- Make sure there are no extra spaces in your `.env` file

### "relation does not exist" errors
- Make sure you've run the `supabase-schema.sql` file
- Check the Table Editor to verify tables were created

### Authentication errors
- Check that Row Level Security (RLS) is enabled
- Verify that the policies are set up correctly in your SQL schema

## Next Steps

Now that Supabase is set up, you can:

1. **Add sample data** - Insert test restaurants and orders through the Supabase dashboard
2. **Test authentication** - Try logging in with test users
3. **Upload files** - Test the restaurant registration file upload feature
4. **Monitor in real-time** - Watch your Supabase dashboard for database activity

## Database Structure Overview

### Main Tables:
- **restaurants** - Restaurant information and details
- **orders** - Customer orders with payment info
- **order_items** - Individual items in each order
- **restaurant_registrations** - New restaurant partner registrations
- **staff_members** - System administrators and support staff
- **drivers** - Delivery driver information
- **withdrawal_requests** - Restaurant withdrawal requests
- **users** - User accounts (managed by Supabase Auth)

## Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the SQL Editor for any errors
- Verify your project settings in the Supabase dashboard

