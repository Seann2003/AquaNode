'use client';

// LocalStorage-based workflow persistence, namespaced by user wallet address

const STORAGE_PREFIX = 'aquanode:workflows:';

function getStorageKey(userId) {
  const id = (userId || 'anonymous').toLowerCase();
  return `${STORAGE_PREFIX}${id}`;
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json ?? 'null') ?? fallback;
  } catch (_) {
    return fallback;
  }
}

export function generateWorkflowId() {
  return 'wf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

export function getAllWorkflows(userId) {
  if (typeof window === 'undefined') return [];
  const key = getStorageKey(userId);
  return safeParse(localStorage.getItem(key), []);
}

export function saveAllWorkflows(userId, workflows) {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(workflows));
}

export function getWorkflow(userId, workflowId) {
  return getAllWorkflows(userId).find(w => w.id === workflowId) || null;
}

export function upsertWorkflow(userId, workflow) {
  const existing = getAllWorkflows(userId);
  let toSave = existing;
  if (!workflow.id) workflow.id = generateWorkflowId();
  const index = existing.findIndex(w => w.id === workflow.id);
  const nowIso = new Date().toISOString();
  const applyDefaults = (prev, wf) => ({
    id: prev?.id || wf.id,
    name: wf.name || prev?.name || 'Untitled Workflow',
    description: wf.description || prev?.description || '',
    status: wf.status || prev?.status || 'draft',
    chains: Array.isArray(wf.chains) ? wf.chains : (prev?.chains || []),
    blocks: Array.isArray(wf.blocks) ? wf.blocks : (prev?.blocks || []),
    // Tracking fields for dashboard/detail pages
    createdAt: prev?.createdAt || nowIso,
    updatedAt: nowIso,
    created: prev?.created || new Date(prev?.createdAt || nowIso).toLocaleDateString(),
    lastRun: wf.lastRun ?? prev?.lastRun ?? null,
    nextRun: wf.nextRun ?? prev?.nextRun ?? null,
    totalRuns: typeof wf.totalRuns === 'number' ? wf.totalRuns : (prev?.totalRuns ?? 0),
    successRate: typeof wf.successRate === 'number' ? wf.successRate : (prev?.successRate ?? 0),
    executionHistory: Array.isArray(wf.executionHistory) ? wf.executionHistory : (prev?.executionHistory || []),
    template: wf.template ?? prev?.template ?? false,
  });
  if (index >= 0) {
    toSave = [...existing];
    toSave[index] = applyDefaults(existing[index], workflow);
  } else {
    const withDefaults = applyDefaults(null, workflow);
    toSave = [...existing, withDefaults];
  }
  saveAllWorkflows(userId, toSave);
  return getWorkflow(userId, workflow.id);
}

export function deleteWorkflow(userId, workflowId) {
  const existing = getAllWorkflows(userId);
  const next = existing.filter(w => w.id !== workflowId);
  saveAllWorkflows(userId, next);
  return existing.length !== next.length;
}


