import { ethers } from 'ethers';
import axios from 'axios';

// Oasis Sapphire RPC endpoints & explorer hosts
// explorerWeb is the human-facing explorer. explorerApi is the JSON API (legacy host)
// nexusBase is the recommended Nexus API base for tx queries per network
const OASIS_NETWORKS = {
  mainnet: {
    rpc: 'https://sapphire.oasis.io',
    chainId: 23294,
    explorerWeb: 'https://explorer.oasis.io/mainnet/sapphire',
    explorerApi: 'https://explorer.sapphire.oasis.io',
    nexusBase: 'https://nexus.oasis.io/v1/sapphire',
  },
  testnet: {
    rpc: 'https://testnet.sapphire.oasis.dev',
    chainId: 23295,
    explorerWeb: 'https://explorer.oasis.io/testnet/sapphire',
    explorerApi: 'https://testnet.explorer.sapphire.oasis.dev',
    nexusBase: 'https://testnet.nexus.oasis.io/v1/sapphire',
  },
};

// Common ERC-20 ABI for token operations
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// Staking contract ABI (simplified)
const STAKING_ABI = [
  'function stake(uint256 amount) payable',
  'function unstake(uint256 amount)',
  'function getStakedAmount(address user) view returns (uint256)',
  'function getRewards(address user) view returns (uint256)',
  'function claimRewards()',
];

