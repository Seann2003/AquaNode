'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  GitBranch, 
  Brain, 
  Clock, 
  Save,
  Play,
  Settings,
  ArrowLeft,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { upsertWorkflow, getWorkflow as lsGetWorkflow } from '../services/localWorkflowService';
import BlockPalette from '../components/BlockPalette';
import WorkflowCanvas from '../components/WorkflowCanvas';
import BlockConfigPanel from '../components/BlockConfigPanel';
import { getTemplateById } from '../services/staticTemplates';

// Block definitions
export const blockTypes = {
  conditional: {
    id: 'conditional',
    name: 'Conditional (IF)',
    icon: GitBranch,
    category: 'Logic',
    color: 'bg-purple-500',
    description: 'Execute actions based on conditions'
  },
  walletBalance: {
    id: 'walletBalance',
    name: 'Get Balance',
    icon: Wallet,
    category: 'Wallet',
    color: 'bg-blue-500',
    description: 'Get wallet balance for specified address'
  },
  walletTransaction: {
    id: 'walletTransaction',
    name: 'Get Transaction',
    icon: Wallet,
    category: 'Wallet',
    color: 'bg-blue-500',
    description: 'Get transaction history for wallet'
  },
  walletNFT: {
    id: 'walletNFT',
    name: 'Get NFT / Tokens',
    icon: Wallet,
    category: 'Wallet',
    color: 'bg-blue-500',
    description: 'Get NFTs and tokens in wallet'
  },
  tokenInfo: {
    id: 'tokenInfo',
    name: 'Get Token Info',
    icon: Coins,
    category: 'Token',
    color: 'bg-green-500',
    description: 'Get detailed token information'
  },
  stake: {
    id: 'stake',
    name: 'Stake',
    icon: TrendingUp,
    category: 'DeFi',
    color: 'bg-orange-500',
    description: 'Stake tokens on Sui or Oasis'
  },
  swap: {
    id: 'swap',
    name: 'Swap',
    icon: TrendingUp,
    category: 'DeFi',
    color: 'bg-orange-500',
    description: 'Swap tokens on Sui or Oasis'
  },
  embeddedWallet: {
    id: 'embeddedWallet',
    name: 'Embedded Wallet',
    icon: Wallet,
    category: 'Wallet',
    color: 'bg-indigo-500',
    description: 'Sui zkLogin / Oasis Privy wallet'
  },
  aiExplanation: {
    id: 'aiExplanation',
    name: 'AI Explanation',
    icon: Brain,
    category: 'AI',
    color: 'bg-pink-500',
    description: 'Get AI-powered insights and explanations'
  },
  sendEmail: {
    id: 'sendEmail',
    name: 'Send Email',
    icon: Mail,
    category: 'Notifications',
    color: 'bg-emerald-600',
    description: 'Send an email via Resend API'
  },
  cronjob: {
    id: 'cronjob',
    name: 'Cronjob',
    icon: Clock,
    category: 'Config',
    color: 'bg-gray-500',
    description: 'Schedule workflow execution (5 seconds interval)'
  },
  balancesByAddress: {
    id: 'balancesByAddress',
    name: 'Balances by Address',
    icon: Wallet,
    category: 'Token',
    color: 'bg-cyan-500',
    description: 'Get token balances for an address via The Graph'
  },
  transferEvents: {
    id: 'transferEvents',
    name: 'Transfer Events',
    icon: TrendingUp,
    category: 'Token',
    color: 'bg-cyan-500',
    description: 'Get token transfer events via The Graph'
  },
  tokenHolders: {
    id: 'tokenHolders',
    name: 'Token Holders',
    icon: Coins,
    category: 'Token',
    color: 'bg-cyan-500',
    description: 'Get token holders for a contract via The Graph'
  },
  tokenMetadata: {
    id: 'tokenMetadata',
    name: 'Token Metadata',
    icon: Coins,
    category: 'Token',
    color: 'bg-cyan-500',
    description: 'Get token metadata via The Graph'
  },
  liquidityPools: {
    id: 'liquidityPools',
    name: 'Liquidity Pools',
    icon: TrendingUp,
    category: 'DeFi',
    color: 'bg-cyan-500',
    description: 'Get liquidity pools data via The Graph'
  },
  swapEvents: {
    id: 'swapEvents',
    name: 'Swap Events',
    icon: TrendingUp,
    category: 'DeFi',
    color: 'bg-cyan-500',
    description: 'Get swap events data via The Graph'
  },
  nftActivities: {
    id: 'nftActivities',
    name: 'NFT Activities',
    icon: Coins,
    category: 'Token',
    color: 'bg-purple-600',
    description: 'Get NFT activities and transfers via The Graph'
  },
  nftCollection: {
    id: 'nftCollection',
    name: 'NFT Collection',
    icon: Coins,
    category: 'Token',
    color: 'bg-purple-600',
    description: 'Get NFT collection metadata via The Graph'
  }
};

