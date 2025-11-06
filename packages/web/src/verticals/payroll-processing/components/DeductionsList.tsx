import React from 'react';
import { Card } from '@/core/components';
import { formatCurrency } from '../utils';
import type { Deduction } from '../types';

interface DeductionsListProps {
  deductions: Deduction[];
}

export const DeductionsList: React.FC<DeductionsListProps> = ({ deductions }) => {
  if (!deductions || deductions.length === 0) {
    return null;
  }

  // Group deductions by category
  const groupedDeductions = deductions.reduce<Record<string, Deduction[]>>((groups, deduction) => {
    let category = 'Other';

    if (deduction.deductionType.includes('INSURANCE')) {
      category = 'Insurance';
    } else if (deduction.deductionType.includes('RETIREMENT') || deduction.deductionType.includes('401')) {
      category = 'Retirement';
    } else if (deduction.deductionType.includes('GARNISHMENT')) {
      category = 'Garnishments';
    } else if (deduction.deductionType.includes('FSA') || deduction.deductionType.includes('HSA')) {
      category = 'Health Savings';
    }

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(deduction);
    return groups;
  }, {} as Record<string, Deduction[]>);

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Other Deductions</h2>

        {Object.entries(groupedDeductions).map(([category, categoryDeductions]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
            <div className="space-y-2">
              {categoryDeductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <span className="text-gray-700">{deduction.description}</span>
                    {deduction.hasLimit && deduction.yearlyLimit && (
                      <div className="text-xs text-gray-500 mt-1">
                        YTD: {formatCurrency(deduction.yearToDateAmount || 0)} of{' '}
                        {formatCurrency(deduction.yearlyLimit)}
                      </div>
                    )}
                    {deduction.garnishmentOrder && (
                      <div className="text-xs text-gray-500 mt-1">
                        Order #{deduction.garnishmentOrder.orderNumber}
                        {deduction.garnishmentOrder.remainingBalance && (
                          <span> - Remaining: {formatCurrency(deduction.garnishmentOrder.remainingBalance)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(deduction.amount)}
                    </span>
                    {deduction.employerMatch && deduction.employerMatch > 0 && (
                      <div className="text-xs text-green-600">
                        +{formatCurrency(deduction.employerMatch)} match
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {totalDeductions > 0 && (
          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 mt-4">
            <span className="text-lg font-bold">Total Other Deductions</span>
            <span className="text-lg font-bold text-red-600">
              -{formatCurrency(totalDeductions)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
