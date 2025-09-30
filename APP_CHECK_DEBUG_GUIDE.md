# Firebase App Check Debug Guide

## 🚨 Current Status
- **Server**: Strict validation enabled (will block requests without valid tokens)
- **Client**: Enhanced token generation with better error handling
- **Debug Page**: Available at `/debug-appcheck`

## 🔍 Step-by-Step Debugging Process

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Look for these messages:
   - ✅ `"Initializing Firebase App Check with site key: [your-key]"`
   - ✅ `"Firebase App Check initialized successfully"`
   - ❌ Any error messages about App Check initialization

### Step 2: Test Token Generation
1. Visit `/debug-appcheck` on your site
2. Click "Check Token" button
3. Look for these results:
   - ✅ **Token Available**: Shows token details and expiration
   - ❌ **No Token**: Shows error message

### Step 3: Test API Calls
1. On the debug page, click "Test API Calls"
2. Check the results:
   - ✅ **Success**: Both GET and POST requests return 200
   - ❌ **403 Error**: Server is blocking requests (expected if no token)

### Step 4: Check Network Tab
1. Open Developer Tools → Network tab
2. Make an API call
3. Look for the `X-Firebase-AppCheck` header in the request
4. Check if the header is present and has a value

## 🛠️ Common Issues & Solutions

### Issue 1: "Firebase App Check not available"
**Symptoms**: Console shows "Firebase not available on window object"
**Solutions**:
- Check if Firebase is properly loaded
- Verify the Firebase script is included
- Check for JavaScript errors preventing Firebase initialization

### Issue 2: "No token available"
**Symptoms**: Debug page shows "No token available"
**Solutions**:
- Check reCAPTCHA v3 configuration
- Verify site key is correct in `keys.js`
- Check if domain is registered in Firebase Console
- Ensure reCAPTCHA v3 is enabled for your domain

### Issue 3: "App Check validation failed"
**Symptoms**: API calls return 403 with "Missing App Check token"
**Solutions**:
- Client is not sending tokens (check Step 4 above)
- Server is correctly blocking requests without tokens
- This is expected behavior when tokens aren't being sent

### Issue 4: reCAPTCHA v3 Errors
**Symptoms**: Console shows reCAPTCHA-related errors
**Solutions**:
- Verify reCAPTCHA v3 is enabled in Google Console
- Check domain registration in reCAPTCHA settings
- Ensure site key matches between Firebase and reCAPTCHA

## 🔧 Firebase Console Configuration

### 1. Enable App Check
1. Go to Firebase Console → App Check
2. Click "Get started" if not already enabled
3. Register your web app
4. Select "reCAPTCHA v3" as provider
5. Enter your reCAPTCHA v3 site key

### 2. Configure reCAPTCHA v3
1. Go to Google reCAPTCHA Console
2. Create a new site or edit existing
3. Select "reCAPTCHA v3"
4. Add your domain (e.g., `code4community.net`)
5. Copy the site key to `keys.js`

### 3. Verify Configuration
- Site key in `keys.js` matches reCAPTCHA Console
- Domain is registered in both Firebase and reCAPTCHA
- App Check is enabled in Firebase Console

## 🧪 Testing Commands

### Test API Endpoint Directly
```bash
# This should return 403 (expected)
curl -X GET https://code4community.net/api/test-appcheck

# This should also return 403 (expected)
curl -X POST https://code4community.net/api/test-appcheck \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test with App Check Token (if you have one)
```bash
# Replace YOUR_TOKEN with actual App Check token
curl -X GET https://code4community.net/api/test-appcheck \
  -H "X-Firebase-AppCheck: YOUR_TOKEN"
```

## 📊 Expected Behavior

### ✅ Working Correctly
- Console shows App Check initialization success
- Debug page shows token available
- API calls include `X-Firebase-AppCheck` header
- API calls return 200 status with token validation

### ❌ Not Working
- Console shows App Check initialization errors
- Debug page shows "No token available"
- API calls missing `X-Firebase-AppCheck` header
- API calls return 403 (expected if no token)

## 🚀 Next Steps

1. **Check Console**: Look for initialization messages
2. **Test Debug Page**: Visit `/debug-appcheck`
3. **Verify Configuration**: Check Firebase and reCAPTCHA settings
4. **Test API Calls**: Use the debug page to test
5. **Check Network**: Verify headers are being sent

## 📞 If Still Not Working

If you're still having issues after following this guide:

1. **Share Console Logs**: Copy all console messages
2. **Share Debug Page Results**: Screenshot the debug page
3. **Check Firebase Console**: Verify App Check is enabled
4. **Verify reCAPTCHA**: Check domain registration

The most common issue is reCAPTCHA v3 not being properly configured for your domain.
