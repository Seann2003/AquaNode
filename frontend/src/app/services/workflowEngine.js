import BlockchainService from './blockchainService';
import EmailService from './emailService';
import TheGraphService from './theGraphService';

class WorkflowEngine {
  constructor() {
    this.blockchainService = new BlockchainService();
    this.emailService = new EmailService();
    this.theGraphService = new TheGraphService();
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

          const isReportedFailure =
            blockResult && (blockResult.success === false || blockResult.status === 'failed' || !!blockResult.error);

          if (isReportedFailure) {
            results.push({
              blockId: block.id,
              blockName: block.name,
              blockType: block.type,
              status: 'error',
              error: blockResult.error || 'Block reported failure',
              result: blockResult,
              executionTime: Date.now() - this.executionContext.startTime,
            });

            this.executionContext.errors.push({
              blockId: block.id,
              error: blockResult.error || 'Block reported failure',
            });
          } else {
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
          }

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
        case 'sendEmail':
          result = await this.executeSendEmailBlock(block, context);
          break;
          
        case 'balancesByAddress':
          result = await this.executeBalancesByAddressBlock(block, context);
          break;
          
        case 'transferEvents':
          result = await this.executeTransferEventsBlock(block, context);
          break;
          
        case 'tokenHolders':
          result = await this.executeTokenHoldersBlock(block, context);
          break;
          
        case 'tokenMetadata':
          result = await this.executeTokenMetadataBlock(block, context);
          break;
          
        case 'liquidityPools':
          result = await this.executeLiquidityPoolsBlock(block, context);
          break;
          
        case 'swapEvents':
          result = await this.executeSwapEventsBlock(block, context);
          break;
          
        case 'nftActivities':
          result = await this.executeNFTActivitiesBlock(block, context);
          break;
          
        case 'nftCollection':
          result = await this.executeNFTCollectionBlock(block, context);
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
    const { chain, walletAddress, tokenType, tokenAddress, network } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const balance = await this.blockchainService.getWalletBalance(
      chain,
      walletAddress,
      tokenType,
      tokenAddress,
      { network }
    );

    return {
      type: 'wallet_balance',
      chain,
      address: walletAddress,
      balance,
      tokenType,
      network,
    };
  }

  async executeWalletTransactionBlock(block, context) {
    const { chain, walletAddress, limit, transactionType, network } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const transactions = await this.blockchainService.getWalletTransactions(
      chain,
      walletAddress,
      limit || 10,
      transactionType || 'All',
      { network }
    );

    return {
      type: 'wallet_transactions',
      chain,
      address: walletAddress,
      transactions,
      count: transactions.length,
      network,
    };
  }

  async executeWalletNFTBlock(block, context) {
    const { chain, walletAddress, includeNFTs, includeTokens, network } = block.config;
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const data = await this.blockchainService.getWalletNFTsAndTokens(
      chain,
      walletAddress,
      includeNFTs,
      includeTokens,
      { network }
    );

    return {
      type: 'wallet_nft_tokens',
      chain,
      address: walletAddress,
      data,
      network,
    };
  }

