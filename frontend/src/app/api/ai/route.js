import { NextResponse } from 'next/server';
import { getGeminiService } from '../../services/geminiService';

export async function GET(request) {
  try {
    const geminiService = getGeminiService();
    const healthCheck = await geminiService.healthCheck();
    
    return NextResponse.json({
      success: true,
      service: 'gemini',
      ...healthCheck
    });
  } catch (error) {
    console.error('Gemini health check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        service: 'gemini',
        status: 'unhealthy',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { prompt, contextData, options } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const geminiService = getGeminiService();
    const result = await geminiService.generateExplanation(prompt, contextData, options);
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Gemini AI request failed:', error);
    return NextResponse.json(
      { success: false, error: 'AI explanation failed' },
      { status: 500 }
    );
  }
}
