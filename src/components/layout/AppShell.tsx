'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');
  const isLandingPage = pathname === '/';

  if (isAuthPage || isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <AppHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <div className="flex-1 flex min-w-0">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 lg:pl-64 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};
