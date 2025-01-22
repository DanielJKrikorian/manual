import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PricingSection } from '../components/subscription/PricingSection';
import type { SubscriptionPlan } from '../types';
import { supabase } from '../lib/supabase';

const VendorSubscription = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan['id'] | undefined>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to access subscription plans');
        navigate('/vendor/register');
        return;
      }

      // Get current subscription plan
      const { data: vendor } = await supabase
        .from('vendors')
        .select('subscription_plan')
        .eq('user_id', user.id)
        .single();

      if (vendor?.subscription_plan) {
        setCurrentPlan(vendor.subscription_plan as SubscriptionPlan['id']);
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Vendor Profile</h1>
        <p className="text-xl text-gray-600">
          Choose the perfect plan to grow your wedding business
        </p>
      </div>

      <PricingSection currentPlan={currentPlan} />
    </div>
  );
}

export default VendorSubscription;