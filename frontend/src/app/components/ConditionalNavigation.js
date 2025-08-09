'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Hide navigation on the landing page (root route)
  const shouldShowNavigation = pathname !== '/';
  
  if (!shouldShowNavigation) {
    return null;
  }
  
  return <Navigation />;
}
