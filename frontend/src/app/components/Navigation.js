'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, Plus, Settings } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Workflows', icon: Waves },
    { href: '/builder', label: 'Builder', icon: Plus },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AquaNode
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/70 hover:text-foreground hover:bg-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
