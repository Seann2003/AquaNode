import { NextResponse } from 'next/server';
import TheGraphService from '../../services/theGraphService.js';

// Initialize service instance
const theGraphService = new TheGraphService();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin');

    // Validate coin parameter
    if (!coin) {
      return NextResponse.json(
        { 
          error: 'Missing coin parameter.',
          supportedCoins: theGraphService.getSupportedCoins(),
          example: '/api/coininfo?coin=eth'
        },
        { status: 400 }
      );
    }

    // Use theGraphService to get coin information
    const coinInfo = await theGraphService.getCoinInfo(coin);
    return NextResponse.json(coinInfo);

  } catch (error) {
    console.error('API Error:', error);
    
    // Return appropriate error response
    const statusCode = error.message.includes('Unsupported coin') || 
                      error.message.includes('Invalid coin') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        supportedCoins: theGraphService.getSupportedCoins(),
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function POST(request) {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use GET request.',
      supportedMethods: ['GET'],
      example: 'GET /api/coininfo?coin=eth'
    },
    { status: 405 }
  );
}
