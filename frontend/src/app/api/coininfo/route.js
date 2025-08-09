import { NextResponse } from 'next/server';

// Pool addresses mapping
const POOL_ADDRESSES = {
  eth: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  pepe: '0xcee31c846cbf003f4ceb5bbd234cba03c6e940c7',
  shib: '0x2f62f2b4c5fcd7570a709dec05d68ea19c82a9ec'
};

// The Graph subgraph endpoint (Uniswap V3)
const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin')?.toLowerCase();

    // Validate coin parameter
    if (!coin) {
      return NextResponse.json(
        { error: 'Missing coin parameter. Supported coins: eth, pepe, shib' },
        { status: 400 }
      );
    }

    // Get pool address for the requested coin
    const poolAddress = POOL_ADDRESSES[coin];
    if (!poolAddress) {
      return NextResponse.json(
        { error: `Unsupported coin: ${coin}. Supported coins: ${Object.keys(POOL_ADDRESSES).join(', ')}` },
        { status: 400 }
      );
    }

    // GraphQL query with dynamic pool address
    const query = `
      {
        pool(id: "${poolAddress}") {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          token0Price
          totalValueLockedUSD
        }
        poolDayDatas(
          where: {pool: "${poolAddress}"}
          first: 2
          orderBy: date
          orderDirection: desc
        ) {
          date
          token0Price
          volumeUSD
        }
      }
    `;

    // Fetch data from The Graph
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'Failed to fetch data from subgraph', details: data.errors },
        { status: 500 }
      );
    }

    // Extract and process the data
    const pool = data.data.pool;
    const dayDatas = data.data.poolDayDatas;

    // Check if we have the required data
    if (!pool) {
      return NextResponse.json(
        { error: 'Pool data not found' },
        { status: 404 }
      );
    }

    if (!dayDatas || dayDatas.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient historical data for 24h change calculation' },
        { status: 404 }
      );
    }

    // Calculate 24h percentage change
    const currentPrice = parseFloat(dayDatas[0].token0Price);
    const previousPrice = parseFloat(dayDatas[1].token0Price);
    const priceChange24h = ((currentPrice - previousPrice) / previousPrice) * 100;

    // Prepare the response data
    const responseData = {
      success: true,
      coin: coin.toUpperCase(),
      poolAddress,
      data: {
        pairName: `${pool.token0.symbol}/${pool.token1.symbol}`,
        currentPrice: parseFloat(pool.token0Price),
        priceChange24h: parseFloat(priceChange24h.toFixed(4)),
        volume24h: parseFloat(dayDatas[0].volumeUSD),
        tvl: parseFloat(pool.totalValueLockedUSD)
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching coin info:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET request.' },
    { status: 405 }
  );
}
