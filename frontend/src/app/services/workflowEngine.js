import BlockchainService from './blockchainService';

class WorkflowEngine {
  constructor() {
    this.blockchainService = new BlockchainService();
    this.executionContext = {};
    this.isRunning = false;
  }

  async executeWorkflow(workflow, userWallets = {}) {
    if (this.isRunning) {
      throw new Error('Workflow is already running');
    }

    this.isRunning = true;
    this.executionContext = {
      workflowId: workflow.id,
      startTime: Date.now(),
      results: {},
      errors: [],
      userWallets,
    };

    try {
      console.log(`Starting workflow execution: ${workflow.name}`);
      
      const results = [];
      
      for (let i = 0; i < workflow.blocks.length; i++) {
        const block = workflow.blocks[i];
        
        try {
          console.log(`Executing block ${i + 1}/${workflow.blocks.length}: ${block.name}`);
          
          const blockResult = await this.executeBlock(block, this.executionContext);
          
          results.push({
            blockId: block.id,
            blockName: block.name,
            blockType: block.type,
            status: 'success',
            result: blockResult,
            executionTime: Date.now() - this.executionContext.startTime,
          });

          // Store result in context for next blocks
          this.executionContext.results[block.id] = blockResult;

          // Check if this is a conditional block and handle branching
          if (block.type === 'conditional') {
            const shouldContinue = this.evaluateConditional(block, blockResult);
            if (!shouldContinue) {
              console.log('Conditional block failed, stopping workflow execution');
              break;
            }
          }

        } catch (error) {
          console.error(`Block execution failed: ${block.name}`, error);
          
          results.push({
            blockId: block.id,
            blockName: block.name,
            blockType: block.type,
            status: 'error',
            error: error.message,
            executionTime: Date.now() - this.executionContext.startTime,
          });

          this.executionContext.errors.push({
            blockId: block.id,
            error: error.message,
          });

          // Stop execution on error (could be configurable)
          break;
        }
      }

      const executionSummary = {
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: this.executionContext.errors.length > 0 ? 'partial_success' : 'success',
        totalBlocks: workflow.blocks.length,
        successfulBlocks: results.filter(r => r.status === 'success').length,
        failedBlocks: results.filter(r => r.status === 'error').length,
        totalExecutionTime: Date.now() - this.executionContext.startTime,
        results,
        errors: this.executionContext.errors,
        timestamp: new Date().toISOString(),
      };

      console.log('Workflow execution completed:', executionSummary);
      return executionSummary;

    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.executionContext = {};
    }
  }

