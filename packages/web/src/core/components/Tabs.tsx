import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/classnames';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onChange,
  variant = 'line',
  className,
}) => {
  const [activeTab, setActiveTab] = useState(
    defaultTab || items[0]?.id || ''
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div
        className={cn(
          'flex gap-1',
          variant === 'line'
            ? 'border-b border-gray-200'
            : 'bg-gray-100 p-1 rounded-lg'
        )}
        role="tablist"
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleTabChange(item.id)}
              disabled={item.disabled}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                variant === 'line'
                  ? [
                      'border-b-2 -mb-px',
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
                    ]
                  : [
                      'rounded-md flex-1',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ],
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              id={`tab-${item.id}`}
            >
              <span className="flex items-center gap-2">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.label}
              </span>

              {/* Active indicator animation for line variant */}
              {variant === 'line' && isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`tabpanel-${item.id}`}
            aria-labelledby={`tab-${item.id}`}
            hidden={activeTab !== item.id}
          >
            {activeTab === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.content}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';
