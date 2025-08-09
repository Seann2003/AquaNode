import { MongoClient } from 'mongodb';

class MongoService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.db;

    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquanode';
      const dbName = process.env.MONGODB_DB_NAME || 'aquanode';

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log('Connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // Workflow CRUD Operations
  async saveWorkflow(workflow) {
    try {
      const db = await this.connect();
      const collection = db.collection('workflows');

      const workflowData = {
        ...workflow,
        updatedAt: new Date(),
        createdAt: workflow.createdAt || new Date(),
      };

      if (workflow.id) {
        // Update existing workflow
        const result = await collection.updateOne(
          { id: workflow.id },
          { $set: workflowData },
          { upsert: true }
        );
        return { ...workflowData, _id: result.upsertedId };
      } else {
        // Create new workflow
        workflowData.id = this.generateWorkflowId();
        const result = await collection.insertOne(workflowData);
        return { ...workflowData, _id: result.insertedId };
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }

  async getWorkflow(workflowId) {
    try {
      const db = await this.connect();
      const collection = db.collection('workflows');
      
      const workflow = await collection.findOne({ id: workflowId });
      return workflow;
    } catch (error) {
      console.error('Failed to get workflow:', error);
      throw error;
    }
  }

  async getAllWorkflows(userId = null) {
    try {
      const db = await this.connect();
      const collection = db.collection('workflows');
      
      const filter = userId ? { userId } : {};
      const workflows = await collection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray();
      
      return workflows;
    } catch (error) {
      console.error('Failed to get workflows:', error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId) {
    try {
      const db = await this.connect();
      const collection = db.collection('workflows');
      
      const result = await collection.deleteOne({ id: workflowId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw error;
    }
  }

  // Workflow Execution History
  async saveExecutionResult(executionResult) {
    try {
      const db = await this.connect();
      const collection = db.collection('executions');

      const executionData = {
        ...executionResult,
        timestamp: new Date(),
      };

      const result = await collection.insertOne(executionData);
      return { ...executionData, _id: result.insertedId };
    } catch (error) {
      console.error('Failed to save execution result:', error);
      throw error;
    }
  }

  async getExecutionHistory(workflowId, limit = 50) {
    try {
      const db = await this.connect();
      const collection = db.collection('executions');
      
      const executions = await collection
        .find({ workflowId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return executions;
    } catch (error) {
      console.error('Failed to get execution history:', error);
      throw error;
    }
  }

  // Template Operations
  async getTemplates() {
    try {
      const db = await this.connect();
      const collection = db.collection('templates');
      
      const templates = await collection.find({ isActive: true }).toArray();
      return templates;
    } catch (error) {
      console.error('Failed to get templates:', error);
      // Return default templates if database fails
      return this.getDefaultTemplates();
    }
  }

  async saveTemplate(template) {
    try {
      const db = await this.connect();
      const collection = db.collection('templates');

      const templateData = {
        ...template,
        updatedAt: new Date(),
        createdAt: template.createdAt || new Date(),
        isActive: true,
      };

      if (template.id) {
        const result = await collection.updateOne(
          { id: template.id },
          { $set: templateData },
          { upsert: true }
        );
        return { ...templateData, _id: result.upsertedId };
      } else {
        templateData.id = this.generateTemplateId();
        const result = await collection.insertOne(templateData);
        return { ...templateData, _id: result.insertedId };
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  }

  // User Preferences
  async saveUserPreferences(userId, preferences) {
    try {
      const db = await this.connect();
      const collection = db.collection('userPreferences');

      const result = await collection.updateOne(
        { userId },
        { 
          $set: { 
            ...preferences, 
            userId, 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );

      return result;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      const db = await this.connect();
      const collection = db.collection('userPreferences');
      
      const preferences = await collection.findOne({ userId });
      return preferences || {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  // Helper Methods
  generateWorkflowId() {
    return 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateTemplateId() {
    return 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDefaultTemplates() {
    return [
      {
        id: 'template-1',
        name: 'Wallet Research & AI Analysis',
        description: 'Research wallet balance and transactions, then get AI explanations',
        chains: ['Sui', 'Oasis Sapphire'],
        blocks: [
          {
            id: 'wallet-balance-1',
            type: 'walletBalance',
            name: 'Get Wallet Balance',
            config: {
              chain: 'Sui',
              walletAddress: '',
              tokenType: 'All Tokens',
              includeStaked: false,
              network: 'testnet'
            }
          },
          {
            id: 'wallet-tx-1',
            type: 'walletTransaction',
            name: 'Get Recent Transactions',
            config: {
              chain: 'Sui',
              walletAddress: '',
              limit: 10,
              timeframe: '24h',
              transactionType: 'All',
              network: 'testnet'
            }
          },
          {
            id: 'ai-analysis-1',
            type: 'aiExplanation',
            name: 'AI Portfolio Analysis',
            config: {
              prompt: 'Analyze the wallet balance and recent transactions. Provide insights on portfolio performance, transaction patterns, and recommendations for optimization.',
              includeContext: true
            }
          }
        ],
        category: 'Analysis',
        isActive: true
      },
      {
        id: 'template-2',
        name: 'Token Research & Conditional Swap',
        description: 'Research token info, check wallet balance, and conditionally swap',
        chains: ['Sui', 'Oasis Sapphire'],
        blocks: [
          {
            id: 'token-info-1',
            type: 'tokenInfo',
            name: 'Get Token Information',
            config: {
              chain: 'Sui',
              tokenAddress: '',
              includePrice: true,
              includeMetrics: true,
              includeHolders: false,
              priceSource: 'CoinGecko',
              network: 'testnet'
            }
          },
          {
            id: 'wallet-balance-2',
            type: 'walletBalance',
            name: 'Check Wallet Balance',
            config: {
              chain: 'Sui',
              walletAddress: '',
              tokenType: 'All Tokens',
              includeStaked: false,
              network: 'testnet'
            }
          },
          {
            id: 'conditional-1',
            type: 'conditional',
            name: 'Check Swap Conditions',
            config: {
              condition: 'Greater Than',
              value: '100',
              field: 'previous.balance.native.formatted'
            }
          },
          {
            id: 'swap-1',
            type: 'swap',
            name: 'Execute Token Swap',
            config: {
              chain: 'Sui',
              fromToken: '',
              toToken: '',
              amount: 10,
              slippage: 1,
              dex: 'Cetus',
              deadline: 20,
              gasLimit: 1000000
            }
          }
        ],
        category: 'Trading',
        isActive: true
      },
      {
        id: 'template-3',
        name: 'Token Research & Conditional Staking',
        description: 'Research token, check wallet balance, conditionally stake, and get AI reasoning',
        chains: ['Sui', 'Oasis Sapphire'],
        blocks: [
          {
            id: 'token-info-2',
            type: 'tokenInfo',
            name: 'Research Token Performance',
            config: {
              chain: 'Sui',
              tokenAddress: '',
              includePrice: true,
              includeMetrics: true,
              priceSource: 'CoinGecko',
              network: 'testnet'
            }
          },
          {
            id: 'wallet-balance-3',
            type: 'walletBalance',
            name: 'Get Current Balance',
            config: {
              chain: 'Sui',
              walletAddress: '',
              tokenType: 'All Tokens',
              includeStaked: true,
              network: 'testnet'
            }
          },
          {
            id: 'conditional-2',
            type: 'conditional',
            name: 'Check Staking Conditions',
            config: {
              condition: 'Greater Than',
              value: '50',
              field: 'previous.balance.native.formatted'
            }
          },
          {
            id: 'stake-1',
            type: 'stake',
            name: 'Execute Staking',
            config: {
              chain: 'Sui',
              tokenAddress: '',
              amount: 25,
              validator: '',
              autoCompound: false,
              minStakeAmount: 1,
              epochDuration: 24
            }
          },
          {
            id: 'ai-reasoning-1',
            type: 'aiExplanation',
            name: 'AI Staking Analysis',
            config: {
              prompt: 'Analyze the staking decision based on token performance and wallet balance. Provide reasoning for the staking strategy and future recommendations.',
              includeContext: true
            }
          }
        ],
        category: 'Staking',
        isActive: true
      },
      {
        id: 'template-4',
        name: 'Charity Donation on Profit',
        description: 'Donate percentage of profits to charity when yield target is hit',
        chains: ['Sui', 'Oasis Sapphire'],
        blocks: [
          {
            id: 'token-info-3',
            type: 'tokenInfo',
            name: 'Check Token Performance',
            config: {
              chain: 'Sui',
              tokenAddress: '',
              includePrice: true,
              includeMetrics: true,
              priceSource: 'CoinGecko',
              network: 'testnet'
            }
          },
          {
            id: 'wallet-balance-4',
            type: 'walletBalance',
            name: 'Get Portfolio Balance',
            config: {
              chain: 'Sui',
              walletAddress: '',
              tokenType: 'All Tokens',
              includeStaked: true,
              network: 'testnet'
            }
          },
          {
            id: 'conditional-3',
            type: 'conditional',
            name: 'Check Profit Threshold',
            config: {
              condition: 'Greater Than',
              value: '5',
              field: 'previous.tokenInfo.price.change24h'
            }
          },
          {
            id: 'ai-charity-1',
            type: 'aiExplanation',
            name: 'Calculate Charity Donation',
            config: {
              prompt: 'Based on the current profit percentage, calculate 5% of the gains for charity donation. Provide a summary of the donation amount, impact, and recommended charity organizations in the crypto/DeFi space.',
              includeContext: true
            }
          },
          {
            id: 'cronjob-1',
            type: 'cronjob',
            name: 'Schedule Profit Check',
            config: {
              interval: 300,
              enabled: true,
              maxRuns: 0
            }
          }
        ],
        category: 'Social Impact',
        isActive: true
      }
    ];
  }

  // Database Health Check
  async healthCheck() {
    try {
      const db = await this.connect();
      await db.admin().ping();
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date() };
    }
  }
}

// Singleton instance
let mongoService = null;

export function getMongoService() {
  if (!mongoService) {
    mongoService = new MongoService();
  }
  return mongoService;
}

export default MongoService;
