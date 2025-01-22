import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSubscription } from '../lib/stripe';
import { toast } from 'react-hot-toast';

// Map subscription plans to Stripe price IDs
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  elite: {
    monthly: 'price_1QjjX3AkjdPARDjPxu1pLYWC',
    yearly: 'price_1QjjXfAkjdPARDjPr6N4GhoY'
  },
  featured: {
    monthly: 'price_1QjjURAkjdPARDjPYhPJVCzU',
    yearly: 'price_1QjjV6AkjdPARDjPo2PNW7a4'
  },
  essential: {
    monthly: 'price_1QjjRHAkjdPARDjPspcn7Y66',
    yearly: 'price_1QjjSUAkjdPARDjP4Pr1di5N'
  }
};

const CheckoutProcess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const plan = searchParams.get('plan');
        const billing = searchParams.get('billing');

        if (!plan || !billing || !STRIPE_PRICE_IDS[plan]) {
          toast.error('Invalid checkout parameters');
          navigate('/subscription');
          return;
        }

        const priceId = STRIPE_PRICE_IDS[plan][billing === 'annual' ? 'yearly' : 'monthly'];
        await createSubscription(priceId);
      } catch (error: any) {
        console.error('Checkout error:', error);
        navigate('/subscription');
      }
    };

    initializeCheckout();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing checkout...</p>
      </div>
    </div>
  );
};

export default CheckoutProcess;