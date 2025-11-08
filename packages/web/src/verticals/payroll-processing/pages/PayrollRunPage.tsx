import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage, Card } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { usePayPeriods, useCreatePayRun, useCalculatePayRun } from '../hooks';
import { formatDate, formatCurrency } from '../utils';

export const PayrollRunPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [runType, setRunType] = useState<string>('REGULAR');
  const [notes, setNotes] = useState<string>('');

  const { data: periodsData, isLoading, error } = usePayPeriods({ status: 'OPEN' });
  const createPayRun = useCreatePayRun();
  const calculatePayRun = useCalculatePayRun();

  const handleCreatePayRun = async () => {
    if (!selectedPeriodId) {
      return;
    }

    try {
      const payRun = await createPayRun.mutateAsync({
        organizationId: 'current', // This should come from context
        payPeriodId: selectedPeriodId,
        runType,
        notes: notes || undefined,
      });

      // Automatically calculate the pay run
      await calculatePayRun.mutateAsync(payRun.id);

      // Navigate to the pay run detail page
      navigate(`/payroll/runs/${payRun.id}`);
    } catch (err) {
      console.error('Failed to create pay run:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load pay periods'}
      />
    );
  }

  const periods = periodsData?.items ?? [];
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  const isProcessing = createPayRun.isPending || calculatePayRun.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Payroll Run</h1>
          <p className="text-gray-600 mt-1">
            Create and process payroll for a pay period
          </p>
        </div>
      </div>

      {!can('payroll:write') && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                You do not have permission to create payroll runs
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Contact your administrator for access.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">Payroll Configuration</h2>

            <div className="space-y-6">
              {/* Pay Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  disabled={isProcessing || !can('payroll:write')}
                >
                  <option value="">Select a pay period</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      {period.payDate && ` (Pay: ${formatDate(period.payDate)})`}
                    </option>
                  ))}
                </select>
                {periods.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No open pay periods available. Create a pay period first.
                  </p>
                )}
              </div>

              {/* Run Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Run Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={runType}
                  onChange={(e) => setRunType(e.target.value)}
                  disabled={isProcessing || !can('payroll:write')}
                >
                  <option value="REGULAR">Regular Payroll</option>
                  <option value="CORRECTION">Correction Run</option>
                  <option value="BONUS">Bonus Run</option>
                  <option value="OFF_CYCLE">Off-Cycle Run</option>
                  <option value="FINAL">Final Payroll</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this payroll run..."
                  disabled={isProcessing || !can('payroll:write')}
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  leftIcon={<Play className="h-4 w-4" />}
                  onClick={handleCreatePayRun}
                  disabled={!selectedPeriodId || isProcessing || !can('payroll:write')}
                  className="w-full"
                  isLoading={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Generate Payroll Run'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <div className="space-y-6">
          {selectedPeriod && (
            <>
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Period Summary</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Pay Period</p>
                        <p className="font-medium">
                          {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Pay Date</p>
                        <p className="font-medium">
                          {selectedPeriod.payDate ? formatDate(selectedPeriod.payDate) : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Caregivers</p>
                        <p className="font-medium">
                          {selectedPeriod.totalCaregivers ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {selectedPeriod.totalGrossPay && selectedPeriod.totalGrossPay > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Estimated Totals</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Hours</span>
                        <span className="font-medium">
                          {(selectedPeriod.totalHours ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Pay</span>
                        <span className="font-medium">
                          {formatCurrency(selectedPeriod.totalGrossPay ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Withheld</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedPeriod.totalTaxWithheld ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2">
                        <span className="font-semibold">Net Pay</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(selectedPeriod.totalNetPay ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                What happens next?
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Payroll will be calculated automatically</li>
                <li>Review the pay run details and pay stubs</li>
                <li>Make any necessary corrections</li>
                <li>Approve the pay run for processing</li>
                <li>Process payments to caregivers</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
