import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      webhookSecret!
    );

    // Handle subscription events
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'subscription_schedule.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata;

        // Get the price ID to determine the subscription plan
        const priceId = subscription.items.data[0].price.id;
        let plan: 'essential' | 'featured' | 'elite' = 'essential';

        // Map price ID to plan
        if (priceId.includes('featured')) {
          plan = 'featured';
        } else if (priceId.includes('elite')) {
          plan = 'elite';
        }

        // Update vendor subscription in Supabase
        const { error } = await supabase
          .from('vendors')
          .update({
            subscription_plan: plan,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating vendor subscription:', error);
          throw error;
        }

        // Log successful subscription update
        console.log(`Updated subscription for user ${userId} to ${plan} plan`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata;

        // Remove subscription from vendor
        const { error } = await supabase
          .from('vendors')
          .update({
            subscription_plan: null,
            subscription_end_date: null,
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error removing vendor subscription:', error);
          throw error;
        }

        // Log successful subscription removal
        console.log(`Removed subscription for user ${userId}`);
        break;
      }

      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        
        // Log successful checkout
        console.log(`Checkout completed for user ${session.metadata?.userId}`);
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Webhook error',
        details: error.message 
      }),
    };
  }
};

export { handler };