  async executeBlock(block, context) {
    const startTime = Date.now();
    
    try {
      let result;

      switch (block.type) {
        case 'walletBalance':
          result = await this.executeWalletBalanceBlock(block, context);
          break;
          
        case 'walletTransaction':
          result = await this.executeWalletTransactionBlock(block, context);
          break;
          
        case 'walletNFT':
          result = await this.executeWalletNFTBlock(block, context);
          break;
          
        case 'tokenInfo':
          result = await this.executeTokenInfoBlock(block, context);
          break;
          
        case 'conditional':
          result = await this.executeConditionalBlock(block, context);
          break;
          
        case 'stake':
          result = await this.executeStakeBlock(block, context);
          break;
          
        case 'swap':
          result = await this.executeSwapBlock(block, context);
          break;
          
        case 'embeddedWallet':
          result = await this.executeEmbeddedWalletBlock(block, context);
          break;
          
        case 'aiExplanation':
          result = await this.executeAIExplanationBlock(block, context);
          break;
          
        case 'cronjob':
          result = await this.executeCronjobBlock(block, context);
          break;
          
        default:
          throw new Error(`Unknown block type: ${block.type}`);
      }

      return {
        ...result,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      throw new Error(`Block execution failed: ${error.message}`);
    }
  }

  async executeWalletBalanceBlock(block, context) {
    const { chain, walletAddress, tokenType, tokenAddress } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const balance = await this.blockchainService.getWalletBalance(
      chain,
      walletAddress,
      tokenType,
      tokenAddress
    );

    return {
      type: 'wallet_balance',
      chain,
      address: walletAddress,
      balance,
      tokenType,
    };
  }

  async executeWalletTransactionBlock(block, context) {
    const { chain, walletAddress, limit, transactionType } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const transactions = await this.blockchainService.getWalletTransactions(
      chain,
      walletAddress,
      limit || 10,
      transactionType || 'All'
    );

    return {
      type: 'wallet_transactions',
      chain,
      address: walletAddress,
      transactions,
      count: transactions.length,
    };
  }

  async executeWalletNFTBlock(block, context) {
    const { chain, walletAddress, includeNFTs, includeTokens } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const data = await this.blockchainService.getWalletNFTsAndTokens(
      chain,
      walletAddress,
      includeNFTs,
      includeTokens
    );

    return {
      type: 'wallet_nft_tokens',
      chain,
      address: walletAddress,
      data,
    };
  }

  async executeTokenInfoBlock(block, context) {
    const { chain, tokenAddress, includePrice, includeMetrics } = block.config;
    
    if (!tokenAddress) {
      throw new Error('Token address is required');
    }

    const tokenInfo = await this.blockchainService.getTokenInfo(
      chain,
      tokenAddress,
      includePrice,
      includeMetrics
    );

    return {
      type: 'token_info',
      chain,
      tokenAddress,
      tokenInfo,
    };
  }

  async executeConditionalBlock(block, context) {
    const { condition, value, field } = block.config;
    
    if (!condition || !value || !field) {
      throw new Error('Condition, value, and field are required');
    }

    // Get the field value from previous block results
    const fieldValue = this.getFieldFromContext(field, context);
    
    const result = this.blockchainService.evaluateCondition(condition, value, fieldValue);

    return {
      type: 'conditional',
      condition,
      value,
      field,
      fieldValue,
      result,
      passed: result,
    };
  }

  async executeStakeBlock(block, context) {
    const { chain } = block.config;
    const userWallet = context.userWallets[chain];
    
    if (!userWallet) {
      throw new Error(`No wallet connected for ${chain}`);
    }

    const result = await this.blockchainService.stakeTokens(chain, block.config, userWallet);

    return {
      type: 'stake',
      chain,
      result,
    };
  }

  async executeSwapBlock(block, context) {
    const { chain } = block.config;
    const userWallet = context.userWallets[chain];
    
    if (!userWallet) {
      throw new Error(`No wallet connected for ${chain}`);
    }

    const result = await this.blockchainService.swapTokens(chain, block.config, userWallet);

    return {
      type: 'swap',
      chain,
      result,
    };
  }

  async executeEmbeddedWalletBlock(block, context) {
    const { chain, autoConnect } = block.config;

    // This block would typically be used to initialize wallet connections
    // The actual wallet connection is handled by the UI components
    return {
      type: 'embedded_wallet',
      chain,
      status: 'initialized',
      autoConnect,
    };
  }

  async executeAIExplanationBlock(block, context) {
    const { prompt, includeContext } = block.config;
    
    if (!prompt) {
      throw new Error('AI prompt is required');
    }

    let contextData = {};
    if (includeContext) {
      contextData = context.results;
    }

    const aiResponse = await this.blockchainService.generateAIExplanation(
      prompt,
      contextData
    );

    return {
      type: 'ai_explanation',
      prompt,
      model: 'gemini-pro',
      response: aiResponse,
    };
  }

  async executeCronjobBlock(block, context) {
    const { interval, enabled, maxRuns } = block.config;

    // Cronjob blocks are handled by the scheduler, not during execution
    return {
      type: 'cronjob',
      interval: interval || 5,
      enabled: enabled !== false,
      maxRuns: maxRuns || 0,
      status: 'configured',
    };
  }

  evaluateConditional(block, blockResult) {
    return blockResult.result === true;
  }

  getFieldFromContext(fieldPath, context) {
    // Parse field path like "blockId.field" or "previous.balance.native.formatted"
    const parts = fieldPath.split('.');
    
    if (parts[0] === 'previous') {
      // Get from the last executed block
      const lastBlockId = Object.keys(context.results).pop();
      if (!lastBlockId) return null;
      
      let value = context.results[lastBlockId];
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }
    
    // Get from specific block
    const blockId = parts[0];
    let value = context.results[blockId];
    
    for (let i = 1; i < parts.length; i++) {
      value = value?.[parts[i]];
    }
    
    return value;
  }

  // Workflow scheduling methods
  scheduleWorkflow(workflow, cronExpression) {
    // This would integrate with a job scheduler like node-cron
    console.log(`Scheduling workflow ${workflow.id} with cron: ${cronExpression}`);
    
    // Mock implementation
    return {
      workflowId: workflow.id,
      cronExpression,
      nextRun: new Date(Date.now() + 5000), // 5 seconds from now
      status: 'scheduled',
    };
  }

  cancelScheduledWorkflow(workflowId) {
    console.log(`Cancelling scheduled workflow: ${workflowId}`);
    
    return {
      workflowId,
      status: 'cancelled',
    };
  }

  // Workflow validation
  validateWorkflow(workflow) {
    const errors = [];
    
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }
    
    if (!workflow.blocks || workflow.blocks.length === 0) {
      errors.push('Workflow must have at least one block');
    }
    
    workflow.blocks?.forEach((block, index) => {
      if (!block.type) {
        errors.push(`Block ${index + 1} is missing type`);
      }
      
      if (!block.config) {
        errors.push(`Block ${index + 1} is missing configuration`);
      }
      
      // Validate block-specific requirements
      this.validateBlockConfig(block, errors, index);
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateBlockConfig(block, errors, index) {
    const blockNum = index + 1;
    
    switch (block.type) {
      case 'walletBalance':
      case 'walletTransaction':
      case 'walletNFT':
        if (!block.config.walletAddress) {
          errors.push(`Block ${blockNum}: Wallet address is required`);
        }
        if (!block.config.chain) {
          errors.push(`Block ${blockNum}: Chain selection is required`);
        }
        break;
        
      case 'tokenInfo':
        if (!block.config.tokenAddress) {
          errors.push(`Block ${blockNum}: Token address is required`);
        }
        if (!block.config.chain) {
          errors.push(`Block ${blockNum}: Chain selection is required`);
        }
        break;
        
      case 'conditional':
        if (!block.config.condition || !block.config.value || !block.config.field) {
          errors.push(`Block ${blockNum}: Condition, value, and field are required`);
        }
        break;
        
      case 'stake':
      case 'swap':
        if (!block.config.chain) {
          errors.push(`Block ${blockNum}: Chain selection is required`);
        }
        if (!block.config.amount) {
          errors.push(`Block ${blockNum}: Amount is required`);
        }
        break;
        
      case 'aiExplanation':
        if (!block.config.prompt) {
          errors.push(`Block ${blockNum}: AI prompt is required`);
        }
        break;
    }
  }
}

export default WorkflowEngine;
