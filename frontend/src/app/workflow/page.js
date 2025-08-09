'use client';

import Link from 'next/link';
import { Plus, Play, Edit, Trash2, Clock, TrendingUp, Wallet, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { getAllWorkflows, deleteWorkflow as lsDeleteWorkflow, upsertWorkflow } from '../services/localWorkflowService';
import { ChainBadge } from '../components/ChainLogo';
import { getStaticTemplates, createWorkflowFromTemplate } from '../services/staticTemplates';

export default function WorkflowsHome() {
  const { authenticated, user, login, ready } = usePrivy();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace('/');
      return;
    }
    const userId = user?.wallet?.address || user?.id || 'anonymous';
    setWorkflows(getAllWorkflows(userId));
    fetchTemplates();
  }, [authenticated, user, ready, router]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
        setLoading(false);
      } else {
        const staticTemplates = getStaticTemplates();
        setTemplates(staticTemplates);
        setLoading(false);
      }
    } catch (error) {
      const staticTemplates = getStaticTemplates();
      setTemplates(staticTemplates);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      lsDeleteWorkflow(userId, workflowId);
      setWorkflows(getAllWorkflows(userId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const newWorkflow = createWorkflowFromTemplate(template);
      if (!newWorkflow) {
        alert('Failed to create workflow from template');
        return;
      }
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      if (!authenticated) await login();
      const saved = upsertWorkflow(userId, newWorkflow);
      // Redirect to the workflow detail page to fill in required fields,
      // instead of loading builder which may fetch from API
      window.location.href = `/workflow/${saved.id}`;
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      // As a fallback, still redirect to detail page copy
      const userId = user?.wallet?.address || user?.id || 'anonymous';
      const saved = upsertWorkflow(userId, createWorkflowFromTemplate(template));
      window.location.href = `/workflow/${saved.id}`;
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
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Workflows</h1>
            {!authenticated && (
              <p className="text-foreground/60 mt-2 text-sm">
                Connect your wallet to view and save your workflows locally on this device.
              </p>
            )}
          </div>
          <Link
            href="/builder"
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workflows' ? 'bg-primary text-white' : 'text-foreground/70 hover:text-foreground hover:bg-hover'
            }`}
          >
            My Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'templates' ? 'bg-primary text-white' : 'text-foreground/70 hover:text-foreground hover:bg-hover'
            }`}
          >
            Templates ({templates.length})
          </button>
        </div>

        {activeTab === 'workflows' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No workflows yet</h3>
                <p className="text-foreground/70 mb-4">Create your first workflow or use a template to get started</p>
                <Link href="/builder" className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Create Workflow</span>
                </Link>
              </div>
            ) : (
              workflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} onDelete={handleDeleteWorkflow} />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No templates available</h3>
                <p className="text-foreground/70 mb-4">Templates are loading or unavailable</p>
              </div>
            ) : (
              templates.map((template) => (
                <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
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
          <h3 className="text-lg font-semibold text-foreground mb-2">{workflow.name}</h3>
          <p className="text-sm text-foreground/70 mb-3">{workflow.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${workflow.status === 'active' ? 'bg-green-500' : workflow.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
          <span className="text-xs text-foreground/70 capitalize">{workflow.status || 'draft'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(workflow.chains || []).map((chain) => (
          <ChainBadge key={chain} chain={chain} size="xs" />
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {(workflow.blocks || []).slice(0, 3).map((block, index) => (
          <span key={index} className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">
            {typeof block === 'string' ? block : block.name}
          </span>
        ))}
        {(workflow.blocks || []).length > 3 && (
          <span className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">+{workflow.blocks.length - 3} more</span>
        )}
      </div>

      {workflow.lastRun && (
        <div className="flex items-center text-xs text-foreground/50 mb-4">
          <Clock className="w-3 h-3 mr-1" />
          Last run: {workflow.lastRun}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Link href={`/workflow/${workflow.id}`} className="flex-1 flex items-center justify-center space-x-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm transition-colors">
          <Play className="w-3 h-3" />
          <span>View</span>
        </Link>
        <Link href={`/builder?edit=${workflow.id}`} className="flex items-center justify-center p-2 border border-border hover:bg-hover rounded transition-colors">
          <Edit className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(workflow.id)} className="flex items-center justify-center p-2 border border-border hover:bg-hover hover:border-red-500 hover:text-red-500 rounded transition-colors">
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
          <h3 className="text-lg font-semibold text-foreground mb-2">{template.name}</h3>
          <p className="text-sm text-foreground/70">{template.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(template.chains || []).map((chain) => (
          <ChainBadge key={chain} chain={chain} size="xs" />
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {(template.blocks || []).slice(0, 3).map((block, index) => (
          <span key={index} className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">
            {block.name || block.type}
          </span>
        ))}
        {(template.blocks || []).length > 3 && (
          <span className="px-2 py-1 bg-border text-foreground/70 text-xs rounded">+{template.blocks.length - 3} more</span>
        )}
      </div>

      <button onClick={() => onUse(template)} className="cursor-pointer w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors">
        <Plus className="w-4 h-4" />
        <span>Use Template</span>
      </button>
    </div>
  );
}


