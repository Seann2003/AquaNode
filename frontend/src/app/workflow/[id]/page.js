'use client';

import { useState, useEffect, useCallback, use as useAwait } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Edit, 
  Settings, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  BarChart3,
  Activity
} from 'lucide-react';
import { blockTypes } from '../../builder/page';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { getWorkflow as lsGetWorkflow, upsertWorkflow as lsUpsertWorkflow } from '../../services/localWorkflowService';
import WorkflowEngine from '../../services/workflowEngine';
import { ChainBadge, GraphNetworkBadge } from '../../components/ChainLogo';

// Mock workflow data
const mockWorkflowData = {
  1: {
    id: 1,
    name: 'DeFi Portfolio Monitor',
    description: 'Monitor wallet balance and get AI insights on portfolio performance',
    status: 'active',
    created: '2024-01-15',
    lastRun: '2 minutes ago',
    nextRun: 'in 3 minutes',
    chains: ['Sui', 'Oasis Sapphire'],
    totalRuns: 1247,
    successRate: 98.5,
    blocks: [
      {
        id: 'wallet-1',
        type: 'walletBalance',
        name: 'Get Portfolio Balance',
        config: {
          walletAddress: '0x1234...5678',
          chain: 'Sui',
          tokenType: 'All Tokens'
        },
        status: 'success',
        lastExecution: '2 minutes ago',
        executionTime: '1.2s'
      },
      {
        id: 'ai-1',
        type: 'aiExplanation',
        name: 'Portfolio Analysis',
        config: {
          prompt: 'Analyze the portfolio balance and provide insights on performance and recommendations',
          includeContext: true,
          model: 'GPT-4'
        },
        status: 'success',
        lastExecution: '2 minutes ago',
        executionTime: '3.4s'
      },
      {
        id: 'conditional-1',
        type: 'conditional',
        name: 'Check Performance',
        config: {
          condition: 'Greater Than',
          value: '5',
          field: 'portfolio_change_percent'
        },
        status: 'success',
        lastExecution: '2 minutes ago',
        executionTime: '0.1s'
      }
    ],
    executionHistory: [
      { timestamp: '2024-01-20 10:30:00', status: 'success', duration: '4.7s', result: 'Portfolio up 7.2%' },
      { timestamp: '2024-01-20 10:25:00', status: 'success', duration: '4.1s', result: 'Portfolio up 6.8%' },
      { timestamp: '2024-01-20 10:20:00', status: 'success', duration: '5.2s', result: 'Portfolio up 6.5%' },
      { timestamp: '2024-01-20 10:15:00', status: 'error', duration: '2.1s', result: 'API timeout' },
      { timestamp: '2024-01-20 10:10:00', status: 'success', duration: '3.9s', result: 'Portfolio up 6.1%' }
    ]
  }
};

