'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';

export default function PrivyProvider({ children }) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        // Customize Privy configuration
        loginMethods: ['email', 'google', 'discord', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          logo: '/logo.png',
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
