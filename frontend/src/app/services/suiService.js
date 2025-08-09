import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey, jwtToAddress } from '@mysten/sui/zklogin';

class SuiService {
  constructor(network = 'testnet') {
    this.network = network;
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.zkLoginSetup = null;
  }

  // zkLogin Setup (Google only)
  async initializeZkLogin() {
    try {
      const { epoch } = await this.client.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2;
      const ephemeralKeyPair = new Ed25519Keypair();
      const randomness = generateRandomness();
      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

      this.zkLoginSetup = {
        provider: 'Google',
        maxEpoch,
        ephemeralKeyPair,
        randomness,
        nonce,
      };

      return {
        nonce,
        loginUrl: this.getGoogleLoginUrl(nonce),
      };
    } catch (error) {
      console.error('zkLogin initialization failed:', error);
      throw error;
    }
  }

  getGoogleLoginUrl(nonce) {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    return `https://accounts.google.com/oauth/v2/auth?client_id=${clientId}&response_type=id_token&redirect_uri=${redirectUrl}&scope=openid&nonce=${nonce}`;
  }

  async completeZkLogin(jwt) {
    if (!this.zkLoginSetup) {
      throw new Error('zkLogin not initialized');
    }

    try {
      const userAddr = jwtToAddress(jwt, this.zkLoginSetup.randomness);
      
      return {
        address: userAddr,
        jwt,
        ephemeralKeyPair: this.zkLoginSetup.ephemeralKeyPair,
        maxEpoch: this.zkLoginSetup.maxEpoch,
      };
    } catch (error) {
      console.error('zkLogin completion failed:', error);
      throw error;
    }
  }

