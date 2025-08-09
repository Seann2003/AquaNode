class TheGraphService {
  constructor() {
    this.baseUrl = 'https://token-api.thegraph.com';
    this.apiKey = process.env.NEXT_PUBLIC_THE_GRAPH_API_KEY;
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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`The Graph API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getBalancesByAddress(address, networkId = 'mainnet', limit = 10, page = 1) {
    const endpoint = `/balances/evm/${address}`;
    const params = {
      network_id: networkId,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTransferEvents(networkId = 'mainnet', startTime = 0, endTime = 9999999999, orderBy = 'timestamp', orderDirection = 'desc', limit = 10, page = 1) {
    const endpoint = '/transfers/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getHistoricalBalances(address, networkId = 'mainnet', startTime = 0, endTime = 9999999999, limit = 10, page = 1) {
    const endpoint = `/historical/balances/evm/${address}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTokenHolders(contract, networkId = 'mainnet', orderBy = 'value', orderDirection = 'desc', limit = 10, page = 1) {
    const endpoint = `/holders/evm/${contract}`;
    const params = {
      network_id: networkId,
      orderBy,
      orderDirection,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getTokenMetadata(contract, networkId = 'mainnet') {
    const endpoint = `/tokens/evm/${contract}`;
    const params = {
      network_id: networkId
    };

    return await this.makeRequest(endpoint, params);
  }

  async getOHLCVByContract(contract, networkId = 'mainnet', startTime = 0, endTime = 9999999999, limit = 10, page = 1) {
    const endpoint = `/ohlc/prices/evm/${contract}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getOHLCVByPool(pool, networkId = 'mainnet', startTime = 0, endTime = 9999999999, limit = 10, page = 1) {
    const endpoint = `/ohlc/pools/evm/${pool}`;
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getLiquidityPools(networkId = 'mainnet', limit = 10, page = 1) {
    const endpoint = '/pools/evm';
    const params = {
      network_id: networkId,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getSwapEvents(networkId = 'mainnet', startTime = 0, endTime = 9999999999, orderBy = 'timestamp', orderDirection = 'desc', limit = 10, page = 1) {
    const endpoint = '/swaps/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTActivities(networkId = 'mainnet', startTime = 0, endTime = 9999999999, orderBy = 'timestamp', orderDirection = 'desc', limit = 10, page = 1) {
    const endpoint = '/nft/activities/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTCollection(contract, networkId = 'mainnet') {
    const endpoint = `/nft/collections/evm/${contract}`;
    const params = {
      network_id: networkId
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTHolders(contract, networkId = 'mainnet') {
    const endpoint = `/nft/holders/evm/${contract}`;
    const params = {
      network_id: networkId
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTItems(contract, tokenId, networkId = 'mainnet') {
    const endpoint = `/nft/items/evm/contract/${contract}/token_id/${tokenId}`;
    const params = {
      network_id: networkId
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTOwnerships(address, networkId = 'mainnet', limit = 10, page = 1) {
    const endpoint = `/nft/ownerships/evm/${address}`;
    const params = {
      network_id: networkId,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }

  async getNFTSales(networkId = 'mainnet', startTime = 0, endTime = 9999999999, orderBy = 'timestamp', orderDirection = 'desc', limit = 10, page = 1) {
    const endpoint = '/nft/sales/evm';
    const params = {
      network_id: networkId,
      startTime,
      endTime,
      orderBy,
      orderDirection,
      limit,
      page
    };

    return await this.makeRequest(endpoint, params);
  }
}

export default TheGraphService;
