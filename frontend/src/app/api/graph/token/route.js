import { NextResponse } from 'next/server';

// Helper to call The Graph Token API
async function callTokenApi(endpoint, params = {}, apiKey) {
  // Normalize API key: trim and strip leading "Bearer " if present
  const normalizedKey = (apiKey || '').toString().trim().replace(/^Bearer\s+/i, '');
  const url = new URL(`https://token-api.thegraph.com${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  const resp = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${normalizedKey}`,
    },
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
      case 'balancesByAddress': {
        const { address, networkId, limit, page } = params;
        data = await callTokenApi(`/balances/evm/${address}`, {
          network_id: networkId,
          limit,
          page
        }, apiKey);
        break;
      }
      case 'transferEvents': {
        const { networkId, startTime, endTime, orderBy, orderDirection, limit, page, from, to, contract, transactionId } = params;
        data = await callTokenApi('/transfers/evm', {
          network_id: networkId,
          startTime,
          endTime,
          orderBy,
          orderDirection,
          limit,
          page,
          from,
          to,
          contract,
          transaction_id: transactionId
        }, apiKey);
        break;
      }
      case 'tokenHolders': {
        const { contract, networkId, orderBy, orderDirection, limit, page } = params;
        data = await callTokenApi(`/holders/evm/${contract}`, {
          network_id: networkId,
          orderBy,
          orderDirection,
          limit,
          page
        }, apiKey);
        break;
      }
      case 'tokenMetadata': {
        const { contract, networkId } = params;
        data = await callTokenApi(`/tokens/evm/${contract}`, {
          network_id: networkId
        }, apiKey);
        break;
      }
      case 'liquidityPools': {
        const { networkId, limit, page } = params;
        data = await callTokenApi('/pools/evm', {
          network_id: networkId,
          limit,
          page
        }, apiKey);
        break;
      }
      case 'swapEvents': {
        const { networkId, startTime, endTime, orderBy, orderDirection, limit, page } = params;
        data = await callTokenApi('/swaps/evm', {
          network_id: networkId,
          startTime,
          endTime,
          orderBy,
          orderDirection,
          limit,
          page
        }, apiKey);
        break;
      }
      case 'nftActivities': {
        const { networkId, startTime, endTime, orderBy, orderDirection, limit, page } = params;
        data = await callTokenApi('/nft/activities/evm', {
          network_id: networkId,
          startTime,
          endTime,
          orderBy,
          orderDirection,
          limit,
          page
        }, apiKey);
        break;
      }
      case 'nftCollection': {
        const { contract, networkId } = params;
        data = await callTokenApi(`/nft/collections/evm/${contract}`, {
          network_id: networkId
        }, apiKey);
        break;
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