function BuilderContent() {
  const { authenticated, user, login, ready } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const templateId = searchParams.get('template');

  const [workflowBlocks, setWorkflowBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Loader: prefer localStorage, fallback to API
  const loadWorkflow = useCallback(async (workflowId) => {
    setLoading(true);
    try {
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      const local = lsGetWorkflow(userId, workflowId);
      if (local) {
        setWorkflowName(local.name);
        setWorkflowDescription(local.description || '');
        setWorkflowBlocks(local.blocks || []);
        setCurrentWorkflowId(local.id);
        return;
      }

      const response = await fetch(`/api/workflows/${workflowId}`);
      const data = await response.json();

      if (data.success && data.workflow) {
        const workflow = data.workflow;
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        setWorkflowBlocks(workflow.blocks || []);
        setCurrentWorkflowId(workflow.id);
      } else {
        alert('Failed to load workflow');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load workflow or template on mount
  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/');
      return;
    }
    if (editId) {
      loadWorkflow(editId);
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [editId, templateId, ready, authenticated, router, loadWorkflow]);

  const loadTemplate = async (templateId) => {
    setLoading(true);
    try {
      // First try to get from static templates
      const template = getTemplateById(templateId);
      
      if (template) {
        setWorkflowName(`${template.name} - Copy`);
        setWorkflowDescription(template.description || '');
        setWorkflowBlocks(template.blocks || []);
        setCurrentWorkflowId(null); // New workflow from template
      } else {
        // Fallback to API
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.success) {
          const apiTemplate = data.templates.find(t => t.id === templateId);
          if (apiTemplate) {
            setWorkflowName(`${apiTemplate.name} - Copy`);
            setWorkflowDescription(apiTemplate.description || '');
            setWorkflowBlocks(apiTemplate.blocks || []);
            setCurrentWorkflowId(null);
          } else {
            alert('Template not found');
          }
        } else {
          alert('Failed to load template');
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over) return;

    // If dropping on canvas
    if (over.id === 'workflow-canvas') {
      const blockType = blockTypes[active.id];
      if (blockType) {
        const newBlock = {
          id: `${blockType.id}-${Date.now()}`,
          type: blockType.id,
          name: blockType.name,
          config: {},
          position: { x: 100, y: workflowBlocks.length * 120 + 100 }
        };
        setWorkflowBlocks(prev => [...prev, newBlock]);
      }
    }

    setActiveId(null);
  }, [workflowBlocks.length]);

  const handleBlockSelect = (block) => {
    setSelectedBlock(block);
  };

  const handleBlockUpdate = (blockId, updates) => {
    setWorkflowBlocks(prev => 
      prev.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  };

  const handleBlockDelete = (blockId) => {
    setWorkflowBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
    }
  };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      if (!authenticated) {
        await login();
      }
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        blocks: workflowBlocks,
        status: 'draft',
        chains: getUsedChains(),
      };

      if (currentWorkflowId) {
        workflowData.id = currentWorkflowId;
      }

      const saved = upsertWorkflow(userId, workflowData);
      setCurrentWorkflowId(saved.id);
      alert('Workflow saved locally!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleRunWorkflow = () => {
    if (!currentWorkflowId) {
      alert('Please save the workflow first');
      return;
    }
    
    // Redirect to workflow execution page
    window.location.href = `/workflow/${currentWorkflowId}`;
  };

  const getUsedChains = () => {
    const chains = new Set();
    workflowBlocks.forEach(block => {
      if (block.config?.chain) {
        chains.add(block.config.chain);
      }
    });
    return Array.from(chains);
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background pt-16 flex">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Block Palette - sticky left sidebar */}
        <div className="w-80 bg-card border-r border-border fixed left-0 top-16 h-[calc(100vh-4rem)] z-20 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Blocks</h2>
              <Link
                href="/"
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-sm text-foreground/70">
              Drag blocks to the canvas to build your workflow
            </p>
          </div>
          <BlockPalette blockTypes={blockTypes} />
        </div>

        {/* Main Canvas Area - with proper margins for sticky sidebars */}
        <div className={`flex-1 flex flex-col min-h-0 ml-80${selectedBlock ? ' mr-80' : ''}`}>
          {/* Toolbar - sticky to top */}
          <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-16 z-10 flex-shrink-0">
            <div className="flex items-center space-x-4 pl-80">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none outline-none text-foreground w-full"
                placeholder="Workflow name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveWorkflow}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleRunWorkflow}
                // disabled={!currentWorkflowId}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Run</span>
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative pl-80">
            <WorkflowCanvas
              blocks={workflowBlocks}
              onBlockSelect={handleBlockSelect}
              onBlockUpdate={handleBlockUpdate}
              onBlockDelete={handleBlockDelete}
              selectedBlock={selectedBlock}
            />
          </div>
        </div>

        {/* Configuration Panel - sticky right sidebar, shown on selection */}
        {selectedBlock && (
          <div className="w-80 bg-card border-l border-border fixed right-0 top-16 h-[calc(100vh-4rem)] z-20 flex flex-col overflow-y-auto">
            <BlockConfigPanel
              block={selectedBlock}
              onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
              onClose={() => setSelectedBlock(null)}
            />
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && blockTypes[activeId] ? (
            <div className="workflow-node p-4 opacity-90">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${blockTypes[activeId].color} rounded-lg flex items-center justify-center`}>
                  {(() => {
                    const Icon = blockTypes[activeId].icon;
                    return <Icon className="w-4 h-4 text-white" />;
                  })()}
                </div>
                <div>
                  <div className="font-medium text-foreground">{blockTypes[activeId].name}</div>
                  <div className="text-xs text-foreground/70">{blockTypes[activeId].category}</div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading builder...</p>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
