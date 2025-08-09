'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ChainBadge } from '../../components/ChainLogo';

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
  const [workflow, setWorkflow] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchWorkflow = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`);
      const data = await response.json();
      
      if (data.success && data.workflow) {
        setWorkflow(data.workflow);
      } else {
        // Fallback to mock data if not found in database
        const mockData = mockWorkflowData[params.id];
        if (mockData) {
          setWorkflow(mockData);
        } else {
          setWorkflow(null);
        }
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      // Fallback to mock data
      const mockData = mockWorkflowData[params.id];
      setWorkflow(mockData || null);
    }
  }, [params.id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const handleToggleWorkflow = async () => {
    setIsRunning(true);
    try {
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      
      const response = await fetch(`/api/workflows/${params.id}`, {
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
    setIsRunning(true);
    try {
      // TODO: Implement actual workflow execution
      // For now, just simulate execution
      setTimeout(() => {
        setWorkflow(prev => ({
          ...prev,
          lastRun: 'just now',
          totalRuns: (prev.totalRuns || 0) + 1
        }));
        setIsRunning(false);
      }, 2000);
    } catch (error) {
      console.error('Error running workflow:', error);
      alert('Failed to run workflow');
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{workflow.name}</h1>
              <p className="text-foreground/70 mt-1">{workflow.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunOnce}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Run Once</span>
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
          {['overview', 'blocks', 'history', 'settings'].map((tab) => (
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
                {(workflow.executionHistory ?? []).map((execution, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {execution.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-foreground">{execution.result}</p>
                        <p className="text-xs text-foreground/70">{execution.timestamp}</p>
                      </div>
                    </div>
                    <span className="text-xs text-foreground/70">{execution.duration}</span>
                  </div>
                ))}
              </div>
            </div>
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
              {(workflow.executionHistory ?? []).map((execution, index) => (
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
              ))}
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
                  value={workflow.name}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={workflow.description}
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
                  checked={workflow.status === 'active'}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
              </div>
              <div className="pt-4 border-t border-border">
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">
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
              <p className="text-sm text-foreground font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
