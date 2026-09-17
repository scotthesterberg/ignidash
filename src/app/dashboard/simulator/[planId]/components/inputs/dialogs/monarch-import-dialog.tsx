'use client';

import { useState } from 'react';
import { DialogTitle, DialogBody, DialogActions } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Input } from '@/components/catalyst/input';
import { Select } from '@/components/catalyst/select';
import { Field, Label, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Checkbox } from '@/components/catalyst/checkbox';
import { formatCompactCurrency } from '@/lib/utils/number-formatters';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { parseMonarchAccountsCsv, parseMonarchTransactionsCsv } from '@/lib/monarch/csv-parser';
import {
  aggregateMonarchTransactions,
  aggregateMonarchIncome,
  transformMonarchAccounts,
  type MappedAccountItem,
  type MappedExpenseItem,
  type MappedIncomeItem,
} from '@/lib/monarch/mapping';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { accountToConvex, expenseToConvex, debtToConvex, incomeToConvex } from '@/lib/utils/data-transformers';
import { ArrowDownTrayIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid';
import { CloudIcon, CheckCircleIcon, MailIcon } from 'lucide-react';

interface MonarchImportDialogProps {
  onClose: () => void;
}

type TabMode = 'direct' | 'csv';
type AuthStep = 'credentials' | 'otp' | 'mfa';

export default function MonarchImportDialog({ onClose }: MonarchImportDialogProps) {
  const planId = useSelectedPlanId();
  const [tab, setTab] = useState<TabMode>('direct');

  // Direct sync credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [lookbackMonths, setLookbackMonths] = useState(6);
  const [syncAccounts, setSyncAccounts] = useState(true);
  const [syncExpenses, setSyncExpenses] = useState(true);
  const [syncIncome, setSyncIncome] = useState(true);

  // CSV files state
  const [accountsCsvFile, setAccountsCsvFile] = useState<File | null>(null);
  const [transactionsCsvFile, setTransactionsCsvFile] = useState<File | null>(null);

  // Status & Progress
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Staged data for review
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [mappedAccounts, setMappedAccounts] = useState<MappedAccountItem[]>([]);
  const [mappedExpenses, setMappedExpenses] = useState<MappedExpenseItem[]>([]);
  const [mappedIncome, setMappedIncome] = useState<MappedIncomeItem[]>([]);

  // Mutation
  const batchImport = useMutation(api.plans.batchImportMonarchData);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // 1. Handle Fetch via Direct API (with email/password)
  const handleFetchDirect = async () => {
    if (!email.trim()) {
      setFetchError('Please enter your Monarch Money email address.');
      return;
    }
    if (!password.trim()) {
      setFetchError('Please enter your Monarch Money password.');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const body: Record<string, unknown> = {
        email: email.trim(),
        password,
        lookbackMonths,
        fetchAccounts: syncAccounts,
        fetchTransactions: syncExpenses,
        fetchIncome: syncIncome,
      };

      if (authStep === 'otp' && otpCode.trim()) {
        body.otpCode = otpCode.trim();
      } else if (authStep === 'mfa' && mfaCode.trim()) {
        body.mfaCode = mfaCode.trim();
      }

      const res = await fetch('/api/monarch/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // 202 means we need additional auth step (OTP or MFA)
      if (res.status === 202) {
        if (data.requiresOtp) {
          setAuthStep('otp');
          setFetchError(null);
          return;
        }
        if (data.requiresMfa) {
          setAuthStep('mfa');
          setFetchError(null);
          return;
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync with Monarch Money.');
      }

      setMappedAccounts(data.accounts || []);
      setMappedExpenses(data.expenses || []);
      setMappedIncome(data.income || []);
      setStep('review');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error during sync.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Parse via CSV
  const handleParseCsv = async () => {
    if (!accountsCsvFile && !transactionsCsvFile) {
      setFetchError('Please select at least one CSV file (Accounts or Transactions).');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      let accounts: MappedAccountItem[] = [];
      let expenses: MappedExpenseItem[] = [];
      let income: MappedIncomeItem[] = [];

      if (accountsCsvFile) {
        const text = await accountsCsvFile.text();
        const rawAccounts = parseMonarchAccountsCsv(text);
        accounts = transformMonarchAccounts(rawAccounts);
      }

      if (transactionsCsvFile) {
        const text = await transactionsCsvFile.text();
        const rawTxns = parseMonarchTransactionsCsv(text);
        if (syncExpenses) {
          expenses = aggregateMonarchTransactions(rawTxns, lookbackMonths);
        }
        if (syncIncome) {
          income = aggregateMonarchIncome(rawTxns, lookbackMonths);
        }
      }

      setMappedAccounts(accounts);
      setMappedExpenses(expenses);
      setMappedIncome(income);
      setStep('review');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to parse CSV files.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Confirm & Commit to Convex Plan
  const handleApplyImport = async () => {
    setIsImporting(true);
    setFetchError(null);

    try {
      const selectedAccounts = mappedAccounts.filter((a) => a.included && a.selectedType !== 'debt');
      const selectedDebts = mappedAccounts.filter((a) => a.included && a.selectedType === 'debt');
      const selectedExpenses = mappedExpenses.filter((e) => e.included);
      const selectedIncome = mappedIncome.filter((i) => i.included);

      // Convert accounts to Ignidash types
      const convexAccounts = selectedAccounts.map((a) => {
        const base = {
          id: a.id,
          name: a.name,
          balance: a.balance,
        };

        if (a.selectedType === 'savings') {
          return accountToConvex({ ...base, type: 'savings' });
        }

        if (a.selectedType === 'taxableBrokerage') {
          return accountToConvex({
            ...base,
            type: 'taxableBrokerage',
            percentBonds: a.percentBonds,
            costBasis: a.costBasis ?? a.balance,
          });
        }

        if (a.selectedType === 'roth401k' || a.selectedType === 'roth403b' || a.selectedType === 'rothIra') {
          return accountToConvex({
            ...base,
            type: a.selectedType,
            percentBonds: a.percentBonds,
            contributionBasis: a.contributionBasis ?? a.balance,
          });
        }

        if (a.selectedType === 'hsa') {
          return accountToConvex({
            ...base,
            type: 'hsa',
            percentBonds: a.percentBonds,
          });
        }

        // Traditional 401k, 403b, ira
        return accountToConvex({
          ...base,
          type: a.selectedType as '401k' | '403b' | 'ira',
          percentBonds: a.percentBonds,
        });
      });

      const convexDebts = selectedDebts.map((d) =>
        debtToConvex({
          id: d.id,
          name: d.name,
          balance: d.balance,
          apr: d.apr ?? 5,
          interestType: 'simple',
          startDate: { type: 'now' },
          monthlyPayment: d.monthlyPayment ?? Math.max(25, Math.round(d.balance * 0.02)),
        })
      );

      const convexExpenses = selectedExpenses.map((e) =>
        expenseToConvex({
          id: e.id,
          name: e.categoryName,
          amount: Math.max(1, Math.round(e.monthlyAverage)),
          frequency: 'monthly',
          timeframe: {
            start: { type: 'now' },
            end: { type: 'atLifeExpectancy' },
          },
        })
      );

      const convexIncomes = selectedIncome.map((inc) =>
        incomeToConvex({
          id: inc.id,
          name: inc.categoryName,
          amount: Math.max(1, Math.round(inc.monthlyAverage)),
          frequency: 'monthly',
          timeframe: {
            start: { type: 'now' },
            end: { type: 'atRetirement' },
          },
          taxes: {
            incomeType: 'wage',
            withholding: 22,
          },
          disabled: false,
        })
      );

      await batchImport({
        planId,
        accounts: convexAccounts,
        debts: convexDebts,
        expenses: convexExpenses,
        incomes: convexIncomes,
      });

      const parts = [
        convexAccounts.length > 0 && `${convexAccounts.length} account(s)`,
        convexDebts.length > 0 && `${convexDebts.length} debt(s)`,
        convexExpenses.length > 0 && `${convexExpenses.length} expense category(ies)`,
        convexIncomes.length > 0 && `${convexIncomes.length} income source(s)`,
      ].filter(Boolean);

      setImportSuccess(`Successfully imported ${parts.join(', ')}!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to import data into plan.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <DialogTitle className="flex items-center gap-2" onClose={onClose}>
        <ArrowDownTrayIcon className="size-6 text-primary" />
        Import from Monarch Money
      </DialogTitle>

      <DialogBody className="space-y-6">
        {importSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <CheckCircleIcon className="size-12 text-emerald-500" />
            <p className="font-semibold text-lg">{importSuccess}</p>
          </div>
        ) : step === 'config' ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  tab === 'direct'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                onClick={() => setTab('direct')}
              >
                <CloudIcon className="size-4" />
                Direct API Sync
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  tab === 'csv'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                onClick={() => setTab('csv')}
              >
                <DocumentTextIcon className="size-4" />
                CSV File Upload
              </button>
            </div>

            {tab === 'direct' ? (
              <div className="space-y-4">
                {authStep === 'credentials' ? (
                  <>
                    <Field>
                      <Label htmlFor="mm-email">Monarch Money Email</Label>
                      <Input
                        id="mm-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </Field>
                    <Field>
                      <Label htmlFor="mm-password">Password</Label>
                      <Input
                        id="mm-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your Monarch Money password"
                        autoComplete="current-password"
                      />
                      <Description>
                        Credentials are sent directly to the Monarch Money API and are never stored.
                      </Description>
                    </Field>
                  </>
                ) : authStep === 'otp' ? (
                  <Field>
                    <Label htmlFor="mm-otp" className="flex items-center gap-2">
                      <MailIcon className="size-4" />
                      Email Verification Code
                    </Label>
                    <Input
                      id="mm-otp"
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      maxLength={8}
                    />
                    <Description>
                      Monarch Money sent a verification code to <strong>{email}</strong>. Enter it above to continue.
                    </Description>
                  </Field>
                ) : (
                  <Field>
                    <Label htmlFor="mm-mfa">Authenticator Code (MFA)</Label>
                    <Input
                      id="mm-mfa"
                      type="text"
                      inputMode="numeric"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                    <Description>Enter the 6-digit code from your authenticator app.</Description>
                  </Field>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor="lookback">Spending Lookback</Label>
                    <Select
                      id="lookback"
                      value={lookbackMonths}
                      onChange={(e) => setLookbackMonths(Number(e.target.value))}
                    >
                      <option value={3}>Last 3 Months</option>
                      <option value={6}>Last 6 Months (Recommended)</option>
                      <option value={12}>Last 12 Months</option>
                    </Select>
                  </Field>

                  <div className="space-y-2 pt-6">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncAccounts} onChange={setSyncAccounts} />
                      Accounts &amp; Balances
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncExpenses} onChange={setSyncExpenses} />
                      Spending as Expenses
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncIncome} onChange={setSyncIncome} />
                      Income Sources
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Field>
                  <Label htmlFor="accountsCsv">Accounts CSV (Optional)</Label>
                  <Input
                    id="accountsCsv"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setAccountsCsvFile(e.target.files?.[0] || null)}
                  />
                  <Description>Exported from Monarch Money: Settings $\rightarrow$ Export Data $\rightarrow$ Accounts</Description>
                </Field>

                <Field>
                  <Label htmlFor="txnsCsv">Transactions CSV (Optional)</Label>
                  <Input
                    id="txnsCsv"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setTransactionsCsvFile(e.target.files?.[0] || null)}
                  />
                  <Description>Exported from Monarch Money: Transactions $\rightarrow$ Export CSV</Description>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor="csvLookback">Spending Lookback Window</Label>
                    <Select
                      id="csvLookback"
                      value={lookbackMonths}
                      onChange={(e) => setLookbackMonths(Number(e.target.value))}
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months (Recommended)</option>
                      <option value={12}>12 Months</option>
                    </Select>
                  </Field>

                  <div className="space-y-2 pt-6">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncExpenses} onChange={setSyncExpenses} />
                      Spending as Expenses
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncIncome} onChange={setSyncIncome} />
                      Income Sources
                    </label>
                  </div>
                </div>
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
                <ExclamationTriangleIcon className="size-5 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}
          </>
        ) : (
          /* Step 2: Review Staged Data */
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {mappedAccounts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">
                  Accounts &amp; Debts ({mappedAccounts.filter((a) => a.included).length} of {mappedAccounts.length} selected)
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
                  {mappedAccounts.map((acc, idx) => (
                    <div key={acc.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={acc.included}
                          onChange={(val) => {
                            const updated = [...mappedAccounts];
                            updated[idx].included = val;
                            setMappedAccounts(updated);
                          }}
                        />
                        <div className="truncate">
                          <p className="font-medium truncate">{acc.name}</p>
                          <p className="text-xs text-zinc-500">{formatCompactCurrency(acc.balance, 2)}</p>
                        </div>
                      </div>

                      {/* Type Selector */}
                      <div className="w-48">
                        <Select
                          value={acc.selectedType}
                          onChange={(e) => {
                            const updated = [...mappedAccounts];
                            updated[idx].selectedType = e.target.value as AccountInputs['type'] | 'debt';
                            updated[idx].isDebt = e.target.value === 'debt';
                            setMappedAccounts(updated);
                          }}
                        >
                          <option value="savings">Savings / Cash</option>
                          <option value="taxableBrokerage">Taxable Brokerage</option>
                          <option value="401k">Traditional 401(k)</option>
                          <option value="403b">Traditional 403(b)</option>
                          <option value="ira">Traditional IRA</option>
                          <option value="roth401k">Roth 401(k)</option>
                          <option value="roth403b">Roth 403(b)</option>
                          <option value="rothIra">Roth IRA</option>
                          <option value="hsa">HSA</option>
                          <option value="debt">Debt / Loan</option>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mappedExpenses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">
                  Recurring Expenses ({mappedExpenses.filter((e) => e.included).length} of {mappedExpenses.length} selected)
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
                  {mappedExpenses.map((exp, idx) => (
                    <div key={exp.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={exp.included}
                          onChange={(val) => {
                            const updated = [...mappedExpenses];
                            updated[idx].included = val;
                            setMappedExpenses(updated);
                          }}
                        />
                        <div className="truncate">
                          <p className="font-medium truncate">{exp.categoryName}</p>
                          <p className="text-xs text-zinc-500">
                            {exp.transactionCount} transactions (${exp.totalSpent} total)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Monthly Avg:</span>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={exp.monthlyAverage}
                            onChange={(e) => {
                              const updated = [...mappedExpenses];
                              updated[idx].monthlyAverage = parseFloat(e.target.value) || 0;
                              setMappedExpenses(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mappedIncome.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">
                  Income Sources ({mappedIncome.filter((i) => i.included).length} of {mappedIncome.length} selected)
                </h3>
                <p className="text-xs text-zinc-500">
                  Imported as monthly wage income. You can adjust type and withholding after import.
                </p>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
                  {mappedIncome.map((inc, idx) => (
                    <div key={inc.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={inc.included}
                          onChange={(val) => {
                            const updated = [...mappedIncome];
                            updated[idx].included = val;
                            setMappedIncome(updated);
                          }}
                        />
                        <div className="truncate">
                          <p className="font-medium truncate">{inc.categoryName}</p>
                          <p className="text-xs text-zinc-500">
                            {inc.transactionCount} transactions (${inc.totalEarned} total)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Monthly Avg:</span>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={inc.monthlyAverage}
                            onChange={(e) => {
                              const updated = [...mappedIncome];
                              updated[idx].monthlyAverage = parseFloat(e.target.value) || 0;
                              setMappedIncome(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
                <ExclamationTriangleIcon className="size-5 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain onClick={onClose} disabled={isLoading || isImporting}>
          Cancel
        </Button>
        {!importSuccess && (
          <>
            {step === 'review' && (
              <Button plain onClick={() => setStep('config')} disabled={isLoading || isImporting}>
                Back
              </Button>
            )}
            {authStep !== 'credentials' && step === 'config' && tab === 'direct' && (
              <Button
                plain
                onClick={() => {
                  setAuthStep('credentials');
                  setOtpCode('');
                  setMfaCode('');
                  setFetchError(null);
                }}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            {step === 'config' ? (
              <Button
                color="rose"
                onClick={tab === 'direct' ? handleFetchDirect : handleParseCsv}
                disabled={isLoading}
              >
                {isLoading
                  ? 'Connecting...'
                  : authStep === 'otp'
                    ? 'Verify Code'
                    : authStep === 'mfa'
                      ? 'Verify MFA'
                      : 'Preview Import'}
              </Button>
            ) : (
              <Button color="rose" onClick={handleApplyImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Apply to Plan'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </>
  );
}