export default function WorkflowPage({ params }) {
  const { authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const { id } = useAwait(params);
  const [workflow, setWorkflow] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editableName, setEditableName] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [autoRun, setAutoRun] = useState(false);

  const normalizeAI = (aiObj) => {
    if (!aiObj) return null;
    const a = aiObj;
    const isNested = a?.response && (a.response.explanation || a.response.rawResponse || (a.response.insights?.length) || (a.response.recommendations?.length));
    return isNested ? a.response : a;
  };

  const shorten = (text, maxLen = 120) => {
    if (!text) return '';
    const s = String(text);
    return s.length > maxLen ? `${s.slice(0, maxLen)}...` : s;
  };

  const networkIdToName = (id) => {
    const map = {
      mainnet: 'Ethereum',
      'arbitrum-one': 'Arbitrum One',
      avalanche: 'Avalanche',
      base: 'Base',
      bsc: 'BNB Smart Chain',
      matic: 'Polygon',
      optimism: 'Optimism',
      unichain: 'Unichain',
      sepolia: 'Sepolia', // fallback if encountered elsewhere
      polygon: 'Polygon', // fallback
      arbitrum: 'Arbitrum', // fallback
    };
    return map[id] || id;
  };

  const formatUnitsLoose = (value, decimals = 18) => {
    try {
      const v = typeof value === 'string' ? Number(value) : (typeof value === 'number' ? value : 0);
      if (!isFinite(v)) return '0';
      const denom = Math.pow(10, Number(decimals) || 0);
      const num = denom === 0 ? v : v / denom;
      if (num === 0) return '0';
      if (num >= 1) return num.toFixed(4).replace(/\.0+$/, '');
      return num.toPrecision(4);
    } catch {
      return String(value ?? '0');
    }
  };

  const fetchWorkflow = useCallback(async () => {
    try {
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      const local = lsGetWorkflow(userId, id);
      if (local) setWorkflow(local);
      else setWorkflow(mockWorkflowData[id] || null);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      setWorkflow(lsGetWorkflow(userId, id) || mockWorkflowData[id] || null);
    }
  }, [id, user]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/');
      return;
    }
    fetchWorkflow();
  }, [fetchWorkflow, ready, authenticated, router]);

  useEffect(() => {
    if (workflow) {
      setEditableName(workflow.name || '');
      setEditableDescription(workflow.description || '');
      setAutoRun(workflow.status === 'active');
    }
  }, [workflow]);

  const handleToggleWorkflow = async () => {
    setIsRunning(true);
    try {
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workflow,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setWorkflow(prev => ({
          ...prev,
          status: newStatus
        }));
        console.log('Workflow status updated:', response);
      } else {
        alert('Failed to update workflow status');
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('Failed to update workflow status');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunOnce = async () => {
    if (!workflow) return;
    setIsRunning(true);
    const runStartMs = Date.now();
    try {
      const engine = new WorkflowEngine();
      // For now, we do not require connected signers for read-only blocks
      const userWallets = {};
      const execution = await engine.executeWorkflow(workflow, userWallets);

      const durationSeconds = ((Date.now() - runStartMs) / 1000).toFixed(1) + 's';

      const summarizeBalance = (balanceObj, chain) => {
        if (!balanceObj || typeof balanceObj !== 'object') return 'No balance data';
        // Prefer native balance if present
        if (balanceObj.native) {
          const symbol = balanceObj.native.symbol || (chain?.includes('Oasis') ? 'ROSE' : chain?.includes('Sui') ? 'SUI' : 'Native');
          return `${balanceObj.native.formatted ?? balanceObj.native.balance} ${symbol}`;
        }
        // Otherwise, take up to two tokens
        const entries = Object.entries(balanceObj).slice(0, 2).map(([key, val]) => {
          const amount = val.formatted ?? val.balance ?? '0';
          const symbol = val.symbol || key.split('::').pop();
          return `${amount} ${symbol}`;
        });
        return entries.length ? entries.join(', ') : 'No balance data';
      };

      let latestAI = null;
      let aiPreview = null;
      const summaryLines = execution.results.map(r => {
        if (r.blockType === 'walletBalance' || r.result?.type === 'wallet_balance') {
          const base = r.result?.type ? r.result : r.result?.result;
          const short = summarizeBalance(base?.balance, base?.chain || r.blockName);
          const shortAddr = (base?.address || '').slice(0, 6);
          return `Balance (${base?.chain || 'chain'} ${shortAddr ? shortAddr + '...' : ''}): ${short}`;
        }
        if (r.blockType === 'balancesByAddress') {
          const base = r.result?.type ? r.result : r.result;
          const arr = Array.isArray(base?.data?.data) ? base.data.data : (Array.isArray(base?.data) ? base.data : []);
          const parts = (arr || []).slice(0, 2).map((it) => {
            const symbol = it?.symbol || it?.token?.symbol || 'TOKEN';
            const decimals = it?.decimals ?? it?.token?.decimals ?? 18;
            const raw = it?.formattedBalance ?? it?.value ?? it?.amount ?? it?.balance ?? 0;
            const amount = typeof raw === 'string' && raw.includes('.') ? raw : formatUnitsLoose(raw, decimals);
            return `${amount} ${symbol}`;
          });
          const addr = base?.metadata?.address || '';
          const net = networkIdToName(base?.metadata?.networkId || '');
          const shortAddr = addr ? `${addr.slice(0, 6)}...` : '';
          const summary = parts.length ? parts.join(', ') : 'No balances';
          return `Balances (${net} ${shortAddr}): ${summary}`;
        }
        if (r.blockType === 'walletTransaction' || r.result?.type === 'wallet_transactions') {
          const base = r.result?.type ? r.result : r.result?.result;
          const txs = Array.isArray(base?.transactions) ? base.transactions : [];
          const count = txs.length;
          const latest = txs[0] || null;
          const latestType = latest?.type || 'N/A';
          const shortAddr = (base?.address || '').slice(0, 6);
          return `Transactions (${base?.chain || 'chain'} ${shortAddr ? shortAddr + '...' : ''}): ${count} found, latest ${latestType}`;
        }
        if (r.blockType === 'tokenInfo' || r.result?.type === 'token_info') {
          return `${r.blockName}: token info fetched`;
        }
        if (r.blockType === 'aiExplanation' || r.result?.type === 'ai_explanation') {
          const base = r.result?.type ? r.result : r.result?.result;
          const ai = base?.response || base;
          latestAI = ai || null;
          const expl = (ai?.explanation || '').replace(/\s+/g, ' ').trim();
          const preview = expl ? (expl.length > 140 ? `${expl.slice(0, 140)}...` : expl) : 'AI analysis ready';
          aiPreview = preview;
          return `${r.blockName}: ${preview}`;
        }
        if (r.status === 'success') return `${r.blockName}: success`;
        return `${r.blockName}: error`;
      });

      const hasBlockError = execution.results.some(r => r.status === 'error');
      const newHistoryEntry = {
        timestamp: new Date().toLocaleString(),
        status: hasBlockError ? 'error' : ((execution.status === 'success' || execution.status === 'partial_success') ? 'success' : 'error'),
        duration: durationSeconds,
        result: summaryLines.join(' | '),
        aiPreview: aiPreview || null,
      };

      setWorkflow(prev => {
        const previousHistory = Array.isArray(prev.executionHistory) ? prev.executionHistory : [];
        const updatedHistory = [newHistoryEntry, ...previousHistory];
        const updatedTotalRuns = (prev.totalRuns || 0) + 1;
        const successfulRuns = updatedHistory.filter(h => h.status === 'success').length;
        const updatedSuccessRate = Number(((successfulRuns / updatedHistory.length) * 100).toFixed(1));

        const updated = {
          ...prev,
          lastRun: 'just now',
          totalRuns: updatedTotalRuns,
          successRate: isFinite(updatedSuccessRate) ? updatedSuccessRate : (prev.successRate || 0),
          executionHistory: updatedHistory,
          lastAIAnalysis: latestAI || prev.lastAIAnalysis || null,
        };

        const userId = prev?.ownerId || user?.wallet?.address || user?.id || 'anonymous';
        try {
          lsUpsertWorkflow(userId, updated);
        } catch (e) {
          console.error('Failed to persist workflow run history:', e);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error running workflow:', error);
      alert('Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  };

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/workflow"
              className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{editableName || workflow.name}</h1>
              <p className="text-foreground/70 mt-1">{editableDescription || workflow.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunOnce}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Running...' : 'Run Once'}</span>
            </button>
            <button
              onClick={handleToggleWorkflow}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                workflow.status === 'active'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {workflow.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <Link
              href={`/builder?edit=${workflow.id}`}
              className="flex items-center space-x-2 px-4 py-2 border border-border hover:bg-hover rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="workflow-node p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Status</p>
                <p className={`text-lg font-semibold capitalize ${
                  workflow.status === 'active' ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {workflow.status}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                workflow.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </div>
          </div>
          
          <div className="workflow-node p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Total Runs</p>
                <p className="text-lg font-semibold text-foreground">{workflow.totalRuns}</p>
              </div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="workflow-node p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Success Rate</p>
                <p className="text-lg font-semibold text-green-500">{workflow.successRate}%</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          
          <div className="workflow-node p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Last Run</p>
                <p className="text-lg font-semibold text-foreground">{workflow.lastRun}</p>
              </div>
              <Clock className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {['overview', 'analysis', 'blocks', 'history', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-foreground/70 hover:text-foreground hover:bg-hover'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="workflow-node p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Created:</span>
                  <span className="text-foreground">{workflow.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Chains:</span>
                  <div className="flex flex-wrap gap-1">
                    {(workflow.chains || []).map(chain => (
                      <ChainBadge key={chain} chain={chain} size="xs" />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Next Run:</span>
                  <span className="text-foreground">{workflow?.nextRun}</span>
                </div>
              </div>
            </div>

            <div className="workflow-node p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {((workflow.executionHistory ?? []).length === 0) ? (
                  <p className="text-sm text-foreground/60 italic">No recent activity.</p>
                ) : (
                  (workflow.executionHistory ?? []).slice(0, 6).map((execution, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {execution.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm text-foreground">{shorten(execution.result)}</p>
                          <p className="text-xs text-foreground/70">{execution.timestamp}</p>
                        </div>
                      </div>
                      <span className="text-xs text-foreground/70">{execution.duration}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="workflow-node p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Analysis</h3>
            {(() => {
              const ai = normalizeAI(workflow.lastAIAnalysis);
              if (!ai) return <p className="text-sm text-foreground/60">No AI analysis yet. Run the workflow to generate one.</p>;
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Explanation</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-line">{ai.explanation || ai.rawResponse || '—'}</p>
                  </div>
                  {(ai.insights?.length > 0) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Insights</p>
                      <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                        {ai.insights.slice(0,5).map((it, i) => (<li key={i}>{it}</li>))}
                      </ul>
                    </div>
                  )}
                  {(ai.recommendations?.length > 0) && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Recommendations</p>
                      <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                        {ai.recommendations.slice(0,5).map((it, i) => (<li key={i}>{it}</li>))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="space-y-6">
            {workflow.blocks.map((block, index) => (
              <BlockExecutionCard key={block.id} block={block} index={index} />
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="workflow-node p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Execution History</h3>
            <div className="space-y-4">
              {((workflow.executionHistory ?? []).length === 0) ? (
                <p className="text-sm text-foreground/60 italic">No history yet.</p>
              ) : (
                (workflow.executionHistory ?? []).map((execution, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {execution.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-foreground font-medium">{execution.result}</p>
                        <p className="text-sm text-foreground/70">{execution.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">{execution.duration}</p>
                      <p className={`text-xs capitalize ${
                        execution.status === 'success' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {execution.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="workflow-node p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Auto-run</h4>
                  <p className="text-sm text-foreground/70">Automatically execute this workflow</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRun}
                  onChange={(e) => setAutoRun(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
              </div>
              <div className="pt-4 border-t border-border">
                <button
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                  onClick={() => {
                    if (!workflow) return;
                    const updated = {
                      ...workflow,
                      name: editableName,
                      description: editableDescription,
                      status: autoRun ? 'active' : 'paused',
                      updatedAt: new Date().toISOString(),
                    };
                    const userId = workflow?.ownerId || user?.wallet?.address || user?.id || 'anonymous';
                    try {
                      lsUpsertWorkflow(userId, updated);
                      setWorkflow(updated);
                    } catch (e) {
                      console.error('Failed to save workflow settings:', e);
                      alert('Failed to save workflow settings');
                    }
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockExecutionCard({ block, index }) {
  const blockType = blockTypes[block.type];
  const Icon = blockType?.icon;
  
  const networkIdToName = (id) => {
    const map = { mainnet: 'Ethereum', sepolia: 'Sepolia', polygon: 'Polygon', arbitrum: 'Arbitrum', optimism: 'Optimism' };
    return map[id] || id;
  };

  const formatUnitsLoose = (value, decimals = 18) => {
    try {
      const v = typeof value === 'string' ? Number(value) : (typeof value === 'number' ? value : 0);
      if (!isFinite(v)) return '0';
      const denom = Math.pow(10, Number(decimals) || 0);
      const num = denom === 0 ? v : v / denom;
      if (num === 0) return '0';
      if (num >= 1) return num.toFixed(4).replace(/\.0+$/, '');
      return num.toPrecision(4);
    } catch {
      return String(value ?? '0');
    }
  };
  const formatConfigValue = (key, value) => {
    if (typeof value !== 'string') return String(value ?? '');
    // Shorten long hex/addresses and long strings for display
    const isHex = value.startsWith('0x');
    if ((isHex && value.length > 26) || value.length > 48) {
      return `${value.slice(0, 12)}...${value.slice(-10)}`;
    }
    return value;
  };

  return (
    <div className="workflow-node p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <div className={`w-10 h-10 ${blockType?.color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{block.name}</h3>
            <p className="text-sm text-foreground/70">{blockType?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-foreground/70">Last execution</p>
            <p className="text-sm text-foreground">{block.lastExecution}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground/70">Duration</p>
            <p className="text-sm text-foreground">{block.executionTime}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            block.status === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-background/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(block.config).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-foreground/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-sm text-foreground font-mono break-all" title={String(value ?? '')}>
                {formatConfigValue(key, value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Result preview for balancesByAddress */}
      {block.type === 'balancesByAddress' && block.lastResult && (
        <div className="bg-background/50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Result</h4>
          {(() => {
            const res = block.lastResult;
            const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
            if (!arr || arr.length === 0) {
              return <p className="text-sm text-foreground/60">No balances found.</p>;
            }
            const netId = res?.metadata?.networkId || block.config?.networkId || '';
            return (
              <div className="space-y-2">
                <div className="flex items-center space-x-2"><span className="text-sm text-foreground/70">Network:</span><GraphNetworkBadge networkId={netId} /></div>
                <ul className="text-sm text-foreground/90 space-y-1">
                  {arr.slice(0, 5).map((it, idx) => {
                    const symbol = it?.symbol || it?.token?.symbol || 'TOKEN';
                    const name = it?.name || it?.token?.name || '';
                    const decimals = it?.decimals ?? it?.token?.decimals ?? 18;
                    const raw = it?.formattedBalance ?? it?.value ?? it?.amount ?? it?.balance ?? 0;
                    const amount = typeof raw === 'string' && raw.includes('.') ? raw : formatUnitsLoose(raw, decimals);
                    return (
                      <li key={idx} className="flex justify-between">
                        <span>{name ? `${name} (${symbol})` : symbol}</span>
                        <span className="font-mono">{amount}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
        </div>
      )}
      {/* Result preview for tokenMetadata */}
      {block.type === 'tokenMetadata' && block.lastResult && (
        <div className="bg-background/50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Result</h4>
          {(() => {
            const res = block.lastResult;
            const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
            if (!arr || arr.length === 0) {
              return <p className="text-sm text-foreground/60">No token metadata found.</p>;
            }
            const it = arr[0];
            const net = networkIdToName(res?.metadata?.networkId || block.config?.networkId || '');
            return (
              <div className="space-y-2">
                <p className="text-sm text-foreground/70">Network: <span className="text-foreground">{net}</span></p>
                <div className="grid grid-cols-2 gap-2 text-sm text-foreground/90">
                  <div>
                    <div className="text-foreground/70">Symbol</div>
                    <div className="font-mono">{it?.symbol || '—'}</div>
                  </div>
                  <div>
                    <div className="text-foreground/70">Name</div>
                    <div>{it?.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-foreground/70">Decimals</div>
                    <div className="font-mono">{it?.decimals ?? 18}</div>
                  </div>
                  <div>
                    <div className="text-foreground/70">Holders</div>
                    <div className="font-mono">{it?.holders ?? '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-foreground/70">Contract</div>
                    <div className="font-mono break-all">{it?.contract || res?.metadata?.contract || block.config?.contract}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {/* Result preview for transferEvents */}
      {block.type === 'transferEvents' && block.lastResult && (
        <div className="bg-background/50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Result</h4>
          {(() => {
            const res = block.lastResult;
            const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
            if (!arr || arr.length === 0) {
              return <p className="text-sm text-foreground/60">No transfers found.</p>;
            }
            const netId = res?.metadata?.networkId || block.config?.networkId || '';
            return (
              <div className="space-y-2">
                <div className="flex items-center space-x-2"><span className="text-sm text-foreground/70">Network:</span><GraphNetworkBadge networkId={netId} /></div>
                <ul className="text-sm text-foreground/90 space-y-1">
                  {arr.slice(0, 5).map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="truncate mr-2">{(it?.symbol || 'TOKEN')} • {it?.from?.slice(0,6)}… → {it?.to?.slice(0,6)}…</span>
                      <span className="font-mono">{it?.value ?? it?.amount ?? '0'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      )}
      {/* Result preview for swapEvents */}
      {block.type === 'swapEvents' && block.lastResult && (
        <div className="bg-background/50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Result</h4>
          {(() => {
            const res = block.lastResult;
            const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
            if (!arr || arr.length === 0) {
              return <p className="text-sm text-foreground/60">No swaps found.</p>;
            }
            const netId = res?.metadata?.networkId || block.config?.networkId || '';
            return (
              <div className="space-y-2">
                <div className="flex items-center space-x-2"><span className="text-sm text-foreground/70">Network:</span><GraphNetworkBadge networkId={netId} /></div>
                <ul className="text-sm text-foreground/90 space-y-1">
                  {arr.slice(0, 5).map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="truncate mr-2">{it?.protocol?.replace('_', ' ') || 'uniswap'} • {it?.token0?.symbol || 'T0'}/{it?.token1?.symbol || 'T1'}</span>
                      <span className="font-mono">{(it?.value0 ?? it?.amount0 ?? '0')}/{(it?.value1 ?? it?.amount1 ?? '0')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
