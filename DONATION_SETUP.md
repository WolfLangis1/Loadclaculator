# Stripe Donation Setup Guide

This guide explains how to set up the donation functionality for the Load Calculator application.

## Overview

The application includes a donation button that uses Stripe Payment Links for accepting donations. This is a no-code solution that requires minimal setup and provides a secure, professional donation experience.

## Stripe Setup Steps

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification
3. Access your Stripe Dashboard

### 2. Create Payment Link
1. In Stripe Dashboard, go to **Products & Prices** → **Payment Links**
2. Click **"+ New"** to create a new Payment Link
3. Configure the payment link:
   - **Name**: "Support Load Calculator Development"
   - **Description**: "Support the development of this electrical load calculator tool"
   - **Type**: One-time payment
   - **Amount**: You can set fixed amounts like $5, $10, $25, or allow customers to enter custom amounts
   - **Currency**: USD (or your preferred currency)

### 3. Customize Payment Page
1. **Branding**: Upload your logo and choose colors
2. **Checkout Options**:
   - Collect customer's billing address: Optional
   - Collect customer's phone number: Optional
   - Collect customer's name: Recommended
3. **After Payment**: 
   - Success URL: Can redirect back to your application
   - Receipt: Enable automatic email receipts

### 4. Get Payment Link URL
1. After creating the Payment Link, copy the URL
2. It will look like: `https://donate.stripe.com/xxxxxxxxxxxxx`

## Application Configuration

### 1. Environment Variable Setup
1. Copy the Payment Link URL from Stripe
2. Add it to your `.env` file:
   ```
   REACT_APP_STRIPE_DONATION_URL=https://donate.stripe.com/your_actual_payment_link_here
   ```

### 2. For Production Deployment
If deploying to Vercel or other hosting platforms:
1. Go to your hosting platform's environment variables section
2. Add the environment variable:
   - **Name**: `REACT_APP_STRIPE_DONATION_URL`
   - **Value**: Your Stripe Payment Link URL

## Features

### Donation Button
- **Location**: Top navigation bar, positioned before "New" and "Projects" buttons
- **Design**: Heart icon with gradient pink-to-red background
- **Responsive**: Shows text on desktop, icon-only on mobile
- **Tooltip**: Explains the purpose and motivation for donations

### User Experience
- **Message**: "This was developed by 1 person. If you find it resourceful then please consider donating here"
- **Security**: Opens Stripe's secure payment page in a new tab
- **No Account Required**: Supporters can donate without creating accounts
- **Multiple Payment Methods**: Credit cards, digital wallets, etc.

## Testing

### Test Mode
During development, you can:
1. Create a test Payment Link in Stripe Dashboard (Test Mode)
2. Use test credit card numbers provided by Stripe
3. No real charges will be processed

### Test Card Numbers
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 8224 6310 005

## Cost Structure

### Stripe Fees
- **2.9% + 30¢** per successful charge for US cards
- **3.4% + 30¢** per successful charge for international cards
- No monthly fees, setup fees, or minimum requirements

### No Additional Costs
- Payment Links are free to create and use
- No server-side integration costs
- No PCI compliance requirements (handled by Stripe)

## Analytics and Management

### Stripe Dashboard
Access comprehensive analytics:
- Total donation amounts
- Number of supporters
- Payment success rates
- Geographic distribution
- Payment method breakdown

### Export Data
- Download supporter information (with consent)
- Export transaction data for accounting
- Generate tax-related reports

## Security and Trust

### Benefits
- **PCI Compliant**: Stripe handles all security requirements
- **Trusted Brand**: Supporters recognize and trust Stripe
- **Secure Processing**: All payments encrypted and secure
- **Fraud Protection**: Stripe's advanced fraud detection
- **Dispute Management**: Stripe handles chargebacks and disputes

### Privacy
- Supporter payment information never touches your servers
- You only receive donation notifications and basic supporter info
- GDPR and privacy law compliant

## Customization Options

### Different Amounts
You can create multiple Payment Links for different amounts:
- $5 - "Buy me a coffee"
- $10 - "Support development"
- $25 - "Premium support"
- $50 - "Major contributor"

### Recurring Donations
If desired, you can create subscription-based Payment Links for monthly supporters.

## Support

### Stripe Support
- Comprehensive documentation at [docs.stripe.com](https://docs.stripe.com)
- 24/7 chat and email support
- Phone support for verified accounts

### Implementation Support
If you need help implementing this donation system, refer to:
- Component: `src/components/UI/DonationButton.tsx`
- Integration: `src/components/TabbedInterface/TabbedInterface.tsx`
- Environment config: `.env.example`

---

**Note**: This donation system is completely optional and can be easily disabled by removing the `<DonationButton />` components from the TabbedInterface.tsx file.