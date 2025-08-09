'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Wallet, LogIn, LogOut, User, Shield } from 'lucide-react';
import SuiService from '../services/suiService';

export default function EmbeddedWallet({ config, onWalletConnected, onWalletDisconnected }) {
  const [suiService] = useState(() => new SuiService(config?.network || 'testnet'));
  const [suiWallet, setSuiWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Privy hooks for Oasis
  const { 
    ready: privyReady, 
    authenticated: privyAuthenticated, 
    user: privyUser, 
    login: privyLogin, 
    logout: privyLogout 
  } = usePrivy();
  
  const { wallets: privyWallets } = useWallets();

  const isOasisChain = config?.chain === 'Oasis Sapphire (Privy)';
  const isSuiChain = config?.chain === 'Sui (zkLogin)';

  // Sui zkLogin handlers (Google only)
  const handleSuiLogin = async () => {
    if (!isSuiChain) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const zkLoginData = await suiService.initializeZkLogin();
      
      // Open login popup
      const popup = window.open(
        zkLoginData.loginUrl,
        'zkLogin',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the callback
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'ZKLOGIN_SUCCESS') {
          popup?.close();
          
          try {
            const walletData = await suiService.completeZkLogin(event.data.jwt);
            setSuiWallet(walletData);
            onWalletConnected?.({
              chain: 'Sui',
              address: walletData.address,
              type: 'zkLogin',
              provider: 'Google',
            });
          } catch (error) {
            setError('Failed to complete zkLogin: ' + error.message);
          }
        } else if (event.data.type === 'ZKLOGIN_ERROR') {
          popup?.close();
          setError('zkLogin failed: ' + event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      setError('Failed to initialize zkLogin: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSuiLogout = () => {
    setSuiWallet(null);
    onWalletDisconnected?.();
  };

  // Oasis Privy handlers
  const handleOasisLogin = async () => {
    if (!isOasisChain || !privyReady) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      await privyLogin();
    } catch (error) {
      setError('Failed to login with Privy: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOasisLogout = async () => {
    try {
      await privyLogout();
      onWalletDisconnected?.();
    } catch (error) {
      setError('Failed to logout: ' + error.message);
    }
  };

  // Effect to handle Privy authentication changes
  useEffect(() => {
    if (isOasisChain && privyAuthenticated && privyUser && privyWallets.length > 0) {
      const wallet = privyWallets[0];
      onWalletConnected?.({
        chain: 'Oasis Sapphire',
        address: wallet.address,
        type: 'privy',
        provider: 'email', // or detect from privyUser
        user: privyUser,
        wallet: wallet,
      });
    }
  }, [isOasisChain, privyAuthenticated, privyUser, privyWallets, onWalletConnected]);

  // Auto-connect logic
  useEffect(() => {
    if (config?.autoConnect) {
      if (isSuiChain && !suiWallet) {
        // Check for existing zkLogin session
        const savedWallet = localStorage.getItem('sui_zklogin_wallet');
        if (savedWallet) {
          try {
            const walletData = JSON.parse(savedWallet);
            setSuiWallet(walletData);
            onWalletConnected?.(walletData);
          } catch (error) {
            console.error('Failed to restore Sui wallet:', error);
          }
        }
      }
    }
  }, [config?.autoConnect, isSuiChain, suiWallet, onWalletConnected]);

  // Save Sui wallet to localStorage
  useEffect(() => {
    if (suiWallet) {
      localStorage.setItem('sui_zklogin_wallet', JSON.stringify(suiWallet));
    } else {
      localStorage.removeItem('sui_zklogin_wallet');
    }
  }, [suiWallet]);

  const renderSuiWallet = () => {
    if (suiWallet) {
      return (
        <div className="workflow-node p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sui zkLogin</h3>
                <p className="text-sm text-foreground/70">Connected via Google</p>
              </div>
            </div>
            <button
              onClick={handleSuiLogout}
              className="p-2 text-foreground/70 hover:text-red-500 hover:bg-hover rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">Address:</span>
              <span className="text-foreground font-mono">
                {suiWallet.address.slice(0, 6)}...{suiWallet.address.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">Network:</span>
              <span className="text-foreground">{config?.network || 'testnet'}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="workflow-node p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Sui zkLogin</h3>
          <p className="text-sm text-foreground/70 mb-4">
            Connect using Google authentication
          </p>
          <button
            onClick={handleSuiLogin}
            disabled={isConnecting}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{isConnecting ? 'Connecting...' : 'Connect with zkLogin'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderOasisWallet = () => {
    if (privyAuthenticated && privyUser && privyWallets.length > 0) {
      const wallet = privyWallets[0];
      
      return (
        <div className="workflow-node p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Oasis Privy</h3>
                <p className="text-sm text-foreground/70">Connected via {privyUser.email?.address || 'email'}</p>
              </div>
            </div>
            <button
              onClick={handleOasisLogout}
              className="p-2 text-foreground/70 hover:text-red-500 hover:bg-hover rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">Address:</span>
              <span className="text-foreground font-mono">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">Chain:</span>
              <span className="text-foreground">Oasis Sapphire</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">User:</span>
              <span className="text-foreground">{privyUser.email?.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="workflow-node p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Oasis Privy</h3>
          <p className="text-sm text-foreground/70 mb-4">
            Connect using {config?.loginMethod || 'email'} authentication
          </p>
          <button
            onClick={handleOasisLogin}
            disabled={isConnecting || !privyReady}
            className="w-full flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{isConnecting ? 'Connecting...' : 'Connect with Privy'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      {isSuiChain && renderSuiWallet()}
      {isOasisChain && renderOasisWallet()}
    </div>
  );
}
