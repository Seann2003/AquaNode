import SuiService from './suiService';
import OasisService from './oasisService';
import { getGeminiService } from './geminiService';
import axios from 'axios';

class BlockchainService {
  constructor() {
    this.suiService = new SuiService();
    this.oasisService = new OasisService();
    this.services = {
      'Sui': this.suiService,
      'Oasis Sapphire': this.oasisService,
    };
  }

  getService(chain) {
    const service = this.services[chain];
    if (!service) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    return service;
  }

  // Unified Wallet Operations
  async getWalletBalance(chain, address, tokenType = 'All Tokens', tokenAddress = null, options = {}) {
    const service = this.getService(chain);
    if (chain === 'Oasis Sapphire' && typeof service.setNetwork === 'function') {
      service.setNetwork(options.network);
    }
    return await service.getWalletBalance(address, tokenType, tokenAddress);
  }

  async getWalletTransactions(chain, address, limit = 10, transactionType = 'All', options = {}) {
    const service = this.getService(chain);
    if (chain === 'Oasis Sapphire' && typeof service.setNetwork === 'function') {
      service.setNetwork(options.network);
    }
    return await service.getWalletTransactions(address, limit, transactionType);
  }

  async getWalletNFTsAndTokens(chain, address, includeNFTs = true, includeTokens = true, options = {}) {
    const service = this.getService(chain);
    if (chain === 'Oasis Sapphire' && typeof service.setNetwork === 'function') {
      service.setNetwork(options.network);
    }
    return await service.getWalletNFTsAndTokens(address, includeNFTs, includeTokens);
  }

  // Unified Token Operations
  async getTokenInfo(chain, tokenAddress, includePrice = true, includeMetrics = true, options = {}) {
    const service = this.getService(chain);
    if (chain === 'Oasis Sapphire' && typeof service.setNetwork === 'function') {
      service.setNetwork(options.network);
    }
    return await service.getTokenInfo(tokenAddress, includePrice, includeMetrics);
  }

  // Unified Staking Operations
  async stakeTokens(chain, config, userWallet) {
    const service = this.getService(chain);
    return await service.stakeTokens(config, userWallet);
  }

  // Unified Swapping Operations
  async swapTokens(chain, config, userWallet) {
    const service = this.getService(chain);
    return await service.swapTokens(config, userWallet);
  }

  // Cross-chain Price Data (using CoinGecko API)
  async getTokenPrice(tokenSymbol, vsCurrency = 'usd') {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );
      
