# Stripe Payment Integration Setup Guide

This guide provides step-by-step instructions for implementing Stripe payment processing in the Load Calculator application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Database Migration](#database-migration)
4. [Environment Configuration](#environment-configuration)
5. [API Integration](#api-integration)
6. [Frontend Integration](#frontend-integration)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (test and live)
- Existing Load Calculator application

## Stripe Account Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Access your Stripe Dashboard

### 2. Get API Keys

1. Navigate to **Developers > API keys** in your Stripe Dashboard
2. Copy your **Publishable key** and **Secret key**
3. For webhooks, you'll need the webhook endpoint secret (see Webhook Setup below)

### 3. Create Products and Prices

1. Go to **Products** in your Stripe Dashboard
2. Create products for each subscription tier:

#### Free Tier (No Stripe product needed)
- Name: "Free Plan"
- Features: Basic calculations, 3 projects

#### Professional Tier
- Name: "Professional Plan"
- Price: $29/month
- Billing: Recurring
- Features: Unlimited projects, advanced calculations

#### Enterprise Tier
- Name: "Enterprise Plan"
- Price: $99/month
- Billing: Recurring
- Features: All Professional features + team collaboration

### 4. Webhook Setup

1. Go to **Developers > Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/payments/webhooks`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret

## Database Migration

### 1. Run Migration

Execute the Stripe payment migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/002_stripe_payments.sql
```

### 2. Verify Tables

Check that the following tables were created:
- `stripe_customers`
- `payment_methods`
- `subscriptions`
- `payments`
- `invoice_items`
- `usage_records`
- `webhook_events`

## Environment Configuration

### 1. Update Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Stripe Price IDs (optional)
STRIPE_PRO_PRICE_ID=price_your_pro_tier_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_tier_price_id_here
```

### 2. Install Dependencies

```bash
npm install stripe@^14.18.0
```

## API Integration

### 1. Backend Services

The following services have been implemented:

- **StripeService** (`api/services/stripeService.js`): Core Stripe integration
- **Payment Routes** (`api/payments.js`): REST API endpoints
- **API Key Manager** (`api/utils/apiKeyManager.js`): Extended for Stripe keys

### 2. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/customers` | Create Stripe customer |
| GET | `/api/payments/customers/me` | Get customer data |
| PUT | `/api/payments/customers/me` | Update customer data |
| POST | `/api/payments/payment-methods` | Add payment method |
| GET | `/api/payments/payment-methods` | List payment methods |
| DELETE | `/api/payments/payment-methods/:id` | Remove payment method |
| POST | `/api/payments/subscriptions` | Create subscription |
| GET | `/api/payments/subscriptions/me` | Get subscription |
| POST | `/api/payments/subscriptions/cancel` | Cancel subscription |
| POST | `/api/payments/payment-intents` | Create payment intent |
| POST | `/api/payments/payment-intents/:id/confirm` | Confirm payment |
| GET | `/api/payments/payments` | Payment history |
| GET | `/api/payments/payments/statistics` | Payment statistics |
| POST | `/api/payments/payments/:id/refunds` | Create refund |
| GET | `/api/payments/pricing` | Get pricing tiers |
| POST | `/api/payments/webhooks` | Stripe webhook endpoint |

### 3. Authentication

All payment endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Frontend Integration

### 1. Payment Service

The frontend payment service (`src/services/paymentService.ts`) provides:

- Customer management
- Payment method management
- Subscription management
- Payment processing
- Utility functions for formatting and validation

### 2. Usage Examples

#### Create Customer
```typescript
import { paymentService } from './services/paymentService';

const customerData = {
  phone: '+1234567890',
  address: {
    line1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postal_code: '12345',
    country: 'US'
  }
};

const result = await paymentService.createCustomer(customerData);
```

#### Create Subscription
```typescript
const subscriptionData = {
  price_id: 'price_pro_monthly',
  trial_period_days: 7
};

const result = await paymentService.createSubscription(subscriptionData);
```

#### Process Payment
```typescript
const paymentData = {
  amount: 2900, // $29.00 in cents
  currency: 'usd',
  description: 'Professional Plan Subscription'
};

const result = await paymentService.createPaymentIntent(paymentData);
```

## Testing

### 1. Test Cards

Use Stripe's test card numbers:

| Card Type | Number | CVC | Expiry |
|-----------|--------|-----|--------|
| Visa | 4242424242424242 | Any 3 digits | Any future date |
| Visa (debit) | 4000056655665556 | Any 3 digits | Any future date |
| Mastercard | 5555555555554444 | Any 3 digits | Any future date |
| American Express | 378282246310005 | Any 4 digits | Any future date |

### 2. Test Scenarios

1. **Successful Payment**: Use test card 4242424242424242
2. **Declined Payment**: Use test card 4000000000000002
3. **Insufficient Funds**: Use test card 4000000000009995
4. **Expired Card**: Use test card 4000000000000069
5. **Incorrect CVC**: Use test card 4000000000000127

### 3. Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/payments/webhooks

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Production Deployment

### 1. Environment Variables

Update production environment with live Stripe keys:

```env
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 2. Webhook Configuration

1. Update webhook endpoint URL to production domain
2. Configure webhook events for live mode
3. Test webhook delivery

### 3. SSL/TLS

Ensure your production environment uses HTTPS for all payment-related requests.

### 4. Database Backup

Set up automated backups for payment-related tables:

```sql
-- Example backup strategy
pg_dump -h your-host -U postgres -t stripe_customers -t payments -t subscriptions your_db > payments_backup.sql
```

## Security Considerations

### 1. PCI Compliance

- Never store full card numbers
- Use Stripe Elements for secure card input
- Implement proper access controls
- Regular security audits

### 2. Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper authentication
- Regular security updates

### 3. Error Handling

- Don't expose internal errors to users
- Log security events
- Implement rate limiting
- Monitor for suspicious activity

### 4. Access Control

- Implement role-based access
- Audit payment operations
- Secure admin interfaces
- Regular access reviews

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed

**Cause**: Incorrect webhook secret or request body parsing
**Solution**: 
- Verify webhook secret in environment
- Ensure raw body parsing for webhook endpoint
- Check webhook URL configuration

#### 2. Customer Not Found

**Cause**: Customer not created in Stripe
**Solution**:
- Create customer before payment operations
- Check customer creation in database
- Verify user authentication

#### 3. Payment Method Attach Failed

**Cause**: Invalid payment method or customer
**Solution**:
- Verify payment method creation
- Check customer exists in Stripe
- Validate payment method data

#### 4. Subscription Creation Failed

**Cause**: Invalid price ID or customer
**Solution**:
- Verify price ID exists in Stripe
- Check customer has payment method
- Validate subscription data

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
STRIPE_DEBUG=true
```

### Monitoring

Monitor the following metrics:

- Payment success/failure rates
- Webhook delivery success
- API response times
- Error rates by endpoint
- Subscription conversion rates

### Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

For application-specific issues:
- Check application logs
- Review database transactions
- Verify environment configuration
- Test with Stripe test mode

## Next Steps

1. **UI Components**: Create payment forms and subscription management UI
2. **Analytics**: Implement payment analytics and reporting
3. **Notifications**: Add email notifications for payment events
4. **Refunds**: Implement refund management interface
5. **Invoicing**: Add invoice generation and management
6. **Tax**: Implement tax calculation and collection
7. **Compliance**: Add GDPR and other compliance features

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [PCI Compliance Guide](https://stripe.com/docs/security)
- [Stripe Testing Guide](https://stripe.com/docs/testing) 