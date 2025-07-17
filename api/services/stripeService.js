import Stripe from 'stripe';
import { supabase } from '../utils/db.js';
import ErrorHandler from '../utils/errorHandler.js';
import apiKeyManager from '../utils/apiKeyManager.js';

class StripeService {
  constructor() {
    this.stripe = null;
    this.initializeStripe();
  }

  initializeStripe() {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.log('⚠️ Stripe not configured - payment features disabled');
        this.stripe = null;
        return;
      }
      
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia',
        typescript: true,
      });
      
      console.log('✅ Stripe service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe service:', error.message);
      throw error;
    }
  }

  // Customer Management
  async createCustomer(userId, customerData) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (!user) {
        throw ErrorHandler.createApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      const stripeCustomer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        phone: customerData.phone,
        address: customerData.address,
        shipping: customerData.shipping,
        metadata: {
          userId: userId,
          ...customerData.metadata
        }
      });

      const { data: dbCustomer, error } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: stripeCustomer.id,
          email: user.email,
          name: user.name,
          phone: customerData.phone,
          address: customerData.address,
          shipping: customerData.shipping,
          metadata: customerData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        // Clean up Stripe customer if database insert fails
        await this.stripe.customers.del(stripeCustomer.id);
        throw ErrorHandler.handleDatabaseError('create_stripe_customer', error);
      }

      return {
        customer: dbCustomer,
        stripeCustomer: stripeCustomer
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async getCustomer(userId) {
    try {
      const { data: customer, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw ErrorHandler.handleDatabaseError('get_stripe_customer', error);
      }

      if (!customer) {
        return null;
      }

      // Fetch latest data from Stripe
      const stripeCustomer = await this.stripe.customers.retrieve(customer.stripe_customer_id);
      
      return {
        ...customer,
        stripeCustomer: stripeCustomer
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async updateCustomer(userId, updates) {
    try {
      const { data: customer, error } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (error || !customer) {
        throw ErrorHandler.createApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Update in Stripe
      const stripeCustomer = await this.stripe.customers.update(customer.stripe_customer_id, updates);

      // Update in database
      const { data: updatedCustomer, error: dbError } = await supabase
        .from('stripe_customers')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (dbError) {
        throw ErrorHandler.handleDatabaseError('update_stripe_customer', dbError);
      }

      return {
        customer: updatedCustomer,
        stripeCustomer: stripeCustomer
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  // Payment Methods Management
  async createPaymentMethod(userId, paymentMethodData) {
    try {
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        throw ErrorHandler.createApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      const paymentMethod = await this.stripe.paymentMethods.create({
        type: paymentMethodData.type,
        card: paymentMethodData.card,
        billing_details: paymentMethodData.billing_details,
        metadata: {
          userId: userId
        }
      });

      // Attach to customer
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.stripe_customer_id,
      });

      // Set as default if requested
      if (paymentMethodData.is_default) {
        await this.stripe.customers.update(customer.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      }

      const { data: dbPaymentMethod, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          stripe_payment_method_id: paymentMethod.id,
          type: paymentMethodData.type,
          card_brand: paymentMethod.card?.brand,
          card_last4: paymentMethod.card?.last4,
          card_exp_month: paymentMethod.card?.exp_month,
          card_exp_year: paymentMethod.card?.exp_year,
          billing_details: paymentMethod.billing_details,
          is_default: paymentMethodData.is_default || false,
          metadata: paymentMethodData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        throw ErrorHandler.handleDatabaseError('create_payment_method', error);
      }

      return {
        paymentMethod: dbPaymentMethod,
        stripePaymentMethod: paymentMethod
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async getPaymentMethods(userId) {
    try {
      const { data: paymentMethods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw ErrorHandler.handleDatabaseError('get_payment_methods', error);
      }

      return paymentMethods;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async deletePaymentMethod(userId, paymentMethodId) {
    try {
      const { data: paymentMethod, error } = await supabase
        .from('payment_methods')
        .select('stripe_payment_method_id')
        .eq('id', paymentMethodId)
        .eq('user_id', userId)
        .single();

      if (error || !paymentMethod) {
        throw ErrorHandler.createApiError('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND');
      }

      // Detach from Stripe
      await this.stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);

      // Mark as inactive in database
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId);

      if (updateError) {
        throw ErrorHandler.handleDatabaseError('delete_payment_method', updateError);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  // Subscription Management
  async createSubscription(userId, subscriptionData) {
    try {
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        throw ErrorHandler.createApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      const subscriptionParams = {
        customer: customer.stripe_customer_id,
        items: [{ price: subscriptionData.price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          ...subscriptionData.metadata
        }
      };

      if (subscriptionData.trial_period_days) {
        subscriptionParams.trial_period_days = subscriptionData.trial_period_days;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      const { data: dbSubscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.stripe_customer_id,
          stripe_price_id: subscriptionData.price_id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          quantity: subscription.items.data[0]?.quantity || 1,
          metadata: subscriptionData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        throw ErrorHandler.handleDatabaseError('create_subscription', error);
      }

      return {
        subscription: dbSubscription,
        stripeSubscription: subscription
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async getSubscription(userId) {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw ErrorHandler.handleDatabaseError('get_subscription', error);
      }

      if (!subscription) {
        return null;
      }

      // Fetch latest data from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      
      return {
        ...subscription,
        stripeSubscription: stripeSubscription
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async cancelSubscription(userId, cancelAtPeriodEnd = true) {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !subscription) {
        throw ErrorHandler.createApiError('Active subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
      }

      let stripeSubscription;
      if (cancelAtPeriodEnd) {
        stripeSubscription = await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      } else {
        stripeSubscription = await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
        })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id);

      if (updateError) {
        throw ErrorHandler.handleDatabaseError('cancel_subscription', updateError);
      }

      return { success: true, subscription: stripeSubscription };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  // Payment Intent Management
  async createPaymentIntent(userId, paymentData) {
    try {
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        throw ErrorHandler.createApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      const paymentIntentParams = {
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        customer: customer.stripe_customer_id,
        description: paymentData.description,
        metadata: {
          userId: userId,
          ...paymentData.metadata
        }
      };

      if (paymentData.payment_method_id) {
        paymentIntentParams.payment_method = paymentData.payment_method_id;
        paymentIntentParams.confirm = true;
        paymentIntentParams.return_url = paymentData.return_url;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      const { data: dbPayment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: customer.stripe_customer_id,
          amount: paymentData.amount,
          currency: paymentData.currency || 'usd',
          status: paymentIntent.status,
          description: paymentData.description,
          metadata: paymentData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        throw ErrorHandler.handleDatabaseError('create_payment', error);
      }

      return {
        payment: dbPayment,
        paymentIntent: paymentIntent
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      // Update payment status in database
      const { error } = await supabase
        .from('payments')
        .update({
          status: paymentIntent.status,
          payment_method_id: paymentMethodId
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        throw ErrorHandler.handleDatabaseError('confirm_payment', error);
      }

      return paymentIntent;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  // Webhook Processing
  async processWebhook(event) {
    try {
      // Store webhook event
      const { error: webhookError } = await supabase
        .from('webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          api_version: event.api_version,
          created_at_stripe: new Date(event.created * 1000),
          livemode: event.livemode,
          request_id: event.request,
          request_idempotency_key: event.request_idempotency_key,
          data: event.data
        });

      if (webhookError) {
        throw ErrorHandler.handleDatabaseError('store_webhook_event', webhookError);
      }

      // Process based on event type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark webhook as processed
      await supabase
        .from('webhook_events')
        .update({ processed: true, processed_at: new Date() })
        .eq('stripe_event_id', event.id);

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Update webhook with error
      await supabase
        .from('webhook_events')
        .update({ 
          error_message: error.message,
          retry_count: supabase.raw('retry_count + 1')
        })
        .eq('stripe_event_id', event.id);
      
      throw error;
    }
  }

  // Webhook Event Handlers
  async handlePaymentSucceeded(paymentIntent) {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_payment_succeeded', error);
    }
  }

  async handlePaymentFailed(paymentIntent) {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_payment_failed', error);
    }
  }

  async handleSubscriptionCreated(subscription) {
    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_subscription_created', error);
    }

    // Update user subscription tier
    await this.updateUserSubscriptionTier(subscription.metadata.userId, subscription.status);
  }

  async handleSubscriptionUpdated(subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_subscription_updated', error);
    }

    await this.updateUserSubscriptionTier(subscription.metadata.userId, subscription.status);
  }

  async handleSubscriptionDeleted(subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_subscription_deleted', error);
    }

    // Reset user to free tier
    await this.updateUserSubscriptionTier(subscription.metadata.userId, 'free');
  }

  async handleInvoicePaymentSucceeded(invoice) {
    // Handle successful invoice payment
    console.log('Invoice payment succeeded:', invoice.id);
  }

  async handleInvoicePaymentFailed(invoice) {
    // Handle failed invoice payment
    console.log('Invoice payment failed:', invoice.id);
  }

  async updateUserSubscriptionTier(userId, subscriptionStatus) {
    let tier = 'free';
    
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      // Determine tier based on subscription details
      // This would need to be customized based on your pricing tiers
      tier = 'pro'; // or 'enterprise' based on subscription
    }

    const { error } = await supabase
      .rpc('update_user_subscription_tier', {
        p_user_id: userId,
        p_tier: tier
      });

    if (error) {
      throw ErrorHandler.handleDatabaseError('update_user_subscription_tier', error);
    }
  }

  // Utility Methods
  async getPaymentStatistics(userId) {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_payment_statistics', { p_user_id: userId });

      if (error) {
        throw ErrorHandler.handleDatabaseError('get_payment_statistics', error);
      }

      return stats;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }

  async createRefund(paymentIntentId, refundData) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundData.amount,
        reason: refundData.reason || 'requested_by_customer',
        metadata: refundData.metadata
      });

      // Update payment record
      const { error } = await supabase
        .from('payments')
        .update({
          refunded: true,
          refunded_at: new Date(),
          refund_amount: refundData.amount,
          status: 'refunded'
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) {
        throw ErrorHandler.handleDatabaseError('update_payment_refund', error);
      }

      return refund;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorHandler.handleExternalApiError('Stripe', error);
    }
  }
}

export const stripeService = new StripeService(); 