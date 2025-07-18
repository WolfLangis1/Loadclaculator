# Authentication Setup Guide

This guide explains how to set up authentication for the Load Calculator application with Google Sign-In and guest mode functionality.

## Overview

The authentication system includes:
- Google Sign-In via Firebase Auth
- Guest mode for trying the app without an account
- User data storage in Supabase (PostgreSQL)
- Automatic project sync between local storage and cloud database
- JWT-based session management

## Prerequisites

1. Node.js and npm installed
2. A Google Cloud Console account
3. A Firebase project
4. A Supabase project

## Setup Steps

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google as a sign-in provider
   - Enable Anonymous auth for guest mode
4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll down to "Your apps" and click "Web app"
   - Copy the configuration values

### 2. Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Run the database migration:
   - Go to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL
4. Get your Supabase credentials:
   - Go to Settings → API
   - Copy the Project URL and anon key
   - Copy the service_role key (for backend only)

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API
   - Maps Static API
   - Street View Static API
   - Solar API (if available)
3. Create API credentials:
   - Go to APIs & Services → Credentials
   - Create an API key
   - Restrict the key to your domains

### 4. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all the required values in `.env`:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   
   # Backend-only variables
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET=your_secure_jwt_secret_minimum_32_chars
   
   # Firebase Admin SDK
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### 5. Firebase Admin SDK Setup

1. In Firebase Console, go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract the values for:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 6. Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy the project:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel:
   - Go to your project dashboard
   - Settings → Environment Variables
   - Add all variables from your `.env` file
   - Make sure to set the appropriate visibility (Production/Preview/Development)

## Authentication Flow

### Google Sign-In
1. User clicks "Sign in with Google"
2. Firebase handles OAuth flow
3. App receives Firebase ID token
4. Backend verifies token and creates/updates user in Supabase
5. Backend returns JWT for API authentication
6. Projects sync automatically from local storage to cloud

### Guest Mode
1. User clicks "Continue as Guest"
2. Firebase creates anonymous user
3. Guest can use all features but data is temporary
4. Guest can convert to full account anytime
5. All guest data transfers to the new account

## API Endpoints

The following API endpoints are created for authentication:

- `POST /api/auth/verify` - Verify Firebase token and get app JWT
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project (soft delete)

## Security Considerations

1. **API Keys**: Never commit real API keys to version control
2. **Environment Variables**: Use different keys for development and production
3. **CORS**: Configure allowed origins in production
4. **Rate Limiting**: API includes rate limiting for security
5. **Row Level Security**: Supabase RLS ensures users can only access their own data

## Testing

### Local Development
```bash
npm run dev
```

### With Docker
```bash
docker-compose --profile dev up
```

### Test Authentication
1. Try signing in with Google
2. Test guest mode
3. Convert guest to user
4. Verify projects sync properly

## Troubleshooting

### Firebase Auth Issues
- Ensure Google sign-in is enabled in Firebase Console
- Check that authorized domains include your URLs
- Verify Firebase configuration in `.env`

### Supabase Connection Issues
- Check that all tables were created by the migration
- Verify RLS policies are enabled
- Ensure service key is used for backend operations

### API Key Issues
- Verify all required Google APIs are enabled
- Check API key restrictions match your domains
- Monitor usage in Google Cloud Console

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud APIs](https://console.cloud.google.com/apis)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)