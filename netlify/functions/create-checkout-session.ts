import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Success' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { priceId, userId, email } = JSON.parse(event.body);

    if (!priceId || !userId || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            priceId: !priceId,
            userId: !userId,
            email: !email
          }
        }),
      };
    }

    // Create or retrieve customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        // Update customer metadata if needed
        if (!customer.metadata.userId) {
          await stripe.customers.update(customer.id, {
            metadata: { userId },
          });
        }
      } else {
        customer = await stripe.customers.create({
          email,
          metadata: {
            userId,
          },
        });
      }
    } catch (error: any) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Failed to create/retrieve customer',
          details: error.message
        }),
      };
    }

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL}/subscription`,
        metadata: {
          userId,
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
        },
        payment_method_collection: 'always',
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          sessionId: session.id,
          url: session.url,
        }),
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: error.message
        }),
      };
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
    };
  }
};

export { handler };