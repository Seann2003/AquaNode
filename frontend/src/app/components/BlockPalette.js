'use client';

import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';

const categories = ['Logic', 'Wallet', 'Token', 'DeFi', 'AI', 'Notifications', 'Config'];

export default function BlockPalette({ blockTypes }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBlocks = Object.values(blockTypes).filter(block => 
    selectedCategory === 'All' || block.category === selectedCategory
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Category Filter */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === 'All'
                ? 'bg-primary text-white'
                : 'bg-border text-foreground/70 hover:bg-hover'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-border text-foreground/70 hover:bg-hover'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {filteredBlocks.map(block => (
          <DraggableBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function DraggableBlock({ block }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const Icon = block.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`workflow-node p-4 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 scale-105' : 'hover:scale-102'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 ${block.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground text-sm mb-1">
            {block.name}
          </div>
          <div className="text-xs text-foreground/70 leading-relaxed">
            {block.description}
          </div>
          <div className="mt-2">
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {block.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
