import express from 'express';
import { stripeService } from './services/stripeService.js';
import { authenticate, validateInput, rateLimit, requestLogger } from './utils/middleware.js';
import ErrorHandler from './utils/errorHandler.js';
import apiKeyManager from './utils/apiKeyManager.js';

const router = express.Router();

// Apply middleware to all payment routes
router.use(requestLogger);
router.use(rateLimit(30, 60000)); // 30 requests per minute for payment endpoints

// Validation schemas
const createCustomerSchema = (data) => {
  const errors = [];
  const validated = {};

  if (data.phone && typeof data.phone !== 'string') {
    errors.push('Phone must be a string');
  } else if (data.phone) {
    validated.phone = data.phone;
  }

  if (data.address && typeof data.address !== 'object') {
    errors.push('Address must be an object');
  } else if (data.address) {
    validated.address = data.address;
  }

  if (data.shipping && typeof data.shipping !== 'object') {
    errors.push('Shipping must be an object');
  } else if (data.shipping) {
    validated.shipping = data.shipping;
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Metadata must be an object');
  } else if (data.metadata) {
    validated.metadata = data.metadata;
  }

  return {
    isValid: errors.length === 0,
    data: validated,
    errors
  };
};

const createPaymentMethodSchema = (data) => {
  const errors = [];
  const validated = {};

  if (!data.type || !['card', 'bank_account', 'sepa_debit', 'ideal', 'sofort'].includes(data.type)) {
    errors.push('Valid payment method type is required');
  } else {
    validated.type = data.type;
  }

  if (data.type === 'card') {
    if (!data.card || typeof data.card !== 'object') {
      errors.push('Card details are required for card payment method');
    } else {
      validated.card = data.card;
    }
  }

  if (data.billing_details && typeof data.billing_details !== 'object') {
    errors.push('Billing details must be an object');
  } else if (data.billing_details) {
    validated.billing_details = data.billing_details;
  }

  if (data.is_default !== undefined && typeof data.is_default !== 'boolean') {
    errors.push('is_default must be a boolean');
  } else if (data.is_default !== undefined) {
    validated.is_default = data.is_default;
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Metadata must be an object');
  } else if (data.metadata) {
    validated.metadata = data.metadata;
  }

  return {
    isValid: errors.length === 0,
    data: validated,
    errors
  };
};

const createSubscriptionSchema = (data) => {
  const errors = [];
  const validated = {};

  if (!data.price_id || typeof data.price_id !== 'string') {
    errors.push('Valid price_id is required');
  } else {
    validated.price_id = data.price_id;
  }

  if (data.trial_period_days !== undefined) {
    if (typeof data.trial_period_days !== 'number' || data.trial_period_days < 0) {
      errors.push('trial_period_days must be a non-negative number');
    } else {
      validated.trial_period_days = data.trial_period_days;
    }
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Metadata must be an object');
  } else if (data.metadata) {
    validated.metadata = data.metadata;
  }

  return {
    isValid: errors.length === 0,
    data: validated,
    errors
  };
};

const createPaymentIntentSchema = (data) => {
  const errors = [];
  const validated = {};

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Valid amount is required (positive number)');
  } else {
    validated.amount = data.amount;
  }

  if (data.currency && typeof data.currency !== 'string') {
    errors.push('Currency must be a string');
  } else if (data.currency) {
    validated.currency = data.currency.toLowerCase();
  }

  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  } else if (data.description) {
    validated.description = data.description;
  }

  if (data.payment_method_id && typeof data.payment_method_id !== 'string') {
    errors.push('Payment method ID must be a string');
  } else if (data.payment_method_id) {
    validated.payment_method_id = data.payment_method_id;
  }

  if (data.return_url && typeof data.return_url !== 'string') {
    errors.push('Return URL must be a string');
  } else if (data.return_url) {
    validated.return_url = data.return_url;
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Metadata must be an object');
  } else if (data.metadata) {
    validated.metadata = data.metadata;
  }

  return {
    isValid: errors.length === 0,
    data: validated,
    errors
  };
};

