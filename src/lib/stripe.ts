import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createSubscription = async (priceId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to subscribe');
      throw new Error('User not authenticated');
    }

    const stripe = await stripePromise;
    if (!stripe) {
      toast.error('Payment system unavailable');
      throw new Error('Stripe failed to load');
    }

    // Create a Checkout Session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        email: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    if (!data.sessionId || !data.url) {
      throw new Error('Invalid session data received');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    toast.error(error.message || 'Failed to process subscription');
    throw error;
  }
};