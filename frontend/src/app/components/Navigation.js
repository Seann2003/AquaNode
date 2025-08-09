'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, Plus, Settings } from 'lucide-react';
import Image from 'next/image';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export default function Navigation() {
  const pathname = usePathname();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const navItems = [
    { href: '/', label: 'Workflows', icon: Waves },
    { href: '/builder', label: 'Create', icon: Plus },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/long-aquanode-logo.svg" alt="AquaNode" width={180} height={50} />
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
            {/* Privy Connect */}
            {ready && (
              authenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono">
                    {(() => {
                      const address = wallets?.[0]?.address || user?.wallet?.address || '';
                      return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected';
                    })()}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm bg-border hover:bg-hover rounded-md text-foreground/80"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  disabled={!ready}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-md text-sm"
                >
                  Connect Wallet
                </button>
              )
            )}
            <button className="p-2 text-foreground/70 hover:text-foreground hover:bg-hover rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
