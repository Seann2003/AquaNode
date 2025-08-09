'use client';

import Link from 'next/link';
import { Plus, Play, Edit, Trash2, Clock, TrendingUp, Wallet, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChainBadge } from './components/ChainLogo';
import { getStaticTemplates, createWorkflowFromTemplate, getTemplateById } from './services/staticTemplates';

export default function Home() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.workflows);
      } else {
        setError('Failed to fetch workflows');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to fetch workflows');
      // Use mock data as fallback
      setWorkflows(getMockWorkflows());
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      console.log('Templates API response:', data);
      
      if (data.success) {
        console.log('Setting templates:', data.templates);
        setTemplates(data.templates);
      } else {
        console.log('API failed, using static templates');
        const staticTemplates = getStaticTemplates();
        console.log('Static templates:', staticTemplates);
        setTemplates(staticTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      console.log('Using static templates as fallback');
      const staticTemplates = getStaticTemplates();
      console.log('Static templates fallback:', staticTemplates);
      setTemplates(staticTemplates);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== workflowId));
      } else {
        alert('Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      // Create a new workflow from template using the static template system
      const newWorkflow = createWorkflowFromTemplate(template);
      
      if (!newWorkflow) {
        alert('Failed to create workflow from template');
        return;
      }

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to builder with the new workflow
        window.location.href = `/builder?edit=${data.workflow.id}`;
      } else {
        // If API fails, redirect to builder with template ID
        window.location.href = `/builder?template=${template.id}`;
      }
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      // Fallback: redirect to builder with template ID
      window.location.href = `/builder?template=${template.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Simplify your DeFi journey
            </h1>
            <p className="text-foreground/70 mt-2">
              with power of data (The Graph, Coingecko API) and AI agents across chains
            </p>
          </div>
          <Link
            href="/builder"
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workflows'
                ? 'bg-primary text-white'
                : 'text-foreground/70 hover:text-foreground hover:bg-hover'
            }`}
          >
            My Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary text-white'
                : 'text-foreground/70 hover:text-foreground hover:bg-hover'
            }`}
          >
            Templates ({templates.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'workflows' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No workflows yet
                </h3>
                <p className="text-foreground/70 mb-4">
                  Create your first workflow or use a template to get started
                </p>
                <Link
                  href="/builder"
                  className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workflow</span>
                </Link>
              </div>
            ) : (
              workflows.map((workflow) => (
                <WorkflowCard 
                  key={workflow.id} 
                  workflow={workflow} 
                  onDelete={handleDeleteWorkflow}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {console.log('Rendering templates:', templates)}
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No templates available
                </h3>
                <p className="text-foreground/70 mb-4">
                  Templates are loading or unavailable
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  onUse={handleUseTemplate}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowCard({ workflow, onDelete }) {
  return (
    <div className="workflow-node p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {workflow.name}
          </h3>
          <p className="text-sm text-foreground/70 mb-3">
            {workflow.description}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            workflow.status === 'active' ? 'bg-green-500' : 
            workflow.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span className="text-xs text-foreground/70 capitalize">
            {workflow.status || 'draft'}
          </span>
        </div>
      </div>

      {/* Chains */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(workflow.chains || []).map((chain) => (
          <ChainBadge key={chain} chain={chain} size="xs" />
        ))}
      </div>

      {/* Blocks */}
      <div className="flex flex-wrap gap-1 mb-4">
        {(workflow.blocks || []).slice(0, 3).map((block, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-border text-foreground/70 text-xs rounded"
          >
            {typeof block === 'string' ? block : block.name}
          </span>
        ))}
        {(workflow.blocks || []).length > 3 && (
          <span className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">
            +{workflow.blocks.length - 3} more
          </span>
        )}
      </div>

      {/* Last run */}
      {workflow.lastRun && (
        <div className="flex items-center text-xs text-foreground/50 mb-4">
          <Clock className="w-3 h-3 mr-1" />
          Last run: {workflow.lastRun}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <Link
          href={`/workflow/${workflow.id}`}
          className="flex-1 flex items-center justify-center space-x-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          <Play className="w-3 h-3" />
          <span>View</span>
        </Link>
        <Link
          href={`/builder?edit=${workflow.id}`}
          className="flex items-center justify-center p-2 border border-border hover:bg-hover rounded transition-colors"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button 
          onClick={() => onDelete(workflow.id)}
          className="flex items-center justify-center p-2 border border-border hover:bg-hover hover:border-red-500 hover:text-red-500 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse }) {
  const getTemplateIcon = (template) => {
    if (template.category === 'Analysis') return Wallet;
    if (template.category === 'Trading') return TrendingUp;
    if (template.category === 'Staking') return TrendingUp;
    if (template.category === 'Social Impact') return Coins;
    return Wallet;
  };

  const Icon = getTemplateIcon(template);

  return (
    <div className="workflow-node p-6">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {template.name}
          </h3>
          <p className="text-sm text-foreground/70">
            {template.description}
          </p>
        </div>
      </div>

      {/* Chains */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(template.chains || []).map((chain) => (
          <ChainBadge key={chain} chain={chain} size="xs" />
        ))}
      </div>

      {/* Blocks */}
      <div className="flex flex-wrap gap-1 mb-6">
        {(template.blocks || []).slice(0, 3).map((block, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-border text-foreground/70 text-xs rounded"
          >
            {block.name || block.type}
          </span>
        ))}
        {(template.blocks || []).length > 3 && (
          <span className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">
            +{template.blocks.length - 3} more
          </span>
        )}
      </div>

      {/* Use Template Button */}
      <button
        onClick={() => onUse(template)}
        className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Use Template</span>
      </button>
    </div>
  );
}

// Fallback data functions
function getMockWorkflows() {
  return [
    {
      id: 'mock-1',
      name: 'DeFi Portfolio Monitor',
      description: 'Monitor wallet balance and get AI insights on portfolio performance',
      status: 'active',
      lastRun: '2 minutes ago',
      chains: ['Sui', 'Oasis Sapphire'],
      blocks: ['Wallet Balance', 'AI Explanation', 'Conditional'],
      template: false
    },
    {
      id: 'mock-2',
      name: 'Auto Staking Strategy',
      description: 'Automatically stake tokens when balance exceeds threshold',
      status: 'paused',
      lastRun: '1 hour ago',
      chains: ['Sui'],
      blocks: ['Token Info', 'Wallet Balance', 'Conditional', 'Stake'],
      template: false
    }
  ];
}
