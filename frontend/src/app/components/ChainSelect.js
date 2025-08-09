'use client';

import ChainLogo from './ChainLogo';

export default function ChainSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select Chain",
  className = "",
  required = false 
}) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full pl-12 pr-8 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground appearance-none ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      
      {/* Chain logo overlay */}
      {value && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChainLogo chain={value} size={20} />
        </div>
      )}
      
      {/* Dropdown arrow */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// Specialized components for different use cases
export function PriceSourceSelect({ value, onChange, className = "" }) {
  const options = ['CoinGecko', 'The Graph', 'DEX'];
  
  return (
    <ChainSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select Price Source"
      className={className}
    />
  );
}

export function NetworkSelect({ value, onChange, className = "" }) {
  const options = ['mainnet', 'testnet', 'devnet'];
  
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ${className}`}
    >
      <option value="">Select Network</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
}

// NetworkIdSelect: shows EVM network ids with logos and capitalized labels
export function NetworkIdSelect({ value, onChange, className = "" }) {
  // Token API supported EVM network_ids and friendly names
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
  const ids = Object.keys(idToName);

  const currentName = idToName[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-12 pr-8 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground appearance-none ${className}`}
      >
        <option value="">Select Network</option>
        {ids.map((id) => (
          <option key={id} value={id}>
            {idToName[id]}
          </option>
        ))}
      </select>

      {value && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChainLogo chain={currentName} size={20} />
        </div>
      )}

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// CoinSelect: specialized selector for coin symbols with left logo badge
// It reuses ChainLogo; for unknown symbols it shows a colored circle with first letter
export function CoinSelect({ value, onChange, options = [], className = "" }) {
  const normalized = (value || '').toUpperCase();
  const displayOptions = options.length ? options : ['ETH', 'PEPE', 'SHIB'];

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-12 pr-8 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground appearance-none ${className}`}
      >
        <option value="">Select Coin Symbol</option>
        {displayOptions.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt.toUpperCase()}</option>
        ))}
      </select>

      {value && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChainLogo chain={normalized} size={20} />
        </div>
      )}

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