  // Wallet Operations
  async getWalletBalance(address, tokenType = 'All Tokens', tokenAddress = null) {
    try {
      if (tokenType === 'Native') {
        const balance = await this.client.getBalance({ owner: address });
        return {
          native: {
            coinType: '0x2::sui::SUI',
            balance: balance.totalBalance,
            formatted: (parseInt(balance.totalBalance) / 1e9).toFixed(4),
          }
        };
      }

      if (tokenType === 'Specific Token' && tokenAddress) {
        const balance = await this.client.getBalance({ 
          owner: address, 
          coinType: tokenAddress 
        });
        return {
          [tokenAddress]: {
            coinType: tokenAddress,
            balance: balance.totalBalance,
            formatted: (parseInt(balance.totalBalance) / 1e9).toFixed(4),
          }
        };
      }

      // Get all coins
      const coins = await this.client.getAllCoins({ owner: address });
      const balances = {};

      coins.data.forEach(coin => {
        if (!balances[coin.coinType]) {
          balances[coin.coinType] = {
            coinType: coin.coinType,
            balance: '0',
            count: 0,
          };
        }
        balances[coin.coinType].balance = (
          parseInt(balances[coin.coinType].balance) + parseInt(coin.balance)
        ).toString();
        balances[coin.coinType].count++;
      });

      // Format balances
      Object.keys(balances).forEach(coinType => {
        balances[coinType].formatted = (parseInt(balances[coinType].balance) / 1e9).toFixed(4);
      });

      return balances;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  async getWalletTransactions(address, limit = 10, transactionType = 'All') {
    try {
      const options = {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      };

      const [fromRes, toRes] = await Promise.all([
        this.client.queryTransactionBlocks({
          filter: { FromAddress: address },
          limit,
          order: 'descending',
          options,
        }),
        this.client.queryTransactionBlocks({
          filter: { ToAddress: address },
          limit,
          order: 'descending',
          options,
        }),
      ]);

      const combined = [...(fromRes?.data || []), ...(toRes?.data || [])];
      // Dedupe by digest and sort by timestampMs desc
      const seen = new Set();
      const deduped = combined.filter(tx => {
        if (seen.has(tx.digest)) return false;
        seen.add(tx.digest);
        return true;
      });
      deduped.sort((a, b) => (parseInt(b.timestampMs || 0) - parseInt(a.timestampMs || 0)));

      return deduped.slice(0, limit).map(tx => ({
        digest: tx.digest,
        timestamp: tx.timestampMs,
        sender: tx.transaction?.data?.sender,
        gasUsed: tx.effects?.gasUsed,
        status: tx.effects?.status?.status,
        type: this.getTransactionType(tx),
        changes: tx.objectChanges || [],
      }));
    } catch (error) {
      console.error('Failed to get wallet transactions (Sui):', error);
      return [];
    }
  }

  async getWalletNFTsAndTokens(address, includeNFTs = true, includeTokens = true) {
    try {
      const result = {};

      if (includeTokens) {
        result.tokens = await this.getWalletBalance(address);
      }

      if (includeNFTs) {
        const objects = await this.client.getOwnedObjects({
          owner: address,
          options: {
            showType: true,
            showContent: true,
            showDisplay: true,
          },
        });

        result.nfts = objects.data
          .filter(obj => obj.data?.type && !obj.data.type.includes('::coin::Coin'))
          .map(obj => ({
            objectId: obj.data.objectId,
            type: obj.data.type,
            display: obj.data.display,
            content: obj.data.content,
          }));
      }

      return result;
    } catch (error) {
      console.error('Failed to get wallet NFTs and tokens:', error);
      throw error;
    }
  }

  // Token Operations
  async getTokenInfo(tokenAddress, includePrice = true, includeMetrics = true) {
    try {
      // Get token metadata
      const coinMetadata = await this.client.getCoinMetadata({ coinType: tokenAddress });
      
      const result = {
        address: tokenAddress,
        name: coinMetadata?.name,
        symbol: coinMetadata?.symbol,
        decimals: coinMetadata?.decimals,
        description: coinMetadata?.description,
        iconUrl: coinMetadata?.iconUrl,
      };

      if (includePrice) {
        // In a real implementation, you'd call CoinGecko or other price APIs
        result.price = await this.getTokenPrice(tokenAddress);
      }

      if (includeMetrics) {
        // Get supply information
        const supply = await this.client.getTotalSupply({ coinType: tokenAddress });
        result.totalSupply = supply.value;
      }

      return result;
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  async getTokenPrice(tokenAddress) {
    // This would integrate with CoinGecko API or other price sources
    // For now, return mock data
    return {
      usd: 0,
      change24h: 0,
      marketCap: 0,
      volume24h: 0,
    };
  }

  // Staking Operations
  async stakeTokens(config, userAddress, privateKey) {
    // Not implemented in client: requires signer and up-to-date Sui SDK tx API.
    // Keep method to satisfy interface; throw to indicate unsupported.
    throw new Error('Sui staking is not implemented in this client build');
  }

  // Swapping Operations
  async swapTokens(config, userAddress, privateKey) {
    // Not implemented in client: requires signer and DEX integration.
    throw new Error('Sui swap is not implemented in this client build');
  }

  // Helper Methods
  getTransactionType(tx) {
    // Analyze transaction to determine type
    if (tx.transaction?.data?.transaction?.kind === 'ProgrammableTransaction') {
      const commands = tx.transaction.data.transaction.commands;
      if (commands.some(cmd => cmd.MoveCall?.function === 'request_add_stake')) {
        return 'Stake';
      }
      if (commands.some(cmd => cmd.MoveCall?.function === 'swap')) {
        return 'Swap';
      }
    }
    return 'Transfer';
  }

  async getValidators() {
    try {
      const systemState = await this.client.getLatestSuiSystemState();
      return systemState.activeValidators.map(validator => ({
        address: validator.suiAddress,
        name: validator.name,
        stakingPoolId: validator.stakingPoolId,
        commission: validator.commissionRate,
      }));
    } catch (error) {
      console.error('Failed to get validators:', error);
      throw error;
    }
  }
}

export default SuiService;
