'use client';

import Image from 'next/image';

const CHAIN_LOGOS = {
  'Sui': 'https://assets.crypto.ro/logos/sui-sui-logo.png',
  'Oasis Sapphire': 'https://cdn.prod.website-files.com/614c99cf4f23700c8aa3752a/678956f64329d5ac19622b33_Oasis%20Sapphire.png',
  'The Graph': 'https://s2.coinmarketcap.com/static/img/coins/200x200/6719.png',
  'CoinGecko': 'https://play-lh.googleusercontent.com/2wCIQWu9gHP2vp2cvhJEcFw2ys7uuZV2wL0qZrENyE-iOEzYJHcdLHChr2lQ7R3YxYQ',
  'Ethereum': '/eth.png',
  'Sepolia': '/eth.png',
  'Polygon': '/polygon.png',
  'Arbitrum': '/arbitrum.png',
  'Optimism': '/optimism.png'
};

export default function ChainLogo({ 
  chain, 
  size = 24, 
  className = '', 
  showName = false,
  fallbackColor = 'bg-gray-500' 
}) {
  const logoUrl = CHAIN_LOGOS[chain];
  
  if (!logoUrl) {
    // Fallback to colored circle with first letter
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div 
          className={`${fallbackColor} rounded-full flex items-center justify-center text-white font-semibold`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {chain?.charAt(0) || '?'}
        </div>
        {showName && <span className="text-sm font-medium">{chain}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={logoUrl}
          alt={`${chain} logo`}
          fill
          className="rounded-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div 
          className={`${fallbackColor} rounded-full flex items-center justify-center text-white font-semibold`}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.4,
            display: 'none'
          }}
        >
          {chain?.charAt(0) || '?'}
        </div>
      </div>
      {showName && <span className="text-sm font-medium">{chain}</span>}
    </div>
  );
}

// Specialized components for specific use cases
export function SuiLogo({ size = 24, className = '', showName = false }) {
  return (
    <ChainLogo 
      chain="Sui" 
      size={size} 
      className={className} 
      showName={showName}
      fallbackColor="bg-blue-500"
    />
  );
}

export function OasisLogo({ size = 24, className = '', showName = false }) {
  return (
    <ChainLogo 
      chain="Oasis Sapphire" 
      size={size} 
      className={className} 
      showName={showName}
      fallbackColor="bg-purple-500"
    />
  );
}

export function TheGraphLogo({ size = 24, className = '', showName = false }) {
  return (
    <ChainLogo 
      chain="The Graph" 
      size={size} 
      className={className} 
      showName={showName}
      fallbackColor="bg-indigo-500"
    />
  );
}

export function CoinGeckoLogo({ size = 24, className = '', showName = false }) {
  return (
    <ChainLogo 
      chain="CoinGecko" 
      size={size} 
      className={className} 
      showName={showName}
      fallbackColor="bg-green-500"
    />
  );
}

// Chain badge component for displaying multiple chains
export function ChainBadge({ chain, size = 'sm' }) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const logoSize = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24
  };

  const chainColors = {
    'Sui': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Oasis Sapphire': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'The Graph': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'CoinGecko': 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  return (
    <div className={`
      inline-flex items-center space-x-1.5 rounded-full border
      ${sizeClasses[size]} 
      ${chainColors[chain] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
    `}>
      <ChainLogo chain={chain} size={logoSize[size]} />
      <span className="font-medium">{chain}</span>
    </div>
  );
}

// Badge for The Graph Token API EVM network_ids
export function GraphNetworkBadge({ networkId, size = 'sm' }) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const logoSize = { xs: 12, sm: 16, md: 20, lg: 24 };

  const idToName = {
    'mainnet': 'Ethereum',
    'arbitrum-one': 'Arbitrum One',
    'avalanche': 'Avalanche',
    'base': 'Base',
    'bsc': 'BNB Smart Chain',
    'matic': 'Polygon',
    'optimism': 'Optimism',
    'unichain': 'Unichain',
  };

  // Map network_id to a ChainLogo key for the icon
  const idToLogoChain = {
    'mainnet': 'Ethereum',
    'arbitrum-one': 'Arbitrum',
    'matic': 'Polygon',
    'optimism': 'Optimism',
  };

  const networkName = idToName[networkId] || (networkId || 'Network');
  const logoChain = idToLogoChain[networkId] || networkName;

  const networkColors = {
    'mainnet': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'arbitrum-one': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'matic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'optimism': 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`inline-flex items-center space-x-1.5 rounded-full border ${sizeClasses[size]} ${networkColors[networkId] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      <ChainLogo chain={logoChain} size={logoSize[size]} />
      <span className="font-medium">{networkName}</span>
    </div>
  );
}