  async executeTokenInfoBlock(block, context) {
    const { chain, tokenAddress, includePrice, includeMetrics, network } = block.config;
    
    if (!tokenAddress) {
      throw new Error('Token address is required');
    }

    const tokenInfo = await this.blockchainService.getTokenInfo(
      chain,
      tokenAddress,
      includePrice,
      includeMetrics,
      { network }
    );

    return {
      type: 'token_info',
      chain,
      tokenAddress,
      tokenInfo,
      network,
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
    const { prompt } = block.config;
    
    if (!prompt) {
      throw new Error('AI prompt is required');
    }

    // Always provide prior block outputs as context, plus concise summaries
    const results = context.results || {};
    const balanceSummary = [];
    const txSummary = [];
    Object.values(results).forEach((res) => {
      const r = res?.type ? res : res?.result; // handle nested shape defensively
      if (!r) return;
      if (r.type === 'wallet_balance') {
        const native = r.balance?.native || {};
        const formatted = parseFloat(native.formatted ?? native.balance ?? '0');
        const symbol = native.symbol || (r.chain?.includes('Oasis') ? 'ROSE' : r.chain?.includes('Sui') ? 'SUI' : 'Native');
        balanceSummary.push({ chain: r.chain, address: r.address, amount: formatted, symbol });
      }
      if (r.type === 'wallet_transactions') {
        txSummary.push({ chain: r.chain, address: r.address, count: Array.isArray(r.transactions) ? r.transactions.length : 0 });
      }
    });

    const totalBySymbol = balanceSummary.reduce((acc, b) => {
      acc[b.symbol] = (acc[b.symbol] || 0) + (isFinite(b.amount) ? b.amount : 0);
      return acc;
    }, {});

    const contextData = {
      results,
      summaries: {
        balances: balanceSummary,
        transactions: txSummary,
        totalBySymbol,
      },
      guidance: 'Use summaries for quick reasoning. Provide totals and any notable patterns. If values are in different symbols, keep per-symbol totals.',
    };

    const aiResponse = await this.blockchainService.generateAIExplanation(prompt, contextData);

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

  async executeSendEmailBlock(block, context) {
    const { to, cc, bcc, from, subject, body, useHtml, provider, dryRun } = block.config;
    if (!to) throw new Error('Email recipient is required');
    if (!subject) throw new Error('Email subject is required');
    if (!body) throw new Error('Email body is required');

    const response = await this.emailService.sendEmail({ to, cc, bcc, from, subject, body, useHtml, provider, dryRun }, context);

    return {
      type: 'send_email',
      provider: provider || 'Resend',
      to,
      cc,
      bcc,
      subject,
      status: response.success ? 'sent' : 'failed',
      messageId: response.id || null,
      dryRun: response.dryRun || false,
      error: response.success ? null : response.error,
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

  // The Graph API block execution methods
  async executeBalancesByAddressBlock(block, context) {
    const { address, networkId, limit, page } = block.config;
    
    if (!address) {
      throw new Error('Address is required');
    }

    try {
      const result = await this.theGraphService.getBalancesByAddress(
        address,
        networkId || 'mainnet',
        limit || 10,
        page || 1
      );

      const shaped = {
        success: true,
        data: result.data,
        metadata: {
          address,
          networkId: networkId || 'mainnet',
          limit: limit || 10,
          page: page || 1,
          totalResults: result.data?.length || 0
        }
      };
      // Save a simplified lastResult for UI preview
      block.lastResult = shaped;
      return shaped;
    } catch (error) {
      const shaped = {
        success: false,
        error: error.message
      };
      block.lastResult = shaped;
      return shaped;
    }
  }

  async executeTransferEventsBlock(block, context) {
    const { networkId, startTime, endTime, orderBy, orderDirection, limit, page, from, to, contract, transactionId, timePreset } = block.config;

    try {
      const result = await this.theGraphService.getTransferEvents(
        networkId || 'mainnet',
        startTime || 0,
        endTime || 9999999999,
        orderBy || 'timestamp',
        orderDirection || 'desc',
        limit || 10,
        page || 1,
        { from, to, contract, transaction_id: transactionId }
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          networkId: networkId || 'mainnet',
          startTime: startTime || 0,
          endTime: endTime || 9999999999,
          orderBy: orderBy || 'timestamp',
          orderDirection: orderDirection || 'desc',
          limit: limit || 10,
          page: page || 1,
          from, to, contract, transactionId,
          timePreset: timePreset || 'Last 24h',
          totalResults: result.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeTokenHoldersBlock(block, context) {
    const { contract, networkId, orderBy, orderDirection, limit, page } = block.config;
    
    if (!contract) {
      throw new Error('Token contract address is required');
    }

    try {
      const result = await this.theGraphService.getTokenHolders(
        contract,
        networkId || 'mainnet',
        orderBy || 'value',
        orderDirection || 'desc',
        limit || 10,
        page || 1
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          contract,
          networkId: networkId || 'mainnet',
          orderBy: orderBy || 'value',
          orderDirection: orderDirection || 'desc',
          limit: limit || 10,
          page: page || 1,
          totalResults: result.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeTokenMetadataBlock(block, context) {
    const { contract, networkId } = block.config;
    
    if (!contract) {
      throw new Error('Token contract address is required');
    }

    try {
      const result = await this.theGraphService.getTokenMetadata(
        contract,
        networkId || 'mainnet'
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          contract,
          networkId: networkId || 'mainnet'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeLiquidityPoolsBlock(block, context) {
    const { networkId, limit, page } = block.config;

    try {
      const result = await this.theGraphService.getLiquidityPools(
        networkId || 'mainnet',
        limit || 10,
        page || 1
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          networkId: networkId || 'mainnet',
          limit: limit || 10,
          page: page || 1,
          totalResults: result.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeSwapEventsBlock(block, context) {
    const { networkId, startTime, endTime, orderBy, orderDirection, limit, page } = block.config;

    try {
      const result = await this.theGraphService.getSwapEvents(
        networkId || 'mainnet',
        startTime || 0,
        endTime || 9999999999,
        orderBy || 'timestamp',
        orderDirection || 'desc',
        limit || 10,
        page || 1
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          networkId: networkId || 'mainnet',
          startTime: startTime || 0,
          endTime: endTime || 9999999999,
          orderBy: orderBy || 'timestamp',
          orderDirection: orderDirection || 'desc',
          limit: limit || 10,
          page: page || 1,
          totalResults: result.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeNFTActivitiesBlock(block, context) {
    const { networkId, startTime, endTime, orderBy, orderDirection, limit, page } = block.config;

    try {
      const result = await this.theGraphService.getNFTActivities(
        networkId || 'mainnet',
        startTime || 0,
        endTime || 9999999999,
        orderBy || 'timestamp',
        orderDirection || 'desc',
        limit || 10,
        page || 1
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          networkId: networkId || 'mainnet',
          startTime: startTime || 0,
          endTime: endTime || 9999999999,
          orderBy: orderBy || 'timestamp',
          orderDirection: orderDirection || 'desc',
          limit: limit || 10,
          page: page || 1,
          totalResults: result.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeNFTCollectionBlock(block, context) {
    const { contract, networkId } = block.config;
    
    if (!contract) {
      throw new Error('NFT contract address is required');
    }

    try {
      const result = await this.theGraphService.getNFTCollection(
        contract,
        networkId || 'mainnet'
      );

      return {
        success: true,
        data: result.data,
        metadata: {
          contract,
          networkId: networkId || 'mainnet'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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
        
      // The Graph API blocks validation
      case 'balancesByAddress':
        if (!block.config.address) {
          errors.push(`Block ${blockNum}: Address is required`);
        }
        break;
        
      case 'tokenHolders':
      case 'tokenMetadata':
        if (!block.config.contract) {
          errors.push(`Block ${blockNum}: Token contract address is required`);
        }
        break;
        
      case 'nftCollection':
        if (!block.config.contract) {
          errors.push(`Block ${blockNum}: NFT contract address is required`);
        }
        break;
    }
  }
}

export default WorkflowEngine;
