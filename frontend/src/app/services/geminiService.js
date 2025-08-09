import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.');
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.initialized = true;
      console.log('Gemini service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw error;
    }
  }

  async generateExplanation(prompt, contextData = {}, options = {}) {
    try {
      await this.initialize();

      // Build the complete prompt with context
      const fullPrompt = this.buildPrompt(prompt, contextData, options);

      // Generate content using Gemini
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse and structure the response
      const structuredResponse = this.parseResponse(text, prompt, contextData);

      return {
        success: true,
        ...structuredResponse,
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
        tokensUsed: this.estimateTokens(fullPrompt + text),
      };

    } catch (error) {
      console.error('Gemini AI explanation failed:', error);
      
      return {
        success: false,
        error: error.message,
        explanation: 'Failed to generate AI explanation. Please check your Gemini API configuration.',
        insights: [],
        recommendations: [],
        confidence: 0,
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
      };
    }
  }

  buildPrompt(userPrompt, contextData, options = {}) {
    let prompt = `You are an expert DeFi and blockchain analyst. Your task is to analyze the provided data and generate insights.

User Request: ${userPrompt}

`;

    // Add context data if available
    if (contextData && Object.keys(contextData).length > 0) {
      prompt += `Context Data:
${JSON.stringify(contextData, null, 2)}

`;
    }

    // Add specific instructions
    prompt += `Please provide your analysis in the following format:

EXPLANATION:
[Provide a clear, comprehensive explanation addressing the user's request]

INSIGHTS:
[List 3-5 key insights from the data analysis]
- Insight 1
- Insight 2
- Insight 3

RECOMMENDATIONS:
[Provide 3-5 actionable recommendations based on your analysis]
- Recommendation 1
- Recommendation 2
- Recommendation 3

CONFIDENCE:
[Rate your confidence in this analysis from 0.0 to 1.0]

Focus on:
- DeFi protocols and strategies
- Risk assessment and management
- Market trends and opportunities
- Portfolio optimization
- Gas optimization and cost efficiency
- Cross-chain opportunities

Keep your response practical, actionable, and focused on the Web3/DeFi context.`;

    return prompt;
  }

  parseResponse(text, originalPrompt, contextData) {
    try {
      // Extract sections using regex patterns
      const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*?)(?=INSIGHTS:|$)/i);
      const insightsMatch = text.match(/INSIGHTS:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
      const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i);
      const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/i);

      // Parse insights and recommendations into arrays
      const insights = this.parseListItems(insightsMatch?.[1] || '');
      const recommendations = this.parseListItems(recommendationsMatch?.[1] || '');

      return {
        explanation: (explanationMatch?.[1] || text).trim(),
        insights: insights.length > 0 ? insights : this.generateFallbackInsights(contextData),
        recommendations: recommendations.length > 0 ? recommendations : this.generateFallbackRecommendations(),
        confidence: parseFloat(confidenceMatch?.[1] || '0.8'),
        rawResponse: text,
      };

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      
      return {
        explanation: text || 'Analysis completed successfully.',
        insights: this.generateFallbackInsights(contextData),
        recommendations: this.generateFallbackRecommendations(),
        confidence: 0.7,
        rawResponse: text,
      };
    }
  }

  parseListItems(text) {
    if (!text) return [];
    
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))
      .map(line => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
      .filter(line => line.length > 0)
      .slice(0, 5); // Limit to 5 items
  }

  generateFallbackInsights(contextData) {
    const insights = [];
    
    if (contextData.balance) {
      insights.push('Portfolio balance analysis shows current token distribution');
    }
    
    if (contextData.transactions) {
      insights.push('Recent transaction patterns indicate active trading behavior');
    }
    
    if (contextData.tokenInfo) {
      insights.push('Token metrics suggest market volatility considerations');
    }

    if (insights.length === 0) {
      insights.push('Data analysis completed with available information');
    }

    return insights;
  }

  generateFallbackRecommendations() {
    return [
      'Monitor portfolio performance regularly',
      'Consider diversification across multiple chains',
      'Optimize gas usage for cost efficiency',
      'Stay updated with market trends and opportunities'
    ];
  }

  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Specialized methods for different types of analysis
  async analyzePortfolio(portfolioData) {
    const prompt = `Analyze this DeFi portfolio and provide insights on performance, risk, and optimization opportunities.`;
    return await this.generateExplanation(prompt, portfolioData);
  }

  async analyzeToken(tokenData) {
    const prompt = `Analyze this token's metrics, price action, and provide trading/investment insights.`;
    return await this.generateExplanation(prompt, tokenData);
  }

  async analyzeTransactions(transactionData) {
    const prompt = `Analyze these blockchain transactions and identify patterns, risks, and optimization opportunities.`;
    return await this.generateExplanation(prompt, transactionData);
  }

  async generateTradingStrategy(marketData) {
    const prompt = `Based on this market data, suggest a DeFi trading strategy with risk management considerations.`;
    return await this.generateExplanation(prompt, marketData);
  }

  async explainDeFiConcept(concept, contextData = {}) {
    const prompt = `Explain the DeFi concept "${concept}" in simple terms and how it applies to the current context.`;
    return await this.generateExplanation(prompt, contextData);
  }

  // Health check method
  async healthCheck() {
    try {
      await this.initialize();
      
      const testResult = await this.model.generateContent('Hello, this is a test. Please respond with "Gemini service is working correctly."');
      const response = await testResult.response;
      const text = response.text();
      
      return {
        status: 'healthy',
        model: 'gemini-pro',
        response: text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Singleton instance
let geminiService = null;

export function getGeminiService() {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
}

export default GeminiService;
