# Firebase App Check Setup Guide

## What is Firebase App Check?

Firebase App Check helps protect your Firebase resources from abuse by verifying that requests come from your legitimate app. Without App Check, anyone with your Firebase API keys can make requests to your database.

## Current Security Status

✅ **You have:**
- Firestore Security Rules (require authentication)
- Content Security Policy headers
- Rate limiting middleware

❌ **You need:**
- Firebase App Check (verifies requests come from your app)

## Setup Steps

### 1. Enable App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`brhs25`)
3. Go to **App Check** in the left sidebar
4. Click **Get Started**

### 2. Register Your Web App

1. In App Check, click **Register app**
2. Select **Web** platform
3. Enter your app nickname: `BRHS Math Lab Web`
4. Click **Register**

### 3. Set Up reCAPTCHA v3

1. In the App Check dashboard, click on your web app
2. Click **Manage** next to reCAPTCHA v3
3. Go to [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
4. Click **+** to create a new site
5. Enter:
   - **Label**: `BRHS Math Lab`
   - **reCAPTCHA type**: `reCAPTCHA v3`
   - **Domains**: 
     - `localhost` (for development)
     - `your-production-domain.com` (replace with your actual domain)
6. Click **Submit**
7. Copy the **Site Key**

### 4. Add Environment Variables

Add to your `.env.local` file:
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

Add to your Vercel environment variables:
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = your site key

### 5. Deploy and Test

1. Deploy your app to production
2. Test that everything still works
3. Check Firebase Console → App Check → Metrics to see requests being verified

## Security Benefits

With App Check enabled:
- ✅ Only requests from your legitimate app can access Firebase
- ✅ API key abuse is prevented
- ✅ Bot attacks are blocked
- ✅ Your database is much more secure

## Development vs Production

- **Development**: App Check is disabled (allows local testing)
- **Production**: App Check is enforced (blocks unauthorized requests)

## Troubleshooting

If you get "App Check token verification failed":
1. Make sure reCAPTCHA site key is correct
2. Make sure your domain is registered in reCAPTCHA
3. Check that App Check is enabled in Firebase Console

## Next Steps

1. Complete the setup above
2. Test in production
3. Monitor App Check metrics in Firebase Console
4. Your database will be much more secure! 🔒
