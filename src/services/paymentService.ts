import { apiClient } from './apiClient';
import { ApiError } from './ApiError';

export interface CustomerData {
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  shipping?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface PaymentMethodData {
  type: 'card' | 'bank_account' | 'sepa_debit' | 'ideal' | 'sofort';
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  is_default?: boolean;
  metadata?: Record<string, any>;
}

export interface SubscriptionData {
  price_id: string;
  trial_period_days?: number;
  metadata?: Record<string, any>;
}

export interface PaymentIntentData {
  amount: number; // Amount in cents
  currency?: string;
  description?: string;
  payment_method_id?: string;
  return_url?: string;
  metadata?: Record<string, any>;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval?: 'month' | 'year';
  stripe_price_id?: string;
  features: string[];
  limits: {
    projects: number;
    calculations: number;
  };
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
  last_payment_date: string | null;
}

class PaymentService {
  private baseUrl = '/api/payments';

  // Customer Management
  async createCustomer(customerData: CustomerData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customers`, customerData);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to create customer', error);
    }
  }

  async getCustomer() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/customers/me`);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to get customer', error);
    }
  }

  async updateCustomer(updates: CustomerData) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/customers/me`, updates);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to update customer', error);
    }
  }

  // Payment Methods Management
  async createPaymentMethod(paymentMethodData: PaymentMethodData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/payment-methods`, paymentMethodData);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to create payment method', error);
    }
  }

  async getPaymentMethods() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/payment-methods`);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to get payment methods', error);
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to delete payment method', error);
    }
  }

  // Subscription Management
  async createSubscription(subscriptionData: SubscriptionData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/subscriptions`, subscriptionData);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to create subscription', error);
    }
  }

  async getSubscription() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/subscriptions/me`);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to get subscription', error);
    }
  }

  async cancelSubscription(cancelAtPeriodEnd: boolean = true) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/subscriptions/cancel`, {
        cancelAtPeriodEnd
      });
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to cancel subscription', error);
    }
  }

  // Payment Intent Management
  async createPaymentIntent(paymentData: PaymentIntentData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/payment-intents`, paymentData);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to create payment intent', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/payment-intents/${paymentIntentId}/confirm`, {
        payment_method_id: paymentMethodId
      });
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to confirm payment intent', error);
    }
  }

  // Payment History
  async getPayments(limit: number = 10, offset: number = 0) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/payments`, {
        params: { limit: limit.toString(), offset: offset.toString() }
      });
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to get payments', error);
    }
  }

  async getPaymentStatistics(): Promise<PaymentStatistics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/payments/statistics`);
      return response.data.data;
    } catch (error) {
      throw new ApiError('Failed to get payment statistics', error);
    }
  }

  // Refunds
  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/payments/${paymentIntentId}/refunds`, {
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to create refund', error);
    }
  }

  // Pricing
  async getPricing(): Promise<{ tiers: PricingTier[] }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/pricing`);
      return response.data.data;
    } catch (error) {
      throw new ApiError('Failed to get pricing', error);
    }
  }

  // Utility Methods
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents
  }

  formatAmountFromCents(amountInCents: number, currency: string = 'USD'): string {
    return this.formatAmount(amountInCents, currency);
  }

  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  // Subscription Status Helpers
  isSubscriptionActive(status: string): boolean {
    return ['active', 'trialing'].includes(status);
  }

  isSubscriptionCanceled(status: string): boolean {
    return ['canceled', 'past_due', 'unpaid'].includes(status);
  }

  // Payment Status Helpers
  isPaymentSuccessful(status: string): boolean {
    return status === 'succeeded';
  }

  isPaymentFailed(status: string): boolean {
    return ['failed', 'canceled'].includes(status);
  }

  isPaymentPending(status: string): boolean {
    return ['pending', 'processing'].includes(status);
  }

  // Error Handling
  handlePaymentError(error: any): string {
    if (error.code === 'card_declined') {
      return 'Your card was declined. Please try a different payment method.';
    } else if (error.code === 'expired_card') {
      return 'Your card has expired. Please update your payment method.';
    } else if (error.code === 'incorrect_cvc') {
      return 'The security code (CVC) is incorrect. Please check and try again.';
    } else if (error.code === 'insufficient_funds') {
      return 'Your card has insufficient funds. Please try a different payment method.';
    } else if (error.code === 'invalid_expiry_month' || error.code === 'invalid_expiry_year') {
      return 'The expiration date is invalid. Please check and try again.';
    } else if (error.code === 'invalid_number') {
      return 'The card number is invalid. Please check and try again.';
    } else {
      return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Validation Methods
  validateCardNumber(cardNumber: string): boolean {
    // Basic Luhn algorithm validation
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  validateExpiryDate(month: number, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;
    
    return true;
  }

  validateCVC(cvc: string): boolean {
    return /^\d{3,4}$/.test(cvc);
  }

  // Subscription Tier Helpers
  getTierFeatures(tierId: string): string[] {
    const tierFeatures: Record<string, string[]> = {
      free: [
        'Basic load calculations',
        'Up to 3 projects',
        'Standard support'
      ],
      pro: [
        'Advanced load calculations',
        'Unlimited projects',
        'Priority support',
        'Export to PDF',
        'Custom templates'
      ],
      enterprise: [
        'All Professional features',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Dedicated support'
      ]
    };
    
    return tierFeatures[tierId] || [];
  }

  getTierLimits(tierId: string): { projects: number; calculations: number } {
    const tierLimits: Record<string, { projects: number; calculations: number }> = {
      free: { projects: 3, calculations: 10 },
      pro: { projects: -1, calculations: -1 }, // unlimited
      enterprise: { projects: -1, calculations: -1 } // unlimited
    };
    
    return tierLimits[tierId] || { projects: 0, calculations: 0 };
  }

  isUnlimited(limit: number): boolean {
    return limit === -1;
  }
}

export const paymentService = new PaymentService(); 