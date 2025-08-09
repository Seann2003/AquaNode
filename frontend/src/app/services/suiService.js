import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui/transactions';
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
      const transactions = await this.client.queryTransactionBlocks({
        filter: { FromOrToAddress: { addr: address } },
        limit,
        order: 'descending',
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return transactions.data.map(tx => ({
        digest: tx.digest,
        timestamp: tx.timestampMs,
        sender: tx.transaction?.data?.sender,
        gasUsed: tx.effects?.gasUsed,
        status: tx.effects?.status?.status,
        type: this.getTransactionType(tx),
        changes: tx.objectChanges || [],
      }));
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      throw error;
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
    try {
      const { tokenAddress, amount, validator, autoCompound } = config;
      
      const tx = new TransactionBlock();
      
      // Get coins to stake
      const coins = await this.client.getCoins({
        owner: userAddress,
        coinType: tokenAddress,
      });

      if (coins.data.length === 0) {
        throw new Error('No coins available for staking');
      }

      // Merge coins if needed
      const coinToStake = coins.data[0];
      if (coins.data.length > 1) {
        tx.mergeCoins(coinToStake.coinObjectId, coins.data.slice(1).map(c => c.coinObjectId));
      }

      // Split the exact amount to stake
      const stakeAmount = tx.splitCoins(coinToStake.coinObjectId, [tx.pure(amount * 1e9)]);

      // Add staking transaction
      tx.moveCall({
        target: '0x3::sui_system::request_add_stake',
        arguments: [
          tx.object('0x5'), // SUI_SYSTEM_STATE_OBJECT_ID
          stakeAmount,
          tx.pure(validator),
        ],
      });

      // Execute transaction
      const keypair = Ed25519Keypair.fromSecretKey(privateKey);
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
      });

      return {
        digest: result.digest,
        status: result.effects?.status?.status,
        gasUsed: result.effects?.gasUsed,
      };
    } catch (error) {
      console.error('Staking failed:', error);
      throw error;
    }
  }

  // Swapping Operations
  async swapTokens(config, userAddress, privateKey) {
    try {
      const { fromToken, toToken, amount, slippage, dex } = config;
      
      // This would integrate with DEX protocols like Cetus, Turbos, etc.
      // For now, return a mock implementation
      const tx = new TransactionBlock();
      
      // Get coins to swap
      const coins = await this.client.getCoins({
        owner: userAddress,
        coinType: fromToken,
      });

      if (coins.data.length === 0) {
        throw new Error('No coins available for swapping');
      }

      // This is a simplified example - real implementation would depend on the specific DEX
      const result = {
        digest: 'mock_swap_digest',
        status: 'success',
        fromAmount: amount,
        toAmount: amount * 0.99, // Mock exchange rate
        slippageUsed: slippage,
      };

      return result;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
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