// Customer Management Endpoints
router.post('/customers', authenticate, validateInput(createCustomerSchema), async (req, res, next) => {
  try {
    const result = await stripeService.createCustomer(req.userId, req.validatedData);
    
    res.status(201).json({
      success: true,
      data: {
        customer: result.customer,
        stripeCustomerId: result.stripeCustomer.id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/customers/me', authenticate, async (req, res, next) => {
  try {
    const customer = await stripeService.getCustomer(req.userId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

router.put('/customers/me', authenticate, validateInput(createCustomerSchema), async (req, res, next) => {
  try {
    const result = await stripeService.updateCustomer(req.userId, req.validatedData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Payment Methods Endpoints
router.post('/payment-methods', authenticate, validateInput(createPaymentMethodSchema), async (req, res, next) => {
  try {
    const result = await stripeService.createPaymentMethod(req.userId, req.validatedData);
    
    res.status(201).json({
      success: true,
      data: {
        paymentMethod: result.paymentMethod,
        stripePaymentMethodId: result.stripePaymentMethod.id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/payment-methods', authenticate, async (req, res, next) => {
  try {
    const paymentMethods = await stripeService.getPaymentMethods(req.userId);
    
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/payment-methods/:id', authenticate, async (req, res, next) => {
  try {
    const result = await stripeService.deletePaymentMethod(req.userId, req.params.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Subscription Endpoints
router.post('/subscriptions', authenticate, validateInput(createSubscriptionSchema), async (req, res, next) => {
  try {
    const result = await stripeService.createSubscription(req.userId, req.validatedData);
    
    res.status(201).json({
      success: true,
      data: {
        subscription: result.subscription,
        stripeSubscriptionId: result.stripeSubscription.id,
        clientSecret: result.stripeSubscription.latest_invoice?.payment_intent?.client_secret
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/subscriptions/me', authenticate, async (req, res, next) => {
  try {
    const subscription = await stripeService.getSubscription(req.userId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'SUBSCRIPTION_NOT_FOUND',
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
});

router.post('/subscriptions/cancel', authenticate, async (req, res, next) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    const result = await stripeService.cancelSubscription(req.userId, cancelAtPeriodEnd);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Payment Intent Endpoints
router.post('/payment-intents', authenticate, validateInput(createPaymentIntentSchema), async (req, res, next) => {
  try {
    const result = await stripeService.createPaymentIntent(req.userId, req.validatedData);
    
    res.status(201).json({
      success: true,
      data: {
        payment: result.payment,
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/payment-intents/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const { payment_method_id } = req.body;
    
    if (!payment_method_id || typeof payment_method_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Payment method ID is required'
      });
    }

    const result = await stripeService.confirmPaymentIntent(req.params.id, payment_method_id);
    
    res.json({
      success: true,
      data: {
        status: result.status,
        clientSecret: result.client_secret
      }
    });
  } catch (error) {
    next(error);
  }
});

// Payment History Endpoints
router.get('/payments', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_methods (
          id,
          card_brand,
          card_last4,
          type
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw ErrorHandler.handleDatabaseError('get_payments', error);
    }

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

router.get('/payments/statistics', authenticate, async (req, res, next) => {
  try {
    const stats = await stripeService.getPaymentStatistics(req.userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Refund Endpoints
router.post('/payments/:paymentIntentId/refunds', authenticate, async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    
    if (amount && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Amount must be a positive number'
      });
    }

    const refundData = {
      amount,
      reason,
      metadata: { refundedBy: req.userId }
    };

    const result = await stripeService.createRefund(req.params.paymentIntentId, refundData);
    
    res.json({
      success: true,
      data: {
        refundId: result.id,
        amount: result.amount,
        status: result.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// Webhook Endpoint
router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = apiKeyManager.getStripeWebhookSecret();
    
    let event;
    
    try {
      event = stripeService.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        error: 'WEBHOOK_SIGNATURE_VERIFICATION_FAILED',
        message: 'Invalid webhook signature'
      });
    }

    // Process the webhook asynchronously
    stripeService.processWebhook(event).catch(error => {
      console.error('Webhook processing error:', error);
    });

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Pricing Configuration Endpoint
router.get('/pricing', async (req, res, next) => {
  try {
    // This would typically fetch from Stripe Products/Prices API
    // For now, returning a static configuration
    const pricing = {
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          features: [
            'Basic load calculations',
            'Up to 3 projects',
            'Standard support'
          ],
          limits: {
            projects: 3,
            calculations: 10
          }
        },
        {
          id: 'pro',
          name: 'Professional',
          price: 29,
          interval: 'month',
          stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
          features: [
            'Advanced load calculations',
            'Unlimited projects',
            'Priority support',
            'Export to PDF',
            'Custom templates'
          ],
          limits: {
            projects: -1, // unlimited
            calculations: -1
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          interval: 'month',
          stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
          features: [
            'All Professional features',
            'Team collaboration',
            'API access',
            'Custom integrations',
            'Dedicated support'
          ],
          limits: {
            projects: -1,
            calculations: -1
          }
        }
      ]
    };

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
router.use(ErrorHandler.expressErrorHandler());

export default router; 