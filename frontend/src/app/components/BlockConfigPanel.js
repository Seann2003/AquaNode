'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { blockTypes } from '../builder/page';
import ChainSelect, {
  PriceSourceSelect,
  NetworkSelect,
  NetworkIdSelect,
  CoinSelect,
} from './ChainSelect';

// Configuration schemas for different block types
const configSchemas = {
  walletBalance: [
    {
      key: 'walletAddress',
      label: 'Wallet Address',
      type: 'text',
      required: true,
    },
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      required: true,
    },
    {
      key: 'tokenType',
      label: 'Token Type',
      type: 'select',
      options: ['Native', 'All Tokens', 'Specific Token'],
      required: true,
    },
    {
      key: 'tokenAddress',
      label: 'Token Address',
      type: 'text',
      conditional: { tokenType: 'Specific Token' },
    },
    {
      key: 'includeStaked',
      label: 'Include Staked Tokens',
      type: 'checkbox',
      default: false,
    },
    {
      key: 'network',
      label: 'Network',
      type: 'select',
      options: ['mainnet', 'testnet', 'devnet'],
      default: 'mainnet',
    },
  ],
  sendEmail: [
    { key: 'to', label: 'To (comma-separated)', type: 'text', required: true },
    { key: 'cc', label: 'Cc (comma-separated)', type: 'text' },
    { key: 'bcc', label: 'Bcc (comma-separated)', type: 'text' },
    { key: 'from', label: 'From (optional, overrides default)', type: 'text' },
    { key: 'subject', label: 'Subject', type: 'text', required: true, default: 'AquaNode – {{WORKFLOW.name}} – Digest' },
    {
      key: 'body',
      label: 'Body (text)',
      type: 'textarea',
      required: true,
      default: `AquaNode workflow: {{WORKFLOW.name}} (ID: {{WORKFLOW.id}})

Summary:
{{AI.response.explanation}}

Top insights:
{{AI.response.insights}}

Recommendations:
{{AI.response.recommendations}}`,
      placeholder:
        'You can reference previous results like {{AI.response.explanation}}',
    },
    { key: 'useHtml', label: 'Body is HTML', type: 'checkbox', default: false },
    {
      key: 'provider',
      label: 'Provider',
      type: 'select',
      options: ['Resend'],
      default: 'Resend',
    },
    {
      key: 'dryRun',
      label: 'Dry run if not configured',
      type: 'checkbox',
      default: true,
    },
  ],
  walletTransaction: [
    {
      key: 'walletAddress',
      label: 'Wallet Address',
      type: 'text',
      required: true,
    },
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      required: true,
    },
    {
      key: 'limit',
      label: 'Transaction Limit',
      type: 'number',
      default: 10,
      max: 100,
    },
    {
      key: 'timeframe',
      label: 'Timeframe',
      type: 'select',
      options: ['1h', '24h', '7d', '30d', 'All'],
      default: '24h',
    },
    {
      key: 'transactionType',
      label: 'Transaction Type',
      type: 'select',
      options: ['All', 'Send', 'Receive', 'Swap', 'Stake'],
      default: 'All',
    },
    {
      key: 'network',
      label: 'Network',
      type: 'select',
      options: ['mainnet', 'testnet', 'devnet'],
      default: 'mainnet',
    },
  ],
  walletNFT: [
    {
      key: 'walletAddress',
      label: 'Wallet Address',
      type: 'text',
      required: true,
    },
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      required: true,
    },
    {
      key: 'includeNFTs',
      label: 'Include NFTs',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'includeTokens',
      label: 'Include Tokens',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'includeMetadata',
      label: 'Include Metadata',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'network',
      label: 'Network',
      type: 'select',
      options: ['mainnet', 'testnet', 'devnet'],
      default: 'mainnet',
    },
  ],
  tokenInfo: [
    {
      key: 'inputType',
      label: 'Input Type',
      type: 'select',
      options: ['Coin Symbol', 'Token Address'],
      default: 'Coin Symbol',
      required: true,
    },
    {
      key: 'coin',
      label: 'Coin Symbol',
      type: 'select',
      options: ['eth', 'pepe', 'shib'],
      conditional: { inputType: 'Coin Symbol' },
    },
    {
      key: 'tokenAddress',
      label: 'Token Address',
      type: 'text',
      conditional: { inputType: 'Token Address' },
    },
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      conditional: { inputType: 'Token Address' },
    },
    {
      key: 'includePrice',
      label: 'Include Price Data',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'includeMetrics',
      label: 'Include Metrics (Volume, Market Cap)',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'includeHolders',
      label: 'Include Holder Count',
      type: 'checkbox',
      default: false,
      conditional: { inputType: 'Token Address' },
    },
    {
      key: 'priceSource',
      label: 'Price Source',
      type: 'select',
      options: ['Uniswap V3', 'CoinGecko', 'The Graph', 'DEX'],
      default: 'Uniswap V3',
    },
    {
      key: 'network',
      label: 'Network',
      type: 'select',
      options: ['mainnet', 'testnet', 'devnet'],
      default: 'mainnet',
      conditional: { inputType: 'Token Address' },
    },
  ],
  conditional: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'select',
      options: ['Greater Than', 'Less Than', 'Equal To', 'Contains'],
      required: true,
    },
    { key: 'value', label: 'Value', type: 'text', required: true },
    { key: 'field', label: 'Field to Check', type: 'text', required: true },
  ],
  stake: [
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      required: true,
    },
    {
      key: 'tokenAddress',
      label: 'Token Address',
      type: 'text',
      required: true,
    },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    {
      key: 'validator',
      label: 'Validator Address',
      type: 'text',
      required: true,
    },
    {
      key: 'autoCompound',
      label: 'Auto Compound',
      type: 'checkbox',
      default: false,
    },
    {
      key: 'minStakeAmount',
      label: 'Minimum Stake Amount',
      type: 'number',
      default: 1,
    },
    {
      key: 'stakingPool',
      label: 'Staking Pool',
      type: 'text',
      conditional: { chain: 'Oasis Sapphire' },
    },
    {
      key: 'epochDuration',
      label: 'Epoch Duration (hours)',
      type: 'number',
      default: 24,
    },
  ],
  swap: [
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui', 'Oasis Sapphire'],
      required: true,
    },
    {
      key: 'fromToken',
      label: 'From Token Address',
      type: 'text',
      required: true,
    },
    { key: 'toToken', label: 'To Token Address', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    {
      key: 'slippage',
      label: 'Slippage (%)',
      type: 'number',
      default: 1,
      min: 0.1,
      max: 50,
    },
    {
      key: 'dex',
      label: 'DEX Protocol',
      type: 'select',
      options: ['Cetus', 'Turbos', 'Aftermath'],
      conditional: { chain: 'Sui' },
    },
    {
      key: 'dex',
      label: 'DEX Protocol',
      type: 'select',
      options: ['YuzuSwap', 'DuneSwap'],
      conditional: { chain: 'Oasis Sapphire' },
    },
    {
      key: 'deadline',
      label: 'Deadline (minutes)',
      type: 'number',
      default: 20,
    },
    { key: 'gasLimit', label: 'Gas Limit', type: 'number', default: 1000000 },
  ],
  embeddedWallet: [
    {
      key: 'chain',
      label: 'Chain',
      type: 'select',
      options: ['Sui (zkLogin)', 'Oasis Sapphire (Privy)'],
      required: true,
    },
    {
      key: 'autoConnect',
      label: 'Auto Connect',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'loginMethod',
      label: 'Login Method',
      type: 'select',
      options: ['Email', 'Google', 'Discord', 'Twitter'],
      default: 'Email',
      conditional: { chain: 'Oasis Sapphire (Privy)' },
    },
    {
      key: 'createAccount',
      label: 'Auto-create Account',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'network',
      label: 'Network',
      type: 'select',
      options: ['mainnet', 'testnet', 'devnet'],
      default: 'testnet',
    },
  ],
  aiExplanation: [
    {
      key: 'prompt',
      label: 'AI Prompt',
      type: 'textarea',
      required: true,
      placeholder: 'Explain the data or provide insights...',
    },
    {
      key: 'includeContext',
      label: 'Include Previous Block Data',
      type: 'checkbox',
      default: true,
    },
  ],
  cronjob: [
    {
      key: 'interval',
      label: 'Interval (seconds)',
      type: 'number',
      default: 5,
      min: 5,
    },
    { key: 'enabled', label: 'Enabled', type: 'checkbox', default: true },
    {
      key: 'maxRuns',
      label: 'Max Runs (0 = unlimited)',
      type: 'number',
      default: 0,
    },
  ],
  balancesByAddress: [
    { key: 'address', label: 'Wallet Address', type: 'text', required: true },
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  transferEvents: [
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'timePreset', label: 'Time Range', type: 'select', options: ['Last 1h', 'Last 24h', 'Last 7d', 'Last 30d', 'All'], default: 'Last 24h' },
    { key: 'from', label: 'From Address (optional)', type: 'text', placeholder: '0x...' },
    { key: 'to', label: 'To Address (optional)', type: 'text', placeholder: '0x...' },
    { key: 'contract', label: 'Token Contract (optional)', type: 'text', placeholder: '0x...' },
    { key: 'transactionId', label: 'Transaction ID (optional)', type: 'text', placeholder: '0x...' },
    { key: 'startTime', label: 'Start Time (UNIX seconds)', type: 'number', placeholder: 'Optional (auto-filled by Time Range)' },
    { key: 'endTime', label: 'End Time (UNIX seconds)', type: 'number', placeholder: 'Optional (auto-filled by Time Range)' },
    { key: 'orderBy', label: 'Order By', type: 'select', options: ['timestamp', 'block_num'], default: 'timestamp' },
    { key: 'orderDirection', label: 'Order Direction', type: 'select', options: ['desc', 'asc'], default: 'desc' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  tokenHolders: [
    { key: 'contract', label: 'Token Contract Address', type: 'text', required: true },
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'orderBy', label: 'Order By', type: 'select', options: ['value', 'amount'], default: 'value' },
    { key: 'orderDirection', label: 'Order Direction', type: 'select', options: ['desc', 'asc'], default: 'desc' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  tokenMetadata: [
    { key: 'contract', label: 'Token Contract Address', type: 'text', required: true, placeholder: 'e.g. 0xc944e90c64b2c07662a292be6244bdf05cda44a7 (GRT)', default: '0xc944e90c64b2c07662a292be6244bdf05cda44a7' },
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' }
  ],
  liquidityPools: [
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  swapEvents: [
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'timePreset', label: 'Time Range', type: 'select', options: ['Last 1h', 'Last 24h', 'Last 7d', 'Last 30d', 'All'], default: 'Last 24h' },
    { key: 'pool', label: 'Pool Address (optional)', type: 'text', placeholder: '0x...' },
    { key: 'protocol', label: 'Protocol (optional)', type: 'select', options: ['uniswap_v2', 'uniswap_v3', 'uniswap_v4'], default: '' },
    { key: 'caller', label: 'Caller (optional)', type: 'text', placeholder: '0x...' },
    { key: 'sender', label: 'Sender (optional)', type: 'text', placeholder: '0x...' },
    { key: 'recipient', label: 'Recipient (optional)', type: 'text', placeholder: '0x...' },
    { key: 'transactionId', label: 'Transaction ID (optional)', type: 'text', placeholder: '0x...' },
    { key: 'startTime', label: 'Start Time (UNIX seconds)', type: 'number', placeholder: 'Optional (auto-filled by Time Range)' },
    { key: 'endTime', label: 'End Time (UNIX seconds)', type: 'number', placeholder: 'Optional (auto-filled by Time Range)' },
    { key: 'orderBy', label: 'Order By', type: 'select', options: ['timestamp', 'block_num'], default: 'timestamp' },
    { key: 'orderDirection', label: 'Order Direction', type: 'select', options: ['desc', 'asc'], default: 'desc' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  nftActivities: [
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' },
    { key: 'startTime', label: 'Start Time (timestamp)', type: 'number', default: 0 },
    { key: 'endTime', label: 'End Time (timestamp)', type: 'number', default: 9999999999 },
    { key: 'orderBy', label: 'Order By', type: 'select', options: ['timestamp', 'block_num'], default: 'timestamp' },
    { key: 'orderDirection', label: 'Order Direction', type: 'select', options: ['desc', 'asc'], default: 'desc' },
    { key: 'limit', label: 'Limit', type: 'number', default: 10, max: 100 },
    { key: 'page', label: 'Page', type: 'number', default: 1, min: 1 },
  ],
  nftCollection: [
    { key: 'contract', label: 'NFT Contract Address', type: 'text', required: true },
    { key: 'networkId', label: 'Network', type: 'networkId', default: 'mainnet' }
  ]
};

export default function BlockConfigPanel({ block, onUpdate, onClose, allBlocks = [] }) {
  const [config, setConfig] = useState(block.config || {});
  const [hasChanges, setHasChanges] = useState(false);

  const blockType = blockTypes[block.type];
  const schema = useMemo(() => configSchemas[block.type] || [], [block.type]);

  const applyDefaults = useCallback(
    (cfg) => {
      const withDefaults = { ...(cfg || {}) };
      schema.forEach((field) => {
        if (withDefaults[field.key] === undefined) {
          if (field.type === 'checkbox') {
            if (field.default !== undefined)
              withDefaults[field.key] = field.default;
          } else if (field.type === 'number') {
            if (field.default !== undefined)
              withDefaults[field.key] = field.default;
          } else if (field.type === 'select' || field.type === 'networkId') {
            if (field.default !== undefined)
              withDefaults[field.key] = field.default;
          } else if (field.type === 'text' && field.default !== undefined) {
            withDefaults[field.key] = field.default;
          }
        }
      });
      return withDefaults;
    },
    [schema]
  );

  useEffect(() => {
    console.log('block', block);
    const seeded = applyDefaults(block.config || {});
    setConfig(seeded);
    setHasChanges(false);
    // Autofill time range for transferEvents based on preset
    if (block.type === 'transferEvents') {
      const preset = (seeded.timePreset || 'Last 24h');
      const now = Math.floor(Date.now() / 1000);
      const ranges = {
        'Last 1h': now - 60 * 60,
        'Last 24h': now - 24 * 60 * 60,
        'Last 7d': now - 7 * 24 * 60 * 60,
        'Last 30d': now - 30 * 24 * 60 * 60,
        'All': 0,
      };
      const start = ranges[preset] ?? (seeded.startTime || 0);
      const end = preset === 'All' ? 9999999999 : now;
      setConfig(prev => ({ ...prev, startTime: seeded.startTime || start, endTime: seeded.endTime || end }));
    }
    if (block.type === 'transferEvents' || block.type === 'swapEvents') {
      const seededCfg = seeded;
      const preset = (seededCfg.timePreset || 'Last 24h');
      const now = Math.floor(Date.now() / 1000);
      const ranges = {
        'Last 1h': now - 60 * 60,
        'Last 24h': now - 24 * 60 * 60,
        'Last 7d': now - 7 * 24 * 60 * 60,
        'Last 30d': now - 30 * 24 * 60 * 60,
        'All': 0,
      };
      const start = ranges[preset] ?? (seededCfg.startTime || 0);
      const end = preset === 'All' ? 9999999999 : now;
      setConfig(prev => ({ ...prev, startTime: seededCfg.startTime || start, endTime: seededCfg.endTime || end }));
    }
    if (block.type !== 'walletBalance') return;
    const network = config.network || 'mainnet';
    if (network !== 'mainnet' && config.tokenType === 'Specific Token') {
      setConfig((prev) => ({ ...prev, tokenType: 'All Tokens' }));
      setHasChanges(true);
    }
    if (network !== 'mainnet' || config.tokenType !== 'Specific Token') {
      if (config.tokenAddress) {
        setConfig((prev) => ({ ...prev, tokenAddress: '' }));
        setHasChanges(true);
      }
    }
  }, [
    block,
    block.type,
    config.network,
    config.tokenType,
    config.tokenAddress,
    applyDefaults,
  ]);

  const handleConfigChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const finalConfig = applyDefaults(config);
    onUpdate({ config: finalConfig });
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(block.config || {});
    setHasChanges(false);
  };

  // Helpers for Conditional block UX (define hooks before early returns)
  const previousBlocks = useMemo(() => {
    const idx = (allBlocks || []).findIndex((b) => b.id === block.id);
    return (allBlocks || []).slice(0, idx >= 0 ? idx : 0);
  }, [allBlocks, block.id]);

  if (!blockType) return null;

  const Icon = blockType.icon;

  const getPresetsForType = (type) => {
    switch (type) {
      case 'balancesByAddress':
        return [
          { label: 'Native balance < 0.1', field: 'previous.data.0.value', condition: 'Less Than', value: '0.1' },
          { label: 'Has at least 1 token', field: 'previous.metadata.totalResults', condition: 'Greater Than', value: '0' },
        ];
      case 'transferEvents':
        return [
          { label: 'Any transfer > 10,000', field: 'previous.data.0.value', condition: 'Greater Than', value: '10000' },
          { label: 'From specific address', field: 'previous.data.0.from', condition: 'Contains', value: '0x' },
        ];
      case 'swapEvents':
        return [
          { label: 'Swap value > 1,000', field: 'previous.data.0.value1', condition: 'Greater Than', value: '1000' },
          { label: 'Protocol is Uniswap V3', field: 'previous.data.0.protocol', condition: 'Contains', value: 'uniswap_v3' },
        ];
      case 'tokenMetadata':
        return [
          { label: 'Holders > 10,000', field: 'previous.data.0.holders', condition: 'Greater Than', value: '10000' },
          { label: 'Decimals == 18', field: 'previous.data.0.decimals', condition: 'Equal To', value: '18' },
        ];
      default:
        return [];
    }
  };

  const shouldRenderField = (field) => {
    if (block.type === 'tokenInfo') {
      if (field.key === 'coin' && config.inputType !== 'Coin Symbol')
        return false;
      if (field.key === 'tokenAddress' && config.inputType !== 'Token Address')
        return false;
      if (field.key === 'chain' && config.inputType !== 'Token Address')
        return false;
      if (field.key === 'network' && config.inputType !== 'Token Address')
        return false;
      if (
        field.key === 'includeHolders' &&
        config.inputType !== 'Token Address'
      )
        return false;
    }
    if (field.key === 'tokenAddress' && block.type === 'walletBalance') {
      if ((config.network || 'mainnet') !== 'mainnet') return false;
    }
    if (!field.conditional) return true;
    return Object.entries(field.conditional).every(([k, v]) => config[k] === v);
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='p-4 border-b border-border'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div
              className={`w-10 h-10 ${blockType.color} rounded-lg flex items-center justify-center`}
            >
              <Icon className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='font-semibold text-foreground'>{block.name}</h3>
              <p className='text-sm text-foreground/70'>{blockType.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
        <p className='text-sm text-foreground/70'>{blockType.description}</p>
      </div>

      {/* Configuration Form */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-4'>
          {/* Conditional block helper UI */}
          {block.type === 'conditional' && (
            <div className='space-y-3 p-3 rounded border border-border bg-background/50'>
              <div className='text-sm text-foreground/70'>Quick presets based on previous blocks</div>
              <div className='space-y-2'>
                {previousBlocks.length === 0 && (
                  <div className='text-xs text-foreground/50'>Add a data block before this conditional to enable presets.</div>
                )}
                {previousBlocks.map((pb) => (
                  <div key={pb.id} className='space-y-1'>
                    <div className='text-xs text-foreground/60'>{pb.name} ({pb.type})</div>
                    <div className='flex flex-wrap gap-2'>
                      {getPresetsForType(pb.type).map((p, i) => (
                        <button
                          key={i}
                          type='button'
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, field: p.field, condition: p.condition, value: p.value }));
                            setHasChanges(true);
                          }}
                          className='px-2 py-1 text-xs bg-border hover:bg-hover rounded'
                          title={`${p.field} ${p.condition} ${p.value}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className='pt-2 border-t border-border'>
                <button
                  type='button'
                  className='text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded'
                  onClick={() => {
                    // Simple evaluator preview using lastResult from previous block in local state (if present in runtime UI)
                    alert('Use Run Once to test the condition against live data.');
                  }}
                >
                  Test condition
                </button>
              </div>
            </div>
          )}

          {schema.map((field) => {
            if (!shouldRenderField(field)) return null;
            return (
              <div key={field.key}>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  {field.label}
                  {field.required && (
                    <span className='text-red-500 ml-1'>*</span>
                  )}
                </label>

                {field.type === 'text' && (
                  <input
                    type='text'
                    value={config[field.key] || ''}
                    onChange={(e) =>
                      handleConfigChange(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className='w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground'
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type='number'
                    value={config[field.key] || field.default || ''}
                    onChange={(e) =>
                      handleConfigChange(
                        field.key,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={field.min}
                    className='w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground'
                  />
                )}

                {field.type === 'select' && field.key === 'chain' && (
                  <ChainSelect
                    value={config[field.key] || field.default || ''}
                    onChange={(value) => handleConfigChange(field.key, value)}
                    options={field.options}
                    placeholder={`Select ${field.label}`}
                    required={field.required}
                  />
                )}

                {field.type === 'select' && field.key === 'priceSource' && (
                  <PriceSourceSelect
                    value={config[field.key] || field.default || ''}
                    onChange={(value) => handleConfigChange(field.key, value)}
                  />
                )}

                {/* Specialized CoinSelect for tokenInfo coin symbol */}
                {field.type === 'select' && block.type === 'tokenInfo' && field.key === 'coin' && (
                  <CoinSelect
                    value={config[field.key] || field.default || ''}
                    onChange={(value) => handleConfigChange(field.key, value)}
                    options={(Array.isArray(field.options) ? field.options : ['eth','pepe','shib']).map(o => o.toUpperCase())}
                  />
                )}

                {field.type === 'select' && field.key === 'network' && (
                  <NetworkSelect
                    value={config[field.key] || field.default || ''}
                    onChange={(value) => handleConfigChange(field.key, value)}
                  />
                )}

                {field.type === 'select' &&
                  !['chain', 'priceSource', 'network', 'coin'].includes(field.key) && (
                    <select
                      value={config[field.key] || field.default || ''}
                      onChange={(e) =>
                        handleConfigChange(field.key, e.target.value)
                      }
                      className='w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground'
                    >
                      <option value=''>Select {field.label}</option>
                      {(block.type === 'walletBalance' &&
                      field.key === 'tokenType'
                        ? (config.network || 'mainnet') === 'mainnet'
                          ? field.options
                          : field.options.filter((o) => o !== 'Specific Token')
                        : field.options
                      ).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                {field.type === 'networkId' && (
                  <NetworkIdSelect
                    value={config[field.key] || field.default || ''}
                    onChange={(value) => handleConfigChange(field.key, value)}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={config[field.key] || ''}
                    onChange={(e) =>
                      handleConfigChange(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    rows={4}
                    className='w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none'
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={
                        config[field.key] !== undefined
                          ? config[field.key]
                          : field.default
                      }
                      onChange={(e) =>
                        handleConfigChange(field.key, e.target.checked)
                      }
                      className='w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2'
                    />
                    <span className='text-sm text-foreground/70'>
                      Enable this option
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className='p-4 border-t border-border'>
        <div className='flex items-center justify-between'>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className='px-4 py-2 text-sm text-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className='flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors'
          >
            <Save className='w-4 h-4' />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
