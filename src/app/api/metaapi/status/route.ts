import { NextResponse } from 'next/server';

const token = process.env.METAAPI_TOKEN;
const accountId = process.env.METAAPI_ACCOUNT_ID;

if (!token || !accountId) {
  throw new Error('MetaAPI token and account ID are required.');
}

// MetaAPI Management API base URL (different from trading API)
const METAAPI_MANAGEMENT_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

export async function GET() {
  try {
    console.log('🔄 Checking MetaAPI account status...');
    
    // First, check if the account exists and its status
    const accountResponse = await fetch(`${METAAPI_MANAGEMENT_URL}/users/current/accounts/${accountId}`, {
      headers: {
        'auth-token': token!,
        'Content-Type': 'application/json'
      }
    });

    if (!accountResponse.ok) {
      throw new Error(`Account check failed: ${accountResponse.status} ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    
    console.log('✅ Account found:', accountData);

    return NextResponse.json({
      success: true,
      account: {
        id: accountData._id,
        name: accountData.name,
        login: accountData.login,
        server: accountData.server,
        platform: accountData.platform,
        broker: accountData.brokerName,
        state: accountData.state,
        connectionStatus: accountData.connectionStatus,
        deployed: accountData.state === 'DEPLOYED',
        region: accountData.region
      },
      message: `Account ${accountData.name} is ${accountData.state}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ MetaAPI account check failed:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      suggestions: [
        'Verify your METAAPI_TOKEN is valid and not expired',
        'Check that METAAPI_ACCOUNT_ID is correct',
        'Ensure your account is deployed in MetaAPI dashboard',
        'Verify your account is in the correct region'
      ]
    }, { status: 200 });
  }
}
