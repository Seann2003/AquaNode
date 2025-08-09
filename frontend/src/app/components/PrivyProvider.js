'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';

export default function PrivyProvider({ children }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const isValidAppId = typeof appId === 'string' && appId.startsWith('app_pk_');

  if (!isValidAppId) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('Privy disabled: missing NEXT_PUBLIC_PRIVY_APP_ID (expected app_pk_...)');
    }
    // Render children without an initialized provider to avoid runtime crashes.
    return <>{children}</>;
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        // Customize Privy configuration
        loginMethods: ['email', 'google', 'discord', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          logo: '/aquanode-logo.svg',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        defaultChain: {
          id: 23295, // Oasis Sapphire Testnet
          name: 'Oasis Sapphire Testnet',
          network: 'sapphire-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'ROSE',
            symbol: 'ROSE',
          },
          rpcUrls: {
            default: {
              http: ['https://testnet.sapphire.oasis.dev'],
            },
            public: {
              http: ['https://testnet.sapphire.oasis.dev'],
            },
          },
          blockExplorers: {
            default: {
              name: 'Oasis Sapphire Explorer',
              url: 'https://testnet.explorer.sapphire.oasis.dev',
            },
          },
        },
        supportedChains: [
          {
            id: 23294, // Oasis Sapphire Mainnet
            name: 'Oasis Sapphire',
            network: 'sapphire',
            nativeCurrency: {
              decimals: 18,
              name: 'ROSE',
              symbol: 'ROSE',
            },
            rpcUrls: {
              default: {
                http: ['https://sapphire.oasis.io'],
              },
              public: {
                http: ['https://sapphire.oasis.io'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Oasis Sapphire Explorer',
                url: 'https://explorer.sapphire.oasis.io',
              },
            },
          },
          {
            id: 23295, // Oasis Sapphire Testnet
            name: 'Oasis Sapphire Testnet',
            network: 'sapphire-testnet',
            nativeCurrency: {
              decimals: 18,
              name: 'ROSE',
              symbol: 'ROSE',
            },
            rpcUrls: {
              default: {
                http: ['https://testnet.sapphire.oasis.dev'],
              },
              public: {
                http: ['https://testnet.sapphire.oasis.dev'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Oasis Sapphire Explorer',
                url: 'https://testnet.explorer.sapphire.oasis.dev',
              },
            },
          },
        ],
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
