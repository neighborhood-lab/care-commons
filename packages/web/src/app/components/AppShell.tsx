import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DemoDataBanner } from '@/core/components/feedback';
import { useDemoData } from '@/core/hooks';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();
  const { hasDemoData, stats, clearDemoData, isClearing } = useDemoData();

  const handleClearDemo = () => {
    void clearDemoData();
  };

  const handleAddRealData = () => {
    navigate('/clients/new');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Demo Data Banner */}
        {hasDemoData === true && !bannerDismissed && (
          <DemoDataBanner
            onClearDemo={handleClearDemo}
            onAddRealData={handleAddRealData}
            onDismiss={() => setBannerDismissed(true)}
            isClearing={isClearing}
            stats={stats ?? undefined}
          />
        )}
        
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
