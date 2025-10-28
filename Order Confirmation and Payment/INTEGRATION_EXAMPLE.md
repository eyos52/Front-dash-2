# Supabase Integration Examples

This guide shows how to integrate Supabase into your existing components.

## Example 1: Fetching Restaurants

Replace the hardcoded restaurant data with real database queries:

```typescript
import { useRestaurants } from '../lib/utils/hooks';

function LandingPage() {
  const { restaurants, loading, error } = useRestaurants();

  if (loading) return <div>Loading restaurants...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {restaurants.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
```

## Example 2: Submitting Restaurant Registration

Update `RestaurantRegistration.tsx` to save to the database:

```typescript
import { useRestaurantRegistration } from '../lib/utils/hooks';
import { uploadFile } from '../lib/services/storage';

function RestaurantRegistration({ onNavigateHome, onNavigateLogin }) {
  const { registerRestaurant, loading, error } = useRestaurantRegistration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    try {
      // Upload menu file to Supabase Storage
      let menuFileUrl = '';
      if (menuFile) {
        menuFileUrl = await uploadFile('restaurant-assets', menuFile);
      // URL will be: https://your-project.supabase.co/storage/v1/object/public/restaurant-assets/filename.pdf
      }

      // Upload logo file (optional)
      let logoFileUrl = '';
      if (logoFile) {
        logoFileUrl = await uploadFile('restaurant-assets', logoFile);
      }

      // Register the restaurant in database
      await registerRestaurant({
        restaurant_name: formData.restaurantName,
        owner_first_name: formData.firstName,
        owner_last_name: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        cuisine_type: formData.cuisineType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        description: formData.description,
        opening_time: formData.openingTime,
        closing_time: formData.closingTime,
        menu_file_url: menuFileUrl,
        logo_file_url: logoFileUrl
      });

      toast.success('Registration submitted successfully!');
      setShowSuccess(true);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  // ... rest of component
}
```

## Example 3: Processing Orders

Update `OrderConfirmation.tsx` to save orders to the database:

```typescript
import { useSubmitOrder } from '../lib/utils/hooks';
import { supabase } from '../lib/supabase';

function OrderConfirmation({ onOrderComplete, cart, clearCart }) {
  const { submitOrder, loading: orderLoading } = useSubmitOrder();
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Generate unique order number
      const orderNumber = `FD${Date.now().toString().slice(-6)}`;
      
      // Get current user (or create guest user)
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || 'guest-' + Date.now();

      // Prepare order data
      const orderData = {
        customer_id: customerId,
        restaurant_id: cart.restaurant.id,
        order_number: orderNumber,
        status: 'pending',
        delivery_address: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        zip_code: shippingDetails.zipCode,
        phone: shippingDetails.phone,
        email: customerEmail,
        subtotal,
        delivery_fee: 2.99,
        service_charge: subtotal * 0.0825,
        tax: subtotal * 0.08,
        total: subtotal + 2.99 + (subtotal * 0.0825) + (subtotal * 0.08),
        payment_method: paymentMethod,
        estimated_delivery: new Date(Date.now() + 35 * 60 * 1000).toISOString()
      };

      // Prepare order items
      const orderItems = cart.items.map(item => ({
        item_name: item.name,
        item_id: item.id,
        price: item.price,
        quantity: item.quantity
      }));

      // Submit order to database
      const order = await submitOrder(orderData, orderItems);
      
      setOrderConfirmed(true);
      clearCart();
      
      if (onOrderComplete) {
        onOrderComplete(order);
      }

    } catch (error) {
      toast.error('Failed to process order. Please try again.');
    }
  };

  // ... rest of component
}
```

## Example 4: Admin Dashboard - Fetching Registrations

Update `FrontDashAdmin.tsx` to use real data:

```typescript
import { useEffect, useState } from 'react';
import { getRestaurantRegistrations, updateRestaurantRegistrationStatus } from '../lib/services/database';
import { RestaurantRegistration } from '../lib/supabase';

function FrontDashAdmin() {
  const [registrations, setRegistrations] = useState<RestaurantRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
    try {
      const data = await getRestaurantRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApproveRegistration = async (id: string) => {
    if (confirm('Are you sure you want to approve this restaurant registration?')) {
      try {
        // Get current user ID for reviewer tracking
        const { data: { user } } = await supabase.auth.getUser();
        const reviewerId = user?.id || 'system';

        await updateRestaurantRegistrationStatus(id, 'approved', reviewerId);
        await fetchRegistrations(); // Refresh list
        toast.success('Restaurant registration approved successfully!');
      } catch (error) {
        toast.error('Failed to approve registration');
      }
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (confirm('Are you sure you want to reject this restaurant registration?')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const reviewerId = user?.id || 'system';

        await updateRestaurantRegistrationStatus(id, 'rejected', reviewerId);
        await fetchRegistrations();
        toast.success('Restaurant registration rejected.');
      } catch (error) {
        toast.error('Failed to reject registration');
      }
    }
  };

  // ... rest of component
}
```

## Example 5: Storage for File Uploads

Add this service for handling file uploads:

```typescript
// src/lib/services/storage.ts
import { supabase } from '../supabase';

export async function uploadFile(bucket: string, file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteFile(bucket: string, fileName: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) throw error;
}
```

## Next Steps

1. **Start with one component** - Integrate Supabase into `LandingPage` first
2. **Test thoroughly** - Make sure data flows correctly
3. **Gradually migrate** - Move other components to use database
4. **Add real-time** - Use Supabase Realtime for order status updates
5. **Implement authentication** - Replace mock login with Supabase Auth

