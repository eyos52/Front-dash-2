import { useState, useEffect } from 'react';
import { 
  getRestaurants, 
  getRestaurantById,
  createRestaurantRegistration,
  createOrder,
  createOrderItems,
  getRestaurantRegistrations
} from '../services/database';
import { Restaurant, Order, OrderItem } from '../supabase';

// Hook for fetching restaurants
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        const data = await getRestaurants();
        setRestaurants(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  return { restaurants, loading, error };
}

// Hook for fetching a single restaurant
export function useRestaurant(id: string | null) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchRestaurant() {
      try {
        setLoading(true);
        const data = await getRestaurantById(id);
        setRestaurant(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurant');
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [id]);

  return { restaurant, loading, error };
}

// Hook for submitting orders
export function useSubmitOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = async (orderData: Omit<Order, 'id' | 'created_at'>, items: Omit<OrderItem, 'id'>[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the order first
      const order = await createOrder(orderData);
      
      // Then create the order items
      const orderItems = items.map(item => ({
        ...item,
        order_id: order.id
      }));
      
      await createOrderItems(orderItems);
      
      return order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitOrder, loading, error };
}

// Hook for restaurant registration
export function useRestaurantRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerRestaurant = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const registration = await createRestaurantRegistration(data);
      return registration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register restaurant';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { registerRestaurant, loading, error };
}