class OasisService {
  constructor(network = process.env.NEXT_PUBLIC_OASIS_NETWORK || 'testnet') {
    this.network = network;
    this.networkConfig = OASIS_NETWORKS[network];
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpc);
    this.signer = null;
  }

  setNetwork(network) {
    const desired = network || process.env.NEXT_PUBLIC_OASIS_NETWORK || 'testnet';
    if (desired === this.network) return this;
    if (!OASIS_NETWORKS[desired]) {
      throw new Error(`Unsupported Oasis network: ${desired}`);
    }
    this.network = desired;
    this.networkConfig = OASIS_NETWORKS[desired];
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpc);
    return this;
  }

  // Privy Integration (to be used with Privy React hooks)
  async connectWithPrivy(privyUser) {
    try {
      if (!privyUser?.wallet?.address) {
        throw new Error('No wallet address from Privy');
      }

      // Create account on Oasis Sapphire if needed
      const address = privyUser.wallet.address;
      const balance = await this.provider.getBalance(address);
      
      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: this.networkConfig.chainId,
        network: this.network,
      };
    } catch (error) {
      console.error('Privy connection failed:', error);
      throw error;
    }
  }

  async createAccountOnChain(privyWallet) {
    try {
      // With Privy, the account is automatically created when the user logs in
      // This method can be used for additional setup if needed
      const address = privyWallet.address;
      
      // Check if account exists and has been used
      const transactionCount = await this.provider.getTransactionCount(address);
      const balance = await this.provider.getBalance(address);

      return {
        address,
        isNew: transactionCount === 0,
        balance: ethers.formatEther(balance),
        transactionCount,
      };
    } catch (error) {
      console.error('Account creation check failed:', error);
      throw error;
    }
  }

  // Wallet Operations
  async getWalletBalance(address, tokenType = 'All Tokens', tokenAddress = null) {
    try {
      const result = {};

      if (tokenType === 'Native' || tokenType === 'All Tokens') {
        const balance = await this.provider.getBalance(address);
        result.native = {
          symbol: 'ROSE',
          balance: balance.toString(),
          formatted: ethers.formatEther(balance),
          decimals: 18,
        };
      }

      if (tokenType === 'Specific Token' && tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();

        result[tokenAddress] = {
          address: tokenAddress,
          symbol,
          balance: balance.toString(),
          formatted: ethers.formatUnits(balance, decimals),
          decimals,
        };
      }

      if (tokenType === 'All Tokens') {
        // Get common tokens on Oasis Sapphire
        const commonTokens = await this.getCommonTokens();
        
        for (const token of commonTokens) {
          try {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider);
            const balance = await tokenContract.balanceOf(address);
            
            if (balance > 0) {
              result[token.address] = {
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                balance: balance.toString(),
                formatted: ethers.formatUnits(balance, token.decimals),
                decimals: token.decimals,
              };
            }
          } catch (error) {
            console.warn(`Failed to get balance for token ${token.address}:`, error);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  async getWalletTransactions(address, limit = 10, transactionType = 'All') {
    try {
      // Use Oasis Explorer API to get transaction history
      const explorerUrl = `${this.networkConfig.explorer}//${address}/transactions`;
      const response = await axios.get(explorerUrl, {
        params: { limit, offset: 0 }
      });

      return response.data.transactions?.map(tx => ({
        hash: tx.hash,
        timestamp: tx.timestamp,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.status,
        type: this.getTransactionType(tx),
      })) || [];
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      // Fallback to basic provider method
      return [];
    }
  }

  async getWalletNFTsAndTokens(address, includeNFTs = true, includeTokens = true) {
    try {
      const result = {};

      if (includeTokens) {
        result.tokens = await this.getWalletBalance(address, 'All Tokens');
      }

      if (includeNFTs) {
        // NFT detection on Oasis Sapphire would require specific NFT contract addresses
        // This is a simplified implementation
        result.nfts = await this.getNFTs(address);
      }

      return result;
    } catch (error) {
      console.error('Failed to get wallet NFTs and tokens:', error);
      throw error;
    }
  }

  // Enhanced Token Operations with The Graph
  async getTokenInfo(tokenAddress, includePrice = true, includeMetrics = true) {
    try {
      // 1) Basic validation: ensure the address is a contract on this network
      const code = await this.provider.getCode(tokenAddress);
      if (!code || code === '0x') {
        throw new Error(`Address ${tokenAddress} is not a contract on Oasis Sapphire ${this.network}`);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);

      // 2) Read metadata with robust fallbacks (bytes32)
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.readTokenName(tokenAddress),
        this.readTokenSymbol(tokenAddress),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
      ]);

      const result = {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        formattedSupply: ethers.formatUnits(totalSupply, decimals),
      };

      if (includePrice) {
        result.price = await this.getTokenPrice(tokenAddress);
      }

      if (includeMetrics) {
        // Get enhanced metrics from The Graph
        result.metrics = await this.getTokenMetricsFromGraph(tokenAddress);
      }

      return result;
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  // --- Robust metadata readers with bytes32 fallback ---
  async readTokenName(tokenAddress) {
    const stringAbi = ['function name() view returns (string)'];
    const bytesAbi = ['function name() view returns (bytes32)'];
    try {
      const c = new ethers.Contract(tokenAddress, stringAbi, this.provider);
      return await c.name();
    } catch (_) {
      try {
        const cBytes = new ethers.Contract(tokenAddress, bytesAbi, this.provider);
        const raw = await cBytes.name();
        return this.decodeBytes32ToString(raw);
      } catch (e2) {
        throw new Error(`Unable to read token name: ${e2.message}`);
      }
    }
  }

  async readTokenSymbol(tokenAddress) {
    const stringAbi = ['function symbol() view returns (string)'];
    const bytesAbi = ['function symbol() view returns (bytes32)'];
    try {
      const c = new ethers.Contract(tokenAddress, stringAbi, this.provider);
      return await c.symbol();
    } catch (_) {
      try {
        const cBytes = new ethers.Contract(tokenAddress, bytesAbi, this.provider);
        const raw = await cBytes.symbol();
        return this.decodeBytes32ToString(raw);
      } catch (e2) {
        throw new Error(`Unable to read token symbol: ${e2.message}`);
      }
    }
  }

  decodeBytes32ToString(bytes32Value) {
    try {
      return ethers.decodeBytes32String(bytes32Value);
    } catch (_) {
      // Fallback manual decode: strip trailing zeros and decode as UTF-8
      const hex = typeof bytes32Value === 'string' ? bytes32Value : ethers.hexlify(bytes32Value);
      const stripped = hex.replace(/(00)+$/i, '');
      try {
        return ethers.toUtf8String(stripped);
      } catch {
        return 'UNKNOWN';
      }
    }
  }

  async getTokenMetricsFromGraph(tokenAddress) {
    try {
      const query = `
        query GetTokenMetrics($tokenAddress: String!) {
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
            tokenDayData(first: 7, orderBy: date, orderDirection: desc) {
              date
              dailyVolumeToken
              dailyVolumeUSD
              priceUSD
              totalLiquidityToken
              totalLiquidityUSD
            }
          }
          pairs(where: { token0: $tokenAddress }) {
            id
            token0 {
              symbol
            }
            token1 {
              symbol
            }
            reserveUSD
            volumeUSD
            txCount
          }
        }
      `;

      const subgraphUrl = process.env.NEXT_PUBLIC_OASIS_SUBGRAPH_URL;
      if (!subgraphUrl) {
        console.warn('Oasis subgraph URL not configured');
        return this.getBasicTokenMetrics(tokenAddress);
      }

      const response = await axios.post(subgraphUrl, {
        query,
        variables: { tokenAddress: tokenAddress.toLowerCase() }
      });

      const data = response.data?.data;
      if (!data?.token) {
        return this.getBasicTokenMetrics(tokenAddress);
      }

      const token = data.token;
      const pairs = data.pairs || [];

      return {
        holders: 0, // Not available in basic subgraph
        transfers24h: token.txCount || 0,
        volume24h: token.tokenDayData?.[0]?.dailyVolumeUSD || 0,
        volume7d: token.tokenDayData?.reduce((sum, day) => sum + (parseFloat(day.dailyVolumeUSD) || 0), 0) || 0,
        liquidity: token.totalLiquidity || 0,
        liquidityUSD: token.tokenDayData?.[0]?.totalLiquidityUSD || 0,
        priceUSD: token.tokenDayData?.[0]?.priceUSD || 0,
        priceChange24h: this.calculatePriceChange(token.tokenDayData),
        pairs: pairs.map(pair => ({
          id: pair.id,
          tokens: `${pair.token0.symbol}/${pair.token1.symbol}`,
          reserveUSD: pair.reserveUSD,
          volumeUSD: pair.volumeUSD,
          txCount: pair.txCount
        })),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get token metrics from The Graph:', error);
      return this.getBasicTokenMetrics(tokenAddress);
    }
  }

  calculatePriceChange(tokenDayData) {
    if (!tokenDayData || tokenDayData.length < 2) return 0;
    
    const today = parseFloat(tokenDayData[0]?.priceUSD) || 0;
    const yesterday = parseFloat(tokenDayData[1]?.priceUSD) || 0;
    
    if (yesterday === 0) return 0;
    
    return ((today - yesterday) / yesterday) * 100;
  }

  async getBasicTokenMetrics(tokenAddress) {
    // Fallback metrics when The Graph is not available
    return {
      holders: 0,
      transfers24h: 0,
      volume24h: 0,
      volume7d: 0,
      liquidity: 0,
      liquidityUSD: 0,
      priceUSD: 0,
      priceChange24h: 0,
      pairs: [],
      lastUpdated: new Date().toISOString()
    };
  }

  // Enhanced wallet operations with The Graph data
  async getWalletTransactions(address, limit = 10, transactionType = 'All') {
    try {
      // 1) The Graph (preferred when configured)
      const graphTransactions = await this.getTransactionsFromGraph(address, limit);
      if (graphTransactions.length > 0) return graphTransactions;

      // 2) Nexus API (optional)
      // Uncomment to enable Nexus before explorer/RPC
      // try {
      //   const url = `${this.networkConfig.nexusBase}/transactions`;
      //   const response = await axios.get(url, {
      //     params: { limit, offset: 0, rel: address },
      //     timeout: 8000,
      //   });
      //   const list = Array.isArray(response.data?.transactions) ? response.data.transactions : [];
      //   const mapped = list.map(tx => ({
      //     hash: tx.eth_hash || tx.hash,
      //     timestamp: tx.timestamp,
      //     from: tx.sender_0_eth || tx.sender_0 || null,
      //     to: tx.to_eth || tx.to || null,
      //     value: tx.amount || null,
      //     gasUsed: tx.gas_used ?? null,
      //     gasPrice: null,
      //     status: tx.success ? 'success' : 'failed',
      //     type: tx.is_likely_native_token_transfer ? 'Transfer' : (tx.method?.includes('Deposit') ? 'Deposit' : 'Contract'),
      //   }));
      //   if (mapped.length > 0) return mapped;
      // } catch (nexusErr) {}

      // 3) Explorer API (guard CORS / network errors gracefully)
      // try {
      //   const explorerUrl = `${this.networkConfig.explorerApi}/api/v1/sapphire/${address}/transactions`;
      //   const response = await axios.get(explorerUrl, {
      //     params: { limit, offset: 0 },
      //     timeout: 8000,
      //   });
      //   return response.data.transactions?.map(tx => ({
      //     hash: tx.hash,
      //     timestamp: tx.timestamp,
      //     from: tx.from,
      //     to: tx.to,
      //     value: tx.value,
      //     gasUsed: tx.gasUsed,
      //     gasPrice: tx.gasPrice,
      //     status: tx.status,
      //     type: this.getTransactionType(tx),
      //   })) || [];
      // } catch (expErr) {
      //   console.warn('Explorer API unavailable, falling back to RPC scan');
      //   return await this.scanRecentTransactions(address, limit);
      // }
    } catch (error) {
      console.error('Failed to get wallet transactions (graph/explorer):', error);
      // Final fallback: scan recent blocks directly from RPC provider
      try {
        // return await this.scanRecentTransactions(address, limit);
      } catch (e2) {
        console.error('RPC scan for transactions failed:', e2);
        return [];
      }
    }
  }

  async getTransactionsFromGraph(address, limit = 10) {
    try {
      const query = `
        query GetWalletTransactions($address: String!, $limit: Int!) {
          transactions(
            where: { or: [{ from: $address }, { to: $address }] }
            first: $limit
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            hash
            from
            to
            value
            gasUsed
            gasPrice
            timestamp
            blockNumber
            swaps {
              id
              amount0In
              amount0Out
              amount1In
              amount1Out
              amountUSD
              token0 {
                symbol
              }
              token1 {
                symbol
              }
            }
            mints {
              id
              amount0
              amount1
              amountUSD
              token0 {
                symbol
              }
              token1 {
                symbol
              }
            }
            burns {
              id
              amount0
              amount1
              amountUSD
              token0 {
                symbol
              }
              token1 {
                symbol
              }
            }
          }
        }
      `;

      const subgraphUrl = process.env.NEXT_PUBLIC_OASIS_SUBGRAPH_URL;
      if (!subgraphUrl) {
        return [];
      }

      const response = await axios.post(subgraphUrl, {
        query,
        variables: { 
          address: address.toLowerCase(),
          limit 
        }
      });

      const transactions = response.data?.data?.transactions || [];
      
      return transactions.map(tx => ({
        hash: tx.hash,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: tx.blockNumber,
        type: this.determineTransactionType(tx),
        defiData: {
          swaps: tx.swaps || [],
          mints: tx.mints || [],
          burns: tx.burns || []
        }
      }));
    } catch (error) {
      console.error('Failed to get transactions from The Graph:', error);
      return [];
    }
  }

  determineTransactionType(tx) {
    if (tx.swaps && tx.swaps.length > 0) return 'Swap';
    if (tx.mints && tx.mints.length > 0) return 'Add Liquidity';
    if (tx.burns && tx.burns.length > 0) return 'Remove Liquidity';
    return 'Transfer';
  }

  async scanRecentTransactions(address, limit = 10, maxBlocks = 1500) {
    const results = [];
    const normalized = address.toLowerCase();
    try {
      const latest = await this.provider.getBlockNumber();
      for (let i = latest; i > latest - maxBlocks && i >= 0 && results.length < limit; i--) {
        // get block with transactions (ethers v6)
        const block = await this.provider.getBlockWithTransactions(i);
        if (!block || !Array.isArray(block.transactions)) continue;
        for (const tx of block.transactions) {
          const from = tx.from?.toLowerCase?.() || '';
          const to = tx.to?.toLowerCase?.() || '';
          if (from === normalized || to === normalized) {
            results.push({
              hash: tx.hash,
              timestamp: new Date((block.timestamp || 0) * 1000).toISOString(),
              from: tx.from,
              to: tx.to,
              value: tx.value?.toString?.() ?? null,
              gasUsed: null,
              gasPrice: tx.gasPrice?.toString?.() ?? null,
              status: 'unknown',
              type: 'Transfer',
            });
            if (results.length >= limit) break;
          }
        }
      }
      return results;
    } catch (error) {
      console.error('scanRecentTransactions error:', error);
      return results;
    }
  }

  // Staking Operations
  async stakeTokens(config, userWallet) {
    try {
      const { tokenAddress, amount, validator, stakingPool } = config;
      
      // Connect wallet as signer
      this.signer = userWallet; // This would be the Privy wallet signer
      
      if (tokenAddress === 'native' || tokenAddress === '0x0') {
        // Stake native ROSE tokens
        const stakingContract = new ethers.Contract(
          stakingPool,
          STAKING_ABI,
          this.signer
        );

        const tx = await stakingContract.stake(ethers.parseEther(amount.toString()), {
          value: ethers.parseEther(amount.toString())
        });

        const receipt = await tx.wait();
        
        return {
          hash: receipt.hash,
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
        };
      } else {
        // Stake ERC-20 tokens
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const stakingContract = new ethers.Contract(stakingPool, STAKING_ABI, this.signer);
        
        const decimals = await tokenContract.decimals();
        const stakeAmount = ethers.parseUnits(amount.toString(), decimals);
        
        // Approve tokens first
        const approveTx = await tokenContract.approve(stakingPool, stakeAmount);
        await approveTx.wait();
        
        // Stake tokens
        const stakeTx = await stakingContract.stake(stakeAmount);
        const receipt = await stakeTx.wait();
        
        return {
          hash: receipt.hash,
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
        };
      }
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  // Swapping Operations
  async swapTokens(config, userWallet) {
    try {
      const { fromToken, toToken, amount, slippage, dex } = config;
      
      this.signer = userWallet;
      
      // This would integrate with DEX protocols on Oasis Sapphire
      // For now, return a mock implementation
      const result = {
        hash: 'mock_swap_hash',
        status: 'success',
        fromAmount: amount,
        toAmount: amount * 0.99, // Mock exchange rate
        slippageUsed: slippage,
        dex,
      };

      return result;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  // Helper Methods
  async getCommonTokens() {
    // Return list of common tokens on Oasis Sapphire
    return [
      {
        address: '0x21C718C22D52d0F3a789b752D4c2fD5908a8A733',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
      },
      {
        address: '0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      },
      // Add more common tokens as needed
    ];
  }

  async getNFTs(address) {
    // NFT detection would require specific NFT contract addresses
    // This is a placeholder implementation
    return [];
  }

  getTransactionType(tx) {
    // Analyze transaction to determine type
    if (tx.input && tx.input !== '0x') {
      // Contract interaction
      if (tx.input.startsWith('0xa9059cbb')) return 'Transfer';
      if (tx.input.startsWith('0x095ea7b3')) return 'Approve';
      return 'Contract';
    }
    return 'Transfer';
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
      };
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }
}

export default OasisService;
