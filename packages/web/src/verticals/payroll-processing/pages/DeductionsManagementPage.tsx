import React, { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Heart, Landmark, AlertTriangle } from 'lucide-react';
import { Button, EmptyState, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { formatCurrency } from '../utils';
import type { Deduction } from '../types';

export const DeductionsManagementPage: React.FC = () => {
  const { can } = usePermissions();
  const [isAddingDeduction, setIsAddingDeduction] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  const [deductions, setDeductions] = useState<Deduction[]>([
    {
      id: '1',
      deductionType: 'HEALTH_INSURANCE',
      description: 'Health Insurance Premium',
      amount: 250.00,
      isPreTax: true,
      isPostTax: false,
      hasLimit: true,
      yearlyLimit: 3000,
      yearToDateAmount: 2750,
      employerMatch: 125,
    },
    {
      id: '2',
      deductionType: 'RETIREMENT_401K',
      description: '401(k) Contribution',
      amount: 0,
      percentage: 5,
      isPreTax: true,
      isPostTax: false,
      hasLimit: true,
      yearlyLimit: 22500,
      yearToDateAmount: 8400,
      employerMatch: 200,
    },
    {
      id: '3',
      deductionType: 'GARNISHMENT_COURT',
      description: 'Court Ordered Garnishment',
      amount: 150.00,
      isPreTax: false,
      isPostTax: true,
      hasLimit: true,
      garnishmentOrder: {
        orderNumber: 'CO-2024-1234',
        remainingBalance: 2400,
      },
    },
    {
      id: '4',
      deductionType: 'HSA',
      description: 'Health Savings Account',
      amount: 0,
      percentage: 3,
      isPreTax: true,
      isPostTax: false,
      hasLimit: true,
      yearlyLimit: 3850,
      yearToDateAmount: 1540,
    },
  ]);

  const categories = [
    { value: 'all', label: 'All Deductions', count: deductions.length },
    { value: 'insurance', label: 'Insurance', count: deductions.filter(d => d.deductionType.includes('INSURANCE')).length },
    { value: 'retirement', label: 'Retirement', count: deductions.filter(d => d.deductionType.includes('RETIREMENT') || d.deductionType.includes('401')).length },
    { value: 'health_savings', label: 'Health Savings', count: deductions.filter(d => d.deductionType.includes('HSA') || d.deductionType.includes('FSA')).length },
    { value: 'garnishments', label: 'Garnishments', count: deductions.filter(d => d.deductionType.includes('GARNISHMENT')).length },
  ];

  const filteredDeductions = selectedCategory === 'all'
    ? deductions
    : deductions.filter(d => {
        if (selectedCategory === 'insurance') return d.deductionType.includes('INSURANCE');
        if (selectedCategory === 'retirement') return d.deductionType.includes('RETIREMENT') || d.deductionType.includes('401');
        if (selectedCategory === 'health_savings') return d.deductionType.includes('HSA') || d.deductionType.includes('FSA');
        if (selectedCategory === 'garnishments') return d.deductionType.includes('GARNISHMENT');
        return true;
      });

  const getDeductionIcon = (type: string) => {
    if (type.includes('INSURANCE')) return Heart;
    if (type.includes('RETIREMENT') || type.includes('401')) return Landmark;
    if (type.includes('HSA') || type.includes('FSA')) return Shield;
    if (type.includes('GARNISHMENT')) return AlertTriangle;
    return Shield;
  };

  const getDeductionColor = (type: string) => {
    if (type.includes('INSURANCE')) return 'bg-blue-100 text-blue-600';
    if (type.includes('RETIREMENT') || type.includes('401')) return 'bg-green-100 text-green-600';
    if (type.includes('HSA') || type.includes('FSA')) return 'bg-purple-100 text-purple-600';
    if (type.includes('GARNISHMENT')) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const handleDeleteDeduction = (id: string) => {
    if (confirm('Are you sure you want to delete this deduction?')) {
      setDeductions(deductions.filter(d => d.id !== id));
    }
  };

  const totalDeductions = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);
  const totalYTD = filteredDeductions.reduce((sum, d) => sum + (d.yearToDateAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deductions Management</h1>
          <p className="text-gray-600 mt-1">
            Manage employee deductions, benefits, and garnishments
          </p>
        </div>
        {can('payroll:write') && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddingDeduction(true)}
          >
            Add Deduction
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Total Deduction Types</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredDeductions.length}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Current Period Total</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(totalDeductions)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Year-to-Date Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalYTD)}
            </p>
          </div>
        </Card>
      </div>

      {/* Category Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Deductions List */}
      {filteredDeductions.length === 0 ? (
        <EmptyState
          title="No deductions found"
          description="Add your first deduction to get started."
          action={
            can('payroll:write') ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddingDeduction(true)}
              >
                Add Deduction
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDeductions.map((deduction) => {
            const Icon = getDeductionIcon(deduction.deductionType);
            const color = getDeductionColor(deduction.deductionType);

            return (
              <Card key={deduction.id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`inline-flex p-2 rounded-lg ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {deduction.description}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {deduction.isPreTax ? 'Pre-tax' : 'Post-tax'}
                          {deduction.percentage && ` • ${deduction.percentage}% of gross`}
                        </p>
                      </div>
                    </div>
                    {can('payroll:write') && (
                      <div className="flex gap-2">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Edit deduction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => handleDeleteDeduction(deduction.id)}
                          aria-label="Delete deduction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount per Period</span>
                      <span className="font-semibold text-red-600">
                        {deduction.amount > 0
                          ? `-${formatCurrency(deduction.amount)}`
                          : deduction.percentage
                          ? `${deduction.percentage}%`
                          : 'Variable'}
                      </span>
                    </div>

                    {deduction.employerMatch && deduction.employerMatch > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employer Match</span>
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(deduction.employerMatch)}
                        </span>
                      </div>
                    )}

                    {deduction.hasLimit && deduction.yearlyLimit && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">YTD Progress</span>
                          <span className="font-medium">
                            {formatCurrency(deduction.yearToDateAmount ?? 0)} / {formatCurrency(deduction.yearlyLimit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((deduction.yearToDateAmount ?? 0) / deduction.yearlyLimit) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {deduction.garnishmentOrder && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md">
                        <p className="text-sm font-medium text-red-900">
                          Court Order: {deduction.garnishmentOrder.orderNumber}
                        </p>
                        {deduction.garnishmentOrder.remainingBalance && (
                          <p className="text-sm text-red-700 mt-1">
                            Remaining: {formatCurrency(deduction.garnishmentOrder.remainingBalance)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Deduction Modal - Simplified placeholder */}
      {isAddingDeduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add New Deduction</h2>
                <button
                  onClick={() => setIsAddingDeduction(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deduction Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select type...</option>
                    <option value="HEALTH_INSURANCE">Health Insurance</option>
                    <option value="DENTAL_INSURANCE">Dental Insurance</option>
                    <option value="VISION_INSURANCE">Vision Insurance</option>
                    <option value="RETIREMENT_401K">401(k) Retirement</option>
                    <option value="HSA">Health Savings Account</option>
                    <option value="FSA">Flexible Spending Account</option>
                    <option value="GARNISHMENT_COURT">Court Ordered Garnishment</option>
                    <option value="GARNISHMENT_TAX">Tax Garnishment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fixed Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">Pre-tax deduction</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setIsAddingDeduction(false)} className="flex-1">
                    Save Deduction
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingDeduction(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
