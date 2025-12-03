import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DemoDataBanner } from '@/core/components/feedback';
import { useDemoData, useDemoMode } from '@/core/hooks';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigate = useNavigate();
  const { hasDemoData, stats, clearDemoData, isClearing } = useDemoData();
  const { isDemo, canWrite } = useDemoMode();

  const handleClearDemo = () => {
    void clearDemoData();
  };

  const handleAddRealData = () => {
    navigate('/clients/new');
  };

  // Show banner for demo accounts OR organizations with demo data
  const showBanner = isDemo || hasDemoData === true;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Demo Mode / Demo Data Banner */}
        {showBanner && !bannerDismissed && (
          <DemoDataBanner
            isDemo={isDemo}
            onClearDemo={canWrite ? handleClearDemo : undefined}
            onAddRealData={canWrite ? handleAddRealData : undefined}
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
