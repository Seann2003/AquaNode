class TheGraphService {
  constructor() {
    this.baseUrl = 'https://token-api.thegraph.com';
    this.apiKey = process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY;
    this.subgraphApiKey = process.env.NEXT_PUBLIC_THE_GRAPH_SUBGRAPH_API_KEY;

    // Uniswap V3 subgraph for coin info
    this.uniswapSubgraphUrl =
      'https://gateway.thegraph.com/api/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV';

    // Pool addresses mapping for coin info
    this.poolAddresses = {
      eth: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      pepe: '0xcee31c846cbf003f4ceb5bbd234cba03c6e940c7',
      shib: '0x2f62f2b4c5fcd7570a709dec05d68ea19c82a9ec',
    };
  }

  async makeRequest(endpoint, params = {}) {
    if (!this.apiKey || this.apiKey === 'your_the_graph_api_key_here') {
      throw new Error('The Graph API key is not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `The Graph API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  }

  /**
   * Execute GraphQL query against Uniswap subgraph
   * @param {string} query - GraphQL query string
   * @returns {Promise<Object>} Query result
   */
  async executeUniswapQuery(query) {
    try {
      const response = await fetch(this.uniswapSubgraphUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.subgraphApiKey}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(
          `Uniswap subgraph request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check for GraphQL errors
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error(
          `GraphQL query failed: ${data.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      return data.data;
    } catch (error) {
      console.error('Error executing Uniswap GraphQL query:', error);
      throw new Error(
        `Failed to fetch data from Uniswap subgraph: ${error.message}`
      );
    }
  }

  /**
   * Get supported coins for coin info
   * @returns {string[]} Array of supported coin symbols
   */
  getSupportedCoins() {
    return Object.keys(this.poolAddresses);
  }

  /**
   * Check if a coin is supported for coin info
   * @param {string} coin - Coin symbol
   * @returns {boolean} True if supported
   */
  isCoinSupported(coin) {
    return coin && this.poolAddresses.hasOwnProperty(coin.toLowerCase());
  }

  /**
   * Get comprehensive coin information from Uniswap V3
   * @param {string} coin - Coin symbol (e.g., 'eth', 'pepe', 'shib')
   * @returns {Promise<Object>} Formatted coin information
   */
  async getCoinInfo(coin) {
    // Input validation
    if (!coin || typeof coin !== 'string') {
      throw new Error('Invalid coin parameter. Must be a non-empty string.');
    }

    const normalizedCoin = coin.toLowerCase();

    // Check if coin is supported
    if (!this.isCoinSupported(normalizedCoin)) {
      throw new Error(
        `Unsupported coin: ${coin}. Supported coins: ${this.getSupportedCoins().join(
          ', '
        )}`
      );
    }

    // Get pool address
    const poolAddress = this.poolAddresses[normalizedCoin];
    if (!poolAddress) {
      throw new Error(`No pool address found for coin: ${coin}`);
    }

    try {
      console.log(`Fetching coin info for ${coin} from pool ${poolAddress}`);

      // Build GraphQL query
      const query = `
        {
          pool(id: "${poolAddress}") {
            token0 {
              symbol
              name
              decimals
            }
            token1 {
              symbol
              name
              decimals
            }
            token0Price
            token1Price
            totalValueLockedUSD
            volumeUSD
            feeTier
          }
          poolDayDatas(
            where: {pool: "${poolAddress}"}
            first: 2
            orderBy: date
            orderDirection: desc
          ) {
            date
            token0Price
            token1Price
            volumeUSD
            tvlUSD
          }
        }
      `;

      // Execute query
      const rawData = await this.executeUniswapQuery(query);

      // Process and return formatted data
      return this.processCoinData(rawData, normalizedCoin, poolAddress);
    } catch (error) {
      console.error(`Error fetching coin info for ${coin}:`, error);
      throw new Error(`Failed to fetch coin information: ${error.message}`);
    }
  }

  /**
   * Process and format raw coin data from Uniswap subgraph
   * @param {Object} rawData - Raw data from GraphQL query
   * @param {string} coin - Coin symbol
   * @param {string} poolAddress - Pool contract address
   * @returns {Object} Formatted coin information
   */
  processCoinData(rawData, coin, poolAddress) {
    const { pool, poolDayDatas } = rawData;

    // Validate required data
    if (!pool) {
      throw new Error('Pool data not found');
    }

    if (!poolDayDatas || poolDayDatas.length < 2) {
      throw new Error(
        'Insufficient historical data for 24h change calculation'
      );
    }

    // Extract and calculate metrics
    const currentPrice = parseFloat(pool.token0Price);
    const previousPrice = parseFloat(poolDayDatas[1].token0Price);
    const priceChange24h = this.calculatePriceChange24h(
      currentPrice,
      previousPrice
    );

    // Calculate volume change
    const currentVolume = parseFloat(poolDayDatas[0].volumeUSD);
    const previousVolume = parseFloat(poolDayDatas[1].volumeUSD);
    const volumeChange24h = this.calculatePriceChange24h(
      currentVolume,
      previousVolume
    );

    return {
      success: true,
      coin: coin.toUpperCase(),
      poolAddress,
      data: {
        // Token information
        token0: {
          symbol: pool.token0.symbol,
          name: pool.token0.name,
          decimals: parseInt(pool.token0.decimals),
        },
        token1: {
          symbol: pool.token1.symbol,
          name: pool.token1.name,
          decimals: parseInt(pool.token1.decimals),
        },

        // Price information
        pairName: `${pool.token0.symbol}/${pool.token1.symbol}`,
        currentPrice: currentPrice,
        priceChange24h: priceChange24h,

        // Volume and liquidity
        volume24h: currentVolume,
        volumeChange24h: volumeChange24h,
        tvl: parseFloat(pool.totalValueLockedUSD),

        // Pool details
        feeTier: parseInt(pool.feeTier),

        // Historical data
        historicalData: poolDayDatas.map((day) => ({
          date: parseInt(day.date),
          price: parseFloat(day.token0Price),
          volume: parseFloat(day.volumeUSD),
          tvl: parseFloat(day.tvlUSD),
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate 24-hour percentage change
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {number} Percentage change
   */
  calculatePriceChange24h(current, previous) {
    if (!current || !previous || previous === 0) {
      return 0;
    }

    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(4));
  }

  async getBalancesByAddress(
    address,
    networkId = 'mainnet',
    limit = 10,
    page = 1
  ) {
    // Ensure parameters are within valid ranges
    limit = Math.min(1000, Math.max(1, limit));
    page = Math.max(1, page);

    // Token API supported networks (per docs)
    const supportedNetworks = new Set([
      'arbitrum-one',
      'avalanche',
      'base',
      'bsc',
      'mainnet',
      'matic',
      'optimism',
      'unichain',
    ]);

    if (!supportedNetworks.has(networkId)) {
      throw new Error(`Unsupported network_id "${networkId}" for Token API. Use one of: ${Array.from(supportedNetworks).join(', ')}`);
    }

    // If running in the browser, route through our Next.js API to avoid CORS and keep key server-side
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/graph/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'balancesByAddress',
          params: { address, networkId, limit, page }
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        const message = result?.error || `Failed to fetch balances (${response.status})`;
        throw new Error(message);
      }
      return result.data;
    }

    // Server-side can call Token API directly
    const endpoint = `/balances/evm/${address}`;
    const params = {
      network_id: networkId,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTransferEvents(
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    orderBy = 'timestamp',
    orderDirection = 'desc',
    limit = 10,
    page = 1,
    filters = {}
  ) {
    // If running in the browser, route through our Next.js API to avoid CORS and keep key server-side
    if (typeof window !== 'undefined') {
      const normalized = { ...filters };
      if (normalized.transaction_id && !normalized.transactionId) {
        normalized.transactionId = normalized.transaction_id;
        delete normalized.transaction_id;
      }

      const response = await fetch('/api/graph/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transferEvents',
          params: {
            networkId,
            startTime,
            endTime,
            orderBy,
            orderDirection,
            limit,
            page,
            ...normalized,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        const message = result?.error || `Failed to fetch transfer events (${response.status})`;
        throw new Error(message);
      }
      return result.data;
    }

    // Server-side direct Token API call
    const endpoint = '/transfers/evm';
    const serverFilters = { ...filters };
    if (serverFilters.transactionId && !serverFilters.transaction_id) {
      serverFilters.transaction_id = serverFilters.transactionId;
      delete serverFilters.transactionId;
    }
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page,
      ...serverFilters,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getHistoricalBalances(
    address,
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    limit = 10,
    page = 1
  ) {
    const endpoint = `/historical/balances/evm/${address}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTokenHolders(
    contract,
    networkId = 'mainnet',
    orderBy = 'value',
    orderDirection = 'desc',
    limit = 10,
    page = 1
  ) {
    const endpoint = `/holders/evm/${contract}`;
    const params = {
      network_id: networkId,
      orderBy,
      orderDirection,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTokenMetadata(contract, networkId = 'mainnet') {
    const endpoint = `/tokens/evm/${contract}`;
    const params = {
      network_id: networkId,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getOHLCVByContract(
    contract,
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    limit = 10,
    page = 1
  ) {
    const endpoint = `/ohlc/prices/evm/${contract}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getOHLCVByPool(
    pool,
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    limit = 10,
    page = 1
  ) {
    const endpoint = `/ohlc/pools/evm/${pool}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getLiquidityPools(networkId = 'mainnet', limit = 10, page = 1) {
    const endpoint = '/pools/evm';
    const params = {
      network_id: networkId,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getSwapEvents(
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    orderBy = 'timestamp',
    orderDirection = 'desc',
    limit = 10,
    page = 1,
    filters = {}
  ) {
    // If running in the browser, route through our Next.js API
    if (typeof window !== 'undefined') {
      const normalized = { ...filters };
      if (normalized.transaction_id && !normalized.transactionId) {
        normalized.transactionId = normalized.transaction_id;
        delete normalized.transaction_id;
      }

      const response = await fetch('/api/graph/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swapEvents',
          params: {
            networkId,
            startTime,
            endTime,
            orderBy,
            orderDirection,
            limit,
            page,
            ...normalized,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        const message = result?.error || `Failed to fetch swap events (${response.status})`;
        throw new Error(message);
      }
      return result.data;
    }

    // Server-side direct Token API call
    const endpoint = '/swaps/evm';
    const serverFilters = { ...filters };
    if (serverFilters.transactionId && !serverFilters.transaction_id) {
      serverFilters.transaction_id = serverFilters.transactionId;
      delete serverFilters.transactionId;
    }
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page,
      ...serverFilters,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTActivities(
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    orderBy = 'timestamp',
    orderDirection = 'desc',
    limit = 10,
    page = 1
  ) {
    const endpoint = '/nft/activities/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTCollection(contract, networkId = 'mainnet') {
    const endpoint = `/nft/collections/evm/${contract}`;
    const params = {
      network_id: networkId,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTHolders(contract, networkId = 'mainnet') {
    const endpoint = `/nft/holders/evm/${contract}`;
    const params = {
      network_id: networkId,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTItems(contract, tokenId, networkId = 'mainnet') {
    const endpoint = `/nft/items/evm/contract/${contract}/token_id/${tokenId}`;
    const params = {
      network_id: networkId,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTOwnerships(address, networkId = 'mainnet', limit = 10, page = 1) {
    const endpoint = `/nft/ownerships/evm/${address}`;
    const params = {
      network_id: networkId,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTSales(
    networkId = 'mainnet',
    startTime = 0,
    endTime = 9999999999,
    orderBy = 'timestamp',
    orderDirection = 'desc',
    limit = 10,
    page = 1
  ) {
    const endpoint = '/nft/sales/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page,
    };

    return await this.makeRequest(endpoint, params);
  }
}

export default TheGraphService;
