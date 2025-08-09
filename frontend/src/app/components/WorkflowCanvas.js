'use client';

import { useDroppable } from '@dnd-kit/core';
import { Settings, Trash2, ArrowDown } from 'lucide-react';
import { blockTypes } from '../lib/blockTypes';
import ChainLogo from './ChainLogo';

export default function WorkflowCanvas({ 
  blocks, 
  onBlockSelect, 
  onBlockUpdate, 
  onBlockDelete, 
  selectedBlock 
}) {
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full h-full bg-background relative overflow-auto"
      style={{
        backgroundImage: `
          radial-gradient(circle, #333 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
      }}
    >
      {blocks.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Start Building Your Workflow
            </h3>
            <p className="text-foreground/70 max-w-md">
              Drag blocks from the left panel to create your DeFi automation workflow. 
              Connect wallet insights, token data, and AI analysis across Sui and Oasis chains.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center min-h-full">
          <div className="w-full max-w-2xl">
            {blocks.map((block, index) => (
            <div key={block.id}>
              <WorkflowBlock
                block={block}
                isSelected={selectedBlock?.id === block.id}
                onSelect={() => onBlockSelect(block)}
                onDelete={() => onBlockDelete(block.id)}
                onUpdate={(updates) => onBlockUpdate(block.id, updates)}
              />
              {index < blocks.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowBlock({ block, isSelected, onSelect, onDelete, onUpdate }) {
  const blockType = blockTypes[block.type];
  const Icon = blockType?.icon;

  if (!blockType) return null;

  return (
    <div
      className={`workflow-node p-6 cursor-pointer transition-all max-w-md mx-auto ${
        isSelected ? 'selected ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${blockType.color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{block.name}</h3>
            <p className="text-sm text-foreground/70">{blockType.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-foreground/70 hover:text-red-500 hover:bg-hover rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-sm text-foreground/70 mb-4">
        {blockType.description}
      </div>

      {/* Block Status and Chain */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-foreground/70">Ready</span>
        </div>
        <div className="flex items-center space-x-2">
          {block.config?.chain && (
            <div className="flex items-center space-x-1">
              <ChainLogo chain={block.config.chain} size={16} />
              <span className="text-xs text-foreground/70">{block.config.chain}</span>
            </div>
          )}
          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
            {blockType.category}
          </span>
        </div>
      </div>

      {/* Configuration Preview */}
      {Object.keys(block.config || {}).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-foreground/50 mb-2">Configuration:</div>
          <div className="space-y-1">
            {Object.entries(block.config).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-foreground/70">{key}:</span>
                <div className="flex items-center space-x-1">
                  {key === 'chain' && value && (
                    <ChainLogo chain={value} size={12} />
                  )}
                  {key === 'priceSource' && value && (
                    <ChainLogo chain={value} size={12} />
                  )}
                  <span className="text-foreground font-mono">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
