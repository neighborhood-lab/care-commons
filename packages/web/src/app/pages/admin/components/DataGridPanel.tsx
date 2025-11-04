import React, { useState } from 'react';
import { Card } from '@/core/components';
import { Database, Eye, Download } from 'lucide-react';

interface DatabaseTable {
  name: string;
  displayName: string;
  rowCount: number;
  category: 'core' | 'evv' | 'billing' | 'scheduling';
  description: string;
}

const DATABASE_TABLES: DatabaseTable[] = [
  // Core Tables
  {
    name: 'clients',
    displayName: 'Clients',
    rowCount: 247,
    category: 'core',
    description: 'Client demographics and profile information',
  },
  {
    name: 'caregivers',
    displayName: 'Caregivers',
    rowCount: 156,
    category: 'core',
    description: 'Caregiver staff records and credentials',
  },
  {
    name: 'organizations',
    displayName: 'Organizations',
    rowCount: 12,
    category: 'core',
    description: 'Organization entities and configurations',
  },
  {
    name: 'users',
    displayName: 'Users',
    rowCount: 89,
    category: 'core',
    description: 'System user accounts and authentication',
  },
  // EVV Tables
  {
    name: 'visits',
    displayName: 'Visits',
    rowCount: 1847,
    category: 'evv',
    description: 'Scheduled and completed care visits',
  },
  {
    name: 'evv_records',
    displayName: 'EVV Records',
    rowCount: 1523,
    category: 'evv',
    description: 'Electronic Visit Verification records with GPS data',
  },
  {
    name: 'evv_revisions',
    displayName: 'EVV Revisions',
    rowCount: 342,
    category: 'evv',
    description: 'Audit trail of EVV data modifications',
  },
  {
    name: 'state_aggregator_submissions',
    displayName: 'Aggregator Submissions',
    rowCount: 1458,
    category: 'evv',
    description: 'State EVV aggregator submission records',
  },
  {
    name: 'vmur_requests',
    displayName: 'VMUR Requests (TX)',
    rowCount: 87,
    category: 'evv',
    description: 'Texas Visit Maintenance Unlock Requests',
  },
  // Billing Tables
  {
    name: 'invoices',
    displayName: 'Invoices',
    rowCount: 523,
    category: 'billing',
    description: 'Client billing invoices and statements',
  },
  {
    name: 'payments',
    displayName: 'Payments',
    rowCount: 489,
    category: 'billing',
    description: 'Payment transactions and receipts',
  },
  // Scheduling Tables
  {
    name: 'schedules',
    displayName: 'Schedules',
    rowCount: 2156,
    category: 'scheduling',
    description: 'Caregiver scheduling and shift assignments',
  },
  {
    name: 'open_shifts',
    displayName: 'Open Shifts',
    rowCount: 67,
    category: 'scheduling',
    description: 'Unfilled shifts available for matching',
  },
];

const CATEGORY_COLORS = {
  core: 'bg-blue-50 text-blue-700 border-blue-200',
  evv: 'bg-green-50 text-green-700 border-green-200',
  billing: 'bg-purple-50 text-purple-700 border-purple-200',
  scheduling: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const DataGridPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'core' | 'evv' | 'billing' | 'scheduling'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTables = DATABASE_TABLES.filter((table) => {
    const matchesCategory =
      selectedCategory === 'all' || table.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      table.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all' as const, label: 'All Tables', count: DATABASE_TABLES.length },
    {
      value: 'core' as const,
      label: 'Core',
      count: DATABASE_TABLES.filter((t) => t.category === 'core').length,
    },
    {
      value: 'evv' as const,
      label: 'EVV',
      count: DATABASE_TABLES.filter((t) => t.category === 'evv').length,
    },
    {
      value: 'billing' as const,
      label: 'Billing',
      count: DATABASE_TABLES.filter((t) => t.category === 'billing').length,
    },
    {
      value: 'scheduling' as const,
      label: 'Scheduling',
      count: DATABASE_TABLES.filter((t) => t.category === 'scheduling').length,
    },
  ];

  const handleExport = (tableName: string) => {
    console.log(`Exporting table: ${tableName}`);
    // In production, this would trigger a CSV/Excel export
  };

  const handleView = (tableName: string) => {
    console.log(`Viewing table: ${tableName}`);
    // In production, this would open a data grid view
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Database Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Direct access to all system tables for administrative operations
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap
                transition-colors
                ${
                  selectedCategory === category.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table) => (
          <Card key={table.name} padding="md" hover>
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">
                      {table.displayName}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{table.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border ${
                    CATEGORY_COLORS[table.category]
                  }`}
                >
                  {table.category}
                </span>
              </div>

              {/* Row Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{table.rowCount.toLocaleString()}</span>
                <span>rows</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleView(table.name)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleExport(table.name)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tables found matching your search</p>
        </div>
      )}
    </div>
  );
};