      return response.data[tokenSymbol] || null;
    } catch (error) {
      console.error('Failed to get token price from CoinGecko:', error);
      return null;
    }
  }

  // The Graph Protocol Integration (for Oasis)
  async queryTheGraph(subgraphUrl, query, variables = {}) {
    try {
      const response = await axios.post(subgraphUrl, {
        query,
        variables,
      });

      return response.data;
    } catch (error) {
      console.error('The Graph query failed:', error);
      throw error;
    }
  }

  // Get token data from The Graph (Oasis)
  async getOasisTokenDataFromGraph(tokenAddress) {
    const query = `
      query GetTokenData($tokenAddress: String!) {
        token(id: $tokenAddress) {
          id
          name
          symbol
          decimals
          totalSupply
          tradeVolume
          tradeVolumeUSD
          txCount
          totalLiquidity
          derivedETH
        }
      }
    `;

    const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/oasis-protocol/sapphire'; // Example URL
    
    try {
      const result = await this.queryTheGraph(subgraphUrl, query, { tokenAddress });
      return result.data?.token;
    } catch (error) {
      console.error('Failed to get Oasis token data from The Graph:', error);
      return null;
    }
  }

  // Multi-chain Portfolio Analysis
  async getPortfolioAnalysis(walletAddresses) {
    try {
      const portfolioData = {};
      
      for (const [chain, address] of Object.entries(walletAddresses)) {
        if (this.services[chain]) {
          portfolioData[chain] = {
            address,
            balance: await this.getWalletBalance(chain, address),
            transactions: await this.getWalletTransactions(chain, address, 5),
          };
        }
      }

      // Calculate total portfolio value (would need price data)
      let totalValue = 0;
      const chainBreakdown = {};

      Object.entries(portfolioData).forEach(([chain, data]) => {
        let chainValue = 0;
        Object.values(data.balance).forEach(token => {
          // In a real implementation, multiply by token price
          chainValue += parseFloat(token.formatted || 0);
        });
        chainBreakdown[chain] = chainValue;
        totalValue += chainValue;
      });

      return {
        totalValue,
        chainBreakdown,
        portfolioData,
        analysis: this.generatePortfolioInsights(portfolioData),
      };
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw error;
    }
  }

  generatePortfolioInsights(portfolioData) {
    const insights = [];
    
    // Analyze transaction patterns
    Object.entries(portfolioData).forEach(([chain, data]) => {
      const recentTxs = data.transactions || [];
      if (recentTxs.length > 0) {
        const avgGasUsed = recentTxs.reduce((sum, tx) => sum + (parseInt(tx.gasUsed) || 0), 0) / recentTxs.length;
        insights.push(`${chain}: Average gas usage is ${avgGasUsed.toFixed(0)} units`);
      }
    });

    // Analyze token diversity
    const totalTokenTypes = Object.values(portfolioData).reduce((sum, data) => {
      return sum + Object.keys(data.balance).length;
    }, 0);
    
    if (totalTokenTypes > 5) {
      insights.push('Portfolio shows good diversification across multiple tokens');
    } else if (totalTokenTypes < 3) {
      insights.push('Consider diversifying across more token types');
    }

    return insights;
  }

  // Workflow Execution Helpers
  async executeWalletBlock(blockConfig) {
    const { chain, walletAddress, tokenType, tokenAddress } = blockConfig;
    
    switch (blockConfig.blockType) {
      case 'walletBalance':
        return await this.getWalletBalance(chain, walletAddress, tokenType, tokenAddress);
      
      case 'walletTransaction':
        return await this.getWalletTransactions(
          chain, 
          walletAddress, 
          blockConfig.limit, 
          blockConfig.transactionType
        );
      
      case 'walletNFT':
        return await this.getWalletNFTsAndTokens(
          chain, 
          walletAddress, 
          blockConfig.includeNFTs, 
          blockConfig.includeTokens
        );
      
      default:
        throw new Error(`Unknown wallet block type: ${blockConfig.blockType}`);
    }
  }

  async executeTokenBlock(blockConfig) {
    const { chain, tokenAddress, includePrice, includeMetrics } = blockConfig;
    return await this.getTokenInfo(chain, tokenAddress, includePrice, includeMetrics);
  }

  async executeStakeBlock(blockConfig, userWallet) {
    const { chain } = blockConfig;
    return await this.stakeTokens(chain, blockConfig, userWallet);
  }

  async executeSwapBlock(blockConfig, userWallet) {
    const { chain } = blockConfig;
    return await this.swapTokens(chain, blockConfig, userWallet);
  }

  // Conditional Logic Helper
  evaluateCondition(condition, value, fieldValue) {
    const numValue = parseFloat(value);
    const numFieldValue = parseFloat(fieldValue);

    switch (condition) {
      case 'Greater Than':
        return numFieldValue > numValue;
      case 'Less Than':
        return numFieldValue < numValue;
      case 'Equal To':
        return numFieldValue === numValue;
      case 'Contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      default:
        return false;
    }
  }

  // AI Integration Helper (Gemini only)
  async generateAIExplanation(prompt, contextData) {
    try {
      const geminiService = getGeminiService();
      const result = await geminiService.generateExplanation(prompt, contextData);
      
      return result;
    } catch (error) {
      console.error('AI explanation generation failed:', error);
      
      // Return fallback response
      return {
        success: false,
        explanation: 'AI analysis is currently unavailable. Please check your Gemini API configuration.',
        insights: [
          'Unable to generate AI insights at this time',
          'Please verify your Gemini API key is configured correctly',
          'Manual analysis of the provided data may be required'
        ],
        recommendations: [
          'Check API configuration and try again',
          'Consider manual analysis of the data',
          'Contact support if the issue persists'
        ],
        confidence: 0,
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

export default BlockchainService;
