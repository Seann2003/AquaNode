import { NextResponse } from 'next/server';

// Helper to call The Graph Token API
async function callTokenApi(endpoint, body, apiKey) {
  const url = `https://gateway.thegraph.com/api/${apiKey}/token-api/${endpoint}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.message || `Token API error: ${resp.status}`);
  }
  return data;
}

export async function POST(request) {
  try {
    const { action, params } = await request.json();
    const apiKey = process.env.THE_GRAPH_API_KEY || process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY;

    // Allow dry-run/mock response if not configured
    if (!apiKey) {
      return NextResponse.json({ success: true, data: [], mock: true });
    }

    let data;
    switch (action) {
      case 'balancesByAddress':
        data = await callTokenApi('balances-by-address', params, apiKey);
        break;
      case 'transferEvents':
        data = await callTokenApi('transfer-events', params, apiKey);
        break;
      case 'tokenHolders':
        data = await callTokenApi('token-holders', params, apiKey);
        break;
      case 'tokenMetadata':
        data = await callTokenApi('token-metadata', params, apiKey);
        break;
      case 'liquidityPools':
        data = await callTokenApi('liquidity-pools', params, apiKey);
        break;
      case 'swapEvents':
        data = await callTokenApi('swap-events', params, apiKey);
        break;
      case 'nftActivities':
        data = await callTokenApi('nft-activities', params, apiKey);
        break;
      case 'nftCollection':
        data = await callTokenApi('nft-collection', params, apiKey);
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


