/**
 * Direct Deposit Screen
 *
 * Allows caregivers to manage their direct deposit settings.
 * Features:
 * - View enrolled bank accounts
 * - Add new bank account
 * - Remove bank account
 * - Set primary account
 * - View pay history summary
 * - View upcoming payment
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { Card, CardContent, Badge, Button } from '../../components/index';
import {
  payrollService,
  formatCurrency,
  getPaymentStatusInfo,
} from '../../services/payroll.service';
import type {
  DirectDepositSettings,
  BankAccount,
  PayrollSummary,
  PayPeriod,
  AccountType,
} from '../../services/payroll.service';

export function DirectDepositScreen() {
  const [settings, setSettings] = useState<DirectDepositSettings | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [recentPay, setRecentPay] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add account form state
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [makePrimary, setMakePrimary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [depositSettings, payrollSummary, payHistory] = await Promise.all([
        payrollService.getDirectDepositSettings(),
        payrollService.getPayrollSummary(),
        payrollService.getPayHistory(),
      ]);
      setSettings(depositSettings);
      setSummary(payrollSummary);
      setRecentPay(payHistory.slice(0, 3));
    } catch (error) {
      console.error('Failed to load payroll data:', error);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const resetForm = useCallback(() => {
    setBankName('');
    setAccountType('CHECKING');
    setRoutingNumber('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setMakePrimary(true);
  }, []);

  const handleAddAccount = useCallback(async () => {
    // Validation
    if (!bankName.trim()) {
      Alert.alert('Error', 'Please enter bank name');
      return;
    }
    if (routingNumber.length !== 9) {
      Alert.alert('Error', 'Routing number must be 9 digits');
      return;
    }
    if (accountNumber.length < 4 || accountNumber.length > 17) {
      Alert.alert('Error', 'Account number must be 4-17 digits');
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await payrollService.addBankAccount(
        bankName.trim(),
        accountType,
        routingNumber,
        accountNumber,
        makePrimary
      );
      setShowAddModal(false);
      resetForm();
      Alert.alert(
        'Account Added',
        'Your bank account has been added. It will be verified via micro-deposits within 2-3 business days.'
      );
      void loadData();
    } catch {
      Alert.alert('Error', 'Failed to add bank account');
    } finally {
      setIsSubmitting(false);
    }
  }, [bankName, accountType, routingNumber, accountNumber, confirmAccountNumber, makePrimary, resetForm, loadData]);

  const handleRemoveAccount = useCallback(
    (account: BankAccount) => {
      Alert.alert(
        'Remove Account',
        `Are you sure you want to remove ${account.bankName} (${account.accountNumber})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await payrollService.removeBankAccount(account.id);
                Alert.alert('Success', 'Bank account removed');
                void loadData();
              } catch {
                Alert.alert('Error', 'Failed to remove bank account');
              }
            },
          },
        ]
      );
    },
    [loadData]
  );

  const handleSetPrimary = useCallback(
    async (account: BankAccount) => {
      try {
        await payrollService.setPrimaryAccount(account.id);
        Alert.alert('Success', `${account.bankName} is now your primary account`);
        void loadData();
      } catch {
        Alert.alert('Error', 'Failed to update primary account');
      }
    },
    [loadData]
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading payment settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Payment Summary Card */}
      {summary && (
        <Card style={styles.summaryCard}>
          <CardContent>
            <Text style={styles.sectionTitle}>Payment Summary</Text>

            {summary.nextPayDate && (
              <View style={styles.nextPayContainer}>
                <View style={styles.nextPayInfo}>
                  <Text style={styles.nextPayLabel}>Next Payment</Text>
                  <Text style={styles.nextPayDate}>
                    {summary.nextPayDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.nextPayAmount}>
                  {summary.nextPayAmount ? formatCurrency(summary.nextPayAmount) : '--'}
                </Text>
              </View>
            )}

            <View style={styles.ytdContainer}>
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>YTD Gross</Text>
                <Text style={styles.ytdValue}>{formatCurrency(summary.ytdGross)}</Text>
              </View>
              <View style={styles.ytdDivider} />
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>YTD Net</Text>
                <Text style={styles.ytdValue}>{formatCurrency(summary.ytdNet)}</Text>
              </View>
              <View style={styles.ytdDivider} />
              <View style={styles.ytdItem}>
                <Text style={styles.ytdLabel}>YTD Hours</Text>
                <Text style={styles.ytdValue}>{summary.ytdHours.toFixed(0)}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Direct Deposit Status */}
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Direct Deposit</Text>
            {settings?.isEnrolled ? (
              <Badge variant="success" size="sm">Enrolled</Badge>
            ) : (
              <Badge variant="warning" size="sm">Not Enrolled</Badge>
            )}
          </View>

          {!settings?.isEnrolled && (
            <View style={styles.enrollPrompt}>
              <Text style={styles.enrollText}>
                Set up direct deposit to get paid faster. Payments are deposited directly
                to your bank account on payday.
              </Text>
            </View>
          )}

          {/* Bank Accounts */}
          {settings?.accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.accountInfo}>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <Text style={styles.accountDetails}>
                    {account.accountType === 'CHECKING' ? 'Checking' : 'Savings'} •{' '}
                    {account.accountNumber}
                  </Text>
                </View>
                <View style={styles.accountBadges}>
                  {account.isPrimary && (
                    <Badge variant="primary" size="sm">Primary</Badge>
                  )}
                  {account.isVerified ? (
                    <Badge variant="success" size="sm">Verified</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Pending</Badge>
                  )}
                </View>
              </View>

              <View style={styles.accountActions}>
                {!account.isPrimary && settings.accounts.length > 1 && (
                  <TouchableOpacity
                    style={styles.accountAction}
                    onPress={() => handleSetPrimary(account)}
                  >
                    <Text style={styles.accountActionText}>Make Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.accountAction, styles.removeAction]}
                  onPress={() => handleRemoveAccount(account)}
                >
                  <Text style={styles.removeActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Button
            variant="secondary"
            size="md"
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          >
            + Add Bank Account
          </Button>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Recent Payments</Text>

          {recentPay.length === 0 ? (
            <Text style={styles.emptyText}>No payment history available</Text>
          ) : (
            recentPay.map((pay) => {
              const statusInfo = getPaymentStatusInfo(pay.status);
              return (
                <View key={pay.id} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDate}>
                      {pay.payDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.paymentPeriod}>
                      {pay.hoursWorked.toFixed(0)} hrs • {pay.visits} visits
                    </Text>
                  </View>
                  <View style={styles.paymentAmounts}>
                    <Text style={styles.paymentNet}>{formatCurrency(pay.netAmount)}</Text>
                    <Badge variant={statusInfo.badgeVariant} size="sm">
                      {statusInfo.label}
                    </Badge>
                  </View>
                </View>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Your banking information is encrypted and stored securely. We use
          industry-standard security measures to protect your data.
        </Text>
      </View>

      <View style={styles.bottomSpacing} />

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bank Name</Text>
              <TextInput
                style={styles.formInput}
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g., Chase Bank"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Type</Text>
              <View style={styles.accountTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.accountTypeOption,
                    accountType === 'CHECKING' && styles.accountTypeSelected,
                  ]}
                  onPress={() => setAccountType('CHECKING')}
                >
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'CHECKING' && styles.accountTypeTextSelected,
                    ]}
                  >
                    Checking
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.accountTypeOption,
                    accountType === 'SAVINGS' && styles.accountTypeSelected,
                  ]}
                  onPress={() => setAccountType('SAVINGS')}
                >
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'SAVINGS' && styles.accountTypeTextSelected,
                    ]}
                  >
                    Savings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Routing Number</Text>
              <TextInput
                style={styles.formInput}
                value={routingNumber}
                onChangeText={(text) => setRoutingNumber(text.replace(/\D/g, '').slice(0, 9))}
                placeholder="9 digits"
                keyboardType="numeric"
                maxLength={9}
              />
              <Text style={styles.formHint}>Find this on your check or bank statement</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.formInput}
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/\D/g, '').slice(0, 17))}
                placeholder="4-17 digits"
                keyboardType="numeric"
                maxLength={17}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm Account Number</Text>
              <TextInput
                style={styles.formInput}
                value={confirmAccountNumber}
                onChangeText={(text) => setConfirmAccountNumber(text.replace(/\D/g, '').slice(0, 17))}
                placeholder="Re-enter account number"
                keyboardType="numeric"
                maxLength={17}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setMakePrimary(!makePrimary)}
            >
              <View style={[styles.checkbox, makePrimary && styles.checkboxChecked]}>
                {makePrimary && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Make this my primary account</Text>
            </TouchableOpacity>

            <View style={styles.verificationNotice}>
              <Text style={styles.verificationTitle}>Account Verification</Text>
              <Text style={styles.verificationText}>
                We will make two small deposits (under $1) to verify your account.
                This usually takes 2-3 business days. You will need to confirm
                the deposit amounts to complete verification.
              </Text>
            </View>

            <Button
              variant="primary"
              size="lg"
              onPress={handleAddAccount}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </Button>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nextPayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextPayInfo: {
    flex: 1,
  },
  nextPayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  nextPayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  nextPayAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E40AF',
  },
  ytdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ytdItem: {
    alignItems: 'center',
    flex: 1,
  },
  ytdDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  ytdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  ytdValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  enrollPrompt: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  enrollText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  accountCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  accountDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  accountAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  accountActionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  removeAction: {},
  removeActionText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  addButton: {
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  paymentPeriod: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentAmounts: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentNet: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 32,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#2563EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  formHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  accountTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  accountTypeSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  accountTypeText: {
    fontSize: 14,
    color: '#374151',
  },
  accountTypeTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  verificationNotice: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
