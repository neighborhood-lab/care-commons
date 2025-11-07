import React from 'react';
import { Card } from '@/core/components';
import { formatCurrency } from '../utils';
import type { PayStub } from '../types';

interface TaxSummaryProps {
  payStub: PayStub;
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({ payStub }) => {
  const taxItems = [
    {
      label: 'Federal Income Tax',
      current: payStub.federalIncomeTax,
      ytd: payStub.ytdFederalTax,
    },
    {
      label: 'State Income Tax',
      current: payStub.stateIncomeTax,
      ytd: payStub.ytdStateTax,
    },
    {
      label: 'Social Security',
      current: payStub.socialSecurityTax,
      ytd: payStub.ytdSocialSecurity,
    },
    {
      label: 'Medicare',
      current: payStub.medicareTax,
      ytd: payStub.ytdMedicare,
    },
  ];

  if (payStub.localIncomeTax > 0) {
    taxItems.splice(2, 0, {
      label: 'Local Income Tax',
      current: payStub.localIncomeTax,
      ytd: 0, // Not tracked in basic schema
    });
  }

  if (payStub.additionalMedicareTax > 0) {
    taxItems.push({
      label: 'Additional Medicare Tax',
      current: payStub.additionalMedicareTax,
      ytd: 0, // Not tracked in basic schema
    });
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Tax Withholdings</h2>
        <div className="space-y-3">
          {taxItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-gray-700">{item.label}</span>
                {item.ytd > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    (YTD: {formatCurrency(item.ytd)})
                  </span>
                )}
              </div>
              <span className="font-semibold text-red-600">
                -{formatCurrency(item.current)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
            <span className="text-lg font-bold">Total Tax Withheld</span>
            <span className="text-lg font-bold text-red-600">
              -{formatCurrency(payStub.totalTaxWithheld)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
