// Static templates that don't require MongoDB
export const STATIC_TEMPLATES = [
  {
    id: 'gr-template-1',
    name: 'Daily Portfolio Digest (The Graph + AI)',
    description: 'Fetch wallet balances, enrich with token metadata, summarize with AI, and email daily.',
    chains: ['Ethereum'],
    blocks: [
      { id: 'balances-1', type: 'balancesByAddress', name: 'Get Balances', config: { address: '', networkId: 'mainnet', limit: 25, page: 1 }, position: { x: 100, y: 100 } },
      { id: 'metadata-1', type: 'tokenMetadata', name: 'Enrich Top Token', config: { contract: '', networkId: 'mainnet' }, position: { x: 100, y: 220 } },
      { id: 'ai-1', type: 'aiExplanation', name: 'AI Summary', config: { prompt: 'Summarize balances and notable changes; flag risks and concentration.', includeContext: true }, position: { x: 100, y: 340 } },
      { id: 'email-1', type: 'sendEmail', name: 'Email Report', config: { to: '', subject: 'Daily Portfolio Digest', body: '[[AI summary here]]', useHtml: false }, position: { x: 100, y: 460 } },
      { id: 'cron-1', type: 'cronjob', name: 'Schedule Daily', config: { interval: 86400, enabled: true, maxRuns: 0 }, position: { x: 100, y: 580 } }
    ],
    category: 'Analysis',
    isActive: true
  },
  {
    id: 'gr-template-2',
    name: 'Whale Transfer Alert',
    description: 'Monitor large token transfers and receive contextual alerts.',
    chains: ['Ethereum'],
    blocks: [
      { id: 'xfer-1', type: 'transferEvents', name: 'Watch Transfers', config: { networkId: 'mainnet', orderBy: 'timestamp', orderDirection: 'desc', limit: 50, page: 1 }, position: { x: 100, y: 100 } },
      { id: 'cond-1', type: 'conditional', name: 'Large Amount Filter', config: { condition: 'Greater Than', value: '100000', field: 'previous.data.0.value' }, position: { x: 100, y: 220 } },
      { id: 'md-1', type: 'tokenMetadata', name: 'Token Context', config: { contract: '', networkId: 'mainnet' }, position: { x: 100, y: 340 } },
      { id: 'ai-2', type: 'aiExplanation', name: 'Explain Significance', config: { prompt: 'Explain the transfer significance and potential implications.', includeContext: true }, position: { x: 100, y: 460 } },
      { id: 'email-2', type: 'sendEmail', name: 'Send Alert', config: { to: '', subject: 'Whale Transfer Alert', body: '{{previous.ai_explanation.response}}' }, position: { x: 100, y: 580 } }
    ],
    category: 'Alerts',
    isActive: true
  },
  {
    id: 'gr-template-3',
    name: 'Swap Activity Monitor',
    description: 'Track Uniswap swaps for a pool/token and notify on spikes.',
    chains: ['Ethereum'],
    blocks: [
      { id: 'swp-1', type: 'swapEvents', name: 'Watch Swaps', config: { networkId: 'mainnet', protocol: 'uniswap_v3', orderBy: 'timestamp', orderDirection: 'desc', limit: 50, page: 1 }, position: { x: 100, y: 100 } },
      { id: 'cond-2', type: 'conditional', name: 'Volume Spike', config: { condition: 'Greater Than', value: '100000', field: 'previous.data.0.value1' }, position: { x: 100, y: 220 } },
      { id: 'ai-3', type: 'aiExplanation', name: 'AI Insight', config: { prompt: 'Summarize swap flow and price/volume implications for traders.', includeContext: true }, position: { x: 100, y: 340 } },
      { id: 'email-3', type: 'sendEmail', name: 'Notify', config: { to: '', subject: 'Swap Activity Spike', body: '{{previous.ai_explanation.response}}' }, position: { x: 100, y: 460 } }
    ],
    category: 'Trading',
    isActive: true
  },
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
        },
        position: { x: 100, y: 100 }
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
        },
        position: { x: 100, y: 220 }
      },
      {
        id: 'ai-analysis-1',
        type: 'aiExplanation',
        name: 'AI Portfolio Analysis',
        config: {
          prompt: 'Analyze the wallet balance and recent transactions. Provide insights on portfolio performance, transaction patterns, and recommendations for optimization.',
          includeContext: true
        },
        position: { x: 100, y: 340 }
      }
    ],
    category: 'Analysis',
    isActive: true
  },
  {
    id: 'template-graph-api',
    name: 'The Graph API Token Analysis',
    description: 'Comprehensive token analysis using The Graph API endpoints',
    chains: ['Ethereum'],
    blocks: [
      {
        id: 'token-metadata-1',
        type: 'tokenMetadata',
        name: 'Get Token Metadata',
        config: {
          contract: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
          networkId: 'mainnet'
        },
        position: { x: 100, y: 100 }
      },
      {
        id: 'token-holders-1',
        type: 'tokenHolders',
        name: 'Get Top Token Holders',
        config: {
          contract: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
          networkId: 'mainnet',
          orderBy: 'value',
          orderDirection: 'desc',
          limit: 10,
          page: 1
        },
        position: { x: 100, y: 220 }
      },
      {
        id: 'transfer-events-1',
        type: 'transferEvents',
        name: 'Recent Transfer Events',
        config: {
          networkId: 'mainnet',
          startTime: 0,
          endTime: 9999999999,
          orderBy: 'timestamp',
          orderDirection: 'desc',
          limit: 10,
          page: 1
        },
        position: { x: 100, y: 340 }
      },
      {
        id: 'liquidity-pools-1',
        type: 'liquidityPools',
        name: 'Get Liquidity Pools',
        config: {
          networkId: 'mainnet',
          limit: 10,
          page: 1
        },
        position: { x: 100, y: 460 }
      },
      {
        id: 'ai-analysis-1',
        type: 'aiExplanation',
        name: 'AI Token Analysis',
        config: {
          prompt: 'Analyze the token metadata, holder distribution, recent transfers, and liquidity pools. Provide insights on token health, distribution patterns, and market activity.',
          includeContext: true
        },
        position: { x: 100, y: 580 }
      }
    ],
    category: 'DeFi',
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
        },
        position: { x: 100, y: 100 }
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
        },
        position: { x: 100, y: 220 }
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        name: 'Check Swap Conditions',
        config: {
          condition: 'Greater Than',
          value: '100',
          field: 'previous.balance.native.formatted'
        },
        position: { x: 100, y: 340 }
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
        },
        position: { x: 100, y: 460 }
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
        },
        position: { x: 100, y: 100 }
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
        },
        position: { x: 100, y: 220 }
      },
      {
        id: 'conditional-2',
        type: 'conditional',
        name: 'Check Staking Conditions',
        config: {
          condition: 'Greater Than',
          value: '50',
          field: 'previous.balance.native.formatted'
        },
        position: { x: 100, y: 340 }
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
        },
        position: { x: 100, y: 460 }
      },
      {
        id: 'ai-reasoning-1',
        type: 'aiExplanation',
        name: 'AI Staking Analysis',
        config: {
          prompt: 'Analyze the staking decision based on token performance and wallet balance. Provide reasoning for the staking strategy and future recommendations.',
          includeContext: true
        },
        position: { x: 100, y: 580 }
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
        },
        position: { x: 100, y: 100 }
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
        },
        position: { x: 100, y: 220 }
      },
      {
        id: 'conditional-3',
        type: 'conditional',
        name: 'Check Profit Threshold',
        config: {
          condition: 'Greater Than',
          value: '5',
          field: 'previous.tokenInfo.price.change24h'
        },
        position: { x: 100, y: 340 }
      },
      {
        id: 'ai-charity-1',
        type: 'aiExplanation',
        name: 'Calculate Charity Donation',
        config: {
          prompt: 'Based on the current profit percentage, calculate 5% of the gains for charity donation. Provide a summary of the donation amount, impact, and recommended charity organizations in the crypto/DeFi space.',
          includeContext: true
        },
        position: { x: 100, y: 460 }
      },
      {
        id: 'cronjob-1',
        type: 'cronjob',
        name: 'Schedule Profit Check',
        config: {
          interval: 300,
          enabled: true,
          maxRuns: 0
        },
        position: { x: 100, y: 580 }
      }
    ],
    category: 'Social Impact',
    isActive: true
  }
];

export function getStaticTemplates() {
  return STATIC_TEMPLATES;
}

export function getTemplateById(templateId) {
  return STATIC_TEMPLATES.find(template => template.id === templateId);
}

export function createWorkflowFromTemplate(template) {
  if (!template) return null;

  return {
    name: `${template.name} - Copy`,
    description: template.description,
    blocks: template.blocks.map(block => ({
      ...block,
      id: `${block.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })),
    status: 'draft',
    chains: template.chains || [],
    createdAt: new Date().toISOString(),
    template: false
  };
}
