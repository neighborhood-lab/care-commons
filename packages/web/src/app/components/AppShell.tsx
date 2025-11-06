import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransition } from '@/core/components';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8">
          <PageTransition variant="fade">
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
};
