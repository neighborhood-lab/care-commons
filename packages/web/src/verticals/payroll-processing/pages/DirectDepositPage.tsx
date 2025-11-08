import React, { useState } from 'react';
import { Save, Plus, Trash2, Landmark, Shield, CheckCircle } from 'lucide-react';
import { Button, Card } from '@/core/components';

interface BankAccount {
  id: string;
  accountType: 'CHECKING' | 'SAVINGS';
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  isPrimary: boolean;
  isVerified: boolean;
  percentage?: number;
}

export const DirectDepositPage: React.FC = () => {
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Mock data - in real implementation, this would come from API
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      accountType: 'CHECKING',
      bankName: 'Chase Bank',
      routingNumber: '021000021',
      accountNumber: '****5678',
      isPrimary: true,
      isVerified: true,
      percentage: 100,
    },
  ]);

  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
    accountType: 'CHECKING',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    isPrimary: false,
    percentage: 0,
  });

  const handleSaveAccount = () => {
    // In real implementation, this would call API
    console.log('Saving new account:', newAccount);
    setIsAddingAccount(false);
    setNewAccount({
      accountType: 'CHECKING',
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      isPrimary: false,
      percentage: 0,
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this bank account?')) {
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const totalPercentage = accounts.reduce((sum, acc) => sum + (acc.percentage ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Direct Deposit</h1>
          <p className="text-gray-600 mt-1">
            Manage your bank accounts for direct deposit
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddingAccount(true)}
        >
          Add Bank Account
        </Button>
      </div>

      {/* Information Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Your banking information is secure
            </p>
            <p className="text-sm text-blue-800 mt-1">
              We use bank-level encryption to protect your account information. Changes to your direct deposit settings may take 1-2 pay periods to take effect.
            </p>
          </div>
        </div>
      </Card>

      {/* Current Accounts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>

        {accounts.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bank accounts on file
              </h3>
              <p className="text-gray-600 mb-4">
                Add a bank account to receive your pay via direct deposit.
              </p>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddingAccount(true)}
              >
                Add Bank Account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-lg">
                        <Landmark className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {account.bankName}
                          </h3>
                          {account.isPrimary && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Primary
                            </span>
                          )}
                          {account.isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-xs text-gray-500">Account Type</p>
                              <p className="text-sm font-medium text-gray-900">
                                {account.accountType === 'CHECKING' ? 'Checking' : 'Savings'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Routing Number</p>
                              <p className="text-sm font-medium text-gray-900">
                                {account.routingNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Account Number</p>
                              <p className="text-sm font-medium text-gray-900">
                                {account.accountNumber}
                              </p>
                            </div>
                          </div>

                          {account.percentage !== undefined && account.percentage !== 100 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500">Deposit Percentage</p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${account.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {account.percentage}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDeleteAccount(account.id)}
                        aria-label="Delete account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Form */}
      {isAddingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add Bank Account</h2>
                <button
                  onClick={() => setIsAddingAccount(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newAccount.accountType}
                    onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as 'CHECKING' | 'SAVINGS' })}
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Chase Bank"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="9 digits"
                    maxLength={9}
                    value={newAccount.routingNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, routingNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The 9-digit number at the bottom left of your check
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Account number"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The account number on your check or bank statement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit Percentage (%)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={newAccount.percentage}
                    onChange={(e) => setNewAccount({ ...newAccount, percentage: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    What percentage of your paycheck should go to this account? (Leave at 100 for primary account)
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={newAccount.isPrimary}
                      onChange={(e) => setNewAccount({ ...newAccount, isPrimary: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Set as primary account
                    </span>
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please verify your account information carefully. Incorrect information may delay your payment.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleSaveAccount}
                    className="flex-1"
                  >
                    Save Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingAccount(false)}
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

      {/* Split Deposit Info */}
      {accounts.length > 1 && (
        <Card className="bg-gray-50">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Split Deposit Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total allocated:</span>
                <span className={`font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercentage}%
                </span>
              </div>
              {totalPercentage !== 100 && (
                <p className="text-sm text-red-600">
                  Warning: Your deposit percentages must total 100%
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
