# MetaAPI Setup Guide - Fix 401 Unauthorized Error

## 🔧 Current Issue
Your system is correctly connecting to MetaAPI but receiving a **401 Unauthorized** error. This means the authentication credentials need to be verified.

## ✅ Step-by-Step Fix

### 1. **Verify MetaAPI Account Status**
- Go to [MetaAPI Dashboard](https://app.metaapi.cloud/)
- Check if your account is active and not suspended
- Ensure your subscription is valid

### 2. **Generate New API Token**
```bash
# Current token in .env.local (might be expired):
METAAPI_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...
```

**Steps to get new token:**
1. Login to MetaAPI dashboard
2. Go to **Settings** → **API Tokens**
3. Click **Generate New Token**
4. Copy the new token
5. Replace in `.env.local`:

```bash
# Replace with your new token
METAAPI_TOKEN=your_new_token_here
METAAPI_ACCOUNT_ID=123501db-b9e1-40b1-9868-d48ab8b2ec8f
```

### 3. **Verify Account ID**
- In MetaAPI dashboard, go to **Accounts**
- Find your MT4/MT5 account
- Copy the exact Account ID (should match what's in .env.local)

### 4. **Check Account Deployment Status**
Your MetaAPI account must be **deployed** and **connected**:
1. Go to MetaAPI dashboard → **Accounts**
2. Check account status should be: ✅ **Deployed** and ✅ **Connected**
3. If not deployed, click **Deploy** button
4. Wait for deployment to complete (can take 1-2 minutes)

### 5. **Test Connection**
After updating credentials, restart your dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

Then test the API:
```bash
curl http://localhost:3000/api/live/metrics
```

### 6. **Common Issues & Solutions**

#### **Token Expired**
- MetaAPI tokens expire after 90 days
- Generate a new token from dashboard

#### **Account Not Deployed**
- Account must be deployed to access via API
- Deploy from MetaAPI dashboard

#### **Wrong Account ID**
- Ensure exact match with MetaAPI dashboard
- Account ID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### **Subscription Issues**
- Check if MetaAPI subscription is active
- Free tier has limitations, consider upgrading

#### **Network/Firewall**
- Ensure your server can reach `mt-client-api-v1.london.agiliumtrade.ai`
- Check firewall settings

### 7. **Verify Fix**
Once credentials are updated, you should see:
```bash
# In terminal logs:
✅ Connected to MetaAPI successfully
📊 Account info fetched: Your Account Name
📈 Historical deals fetched: X
🔄 Open positions fetched: Y
```

Instead of:
```bash
❌ Failed to fetch real MetaAPI data: MetaAPI request failed: 401 Unauthorized
```

## 🎯 Expected Result
After fixing the credentials:
- Dashboard will show **real account balance**
- **Real trade history** from your MT4/MT5
- **Live P&L** updates
- **Actual win rates** calculated from your trades
- **No dummy data** anywhere

## 📞 Need Help?
If issues persist:
1. Check MetaAPI documentation: https://metaapi.cloud/docs/
2. Contact MetaAPI support
3. Verify your MT4/MT5 broker is supported by MetaAPI

## 🔒 Security Note
- Never commit your API tokens to version control
- Keep `.env.local` in `.gitignore`
- Regenerate tokens if compromised
