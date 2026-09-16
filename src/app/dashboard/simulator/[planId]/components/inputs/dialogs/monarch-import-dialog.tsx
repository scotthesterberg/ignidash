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
  transformMonarchAccounts,
  type MappedAccountItem,
  type MappedExpenseItem,
} from '@/lib/monarch/mapping';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { accountToConvex, expenseToConvex, debtToConvex } from '@/lib/utils/data-transformers';
import { ArrowDownTrayIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid';
import { CloudIcon, CheckCircleIcon } from 'lucide-react';

interface MonarchImportDialogProps {
  onClose: () => void;
}

type TabMode = 'direct' | 'csv';

export default function MonarchImportDialog({ onClose }: MonarchImportDialogProps) {
  const planId = useSelectedPlanId();
  const [tab, setTab] = useState<TabMode>('direct');

  // Direct sync credentials
  const [token, setToken] = useState('');
  const [lookbackMonths, setLookbackMonths] = useState(6);
  const [syncAccounts, setSyncAccounts] = useState(true);
  const [syncExpenses, setSyncExpenses] = useState(true);

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

  // Mutation
  const batchImport = useMutation(api.plans.batchImportMonarchData);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // 1. Handle Fetch via Direct API
  const handleFetchDirect = async () => {
    if (!token.trim()) {
      setFetchError('Please provide your Monarch Money session token.');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/monarch/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          lookbackMonths,
          fetchAccounts: syncAccounts,
          fetchTransactions: syncExpenses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync with Monarch Money.');
      }

      setMappedAccounts(data.accounts || []);
      setMappedExpenses(data.expenses || []);
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

      if (accountsCsvFile) {
        const text = await accountsCsvFile.text();
        const rawAccounts = parseMonarchAccountsCsv(text);
        accounts = transformMonarchAccounts(rawAccounts);
      }

      if (transactionsCsvFile) {
        const text = await transactionsCsvFile.text();
        const rawTxns = parseMonarchTransactionsCsv(text);
        expenses = aggregateMonarchTransactions(rawTxns, lookbackMonths);
      }

      setMappedAccounts(accounts);
      setMappedExpenses(expenses);
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

      // Convert to Ignidash types
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

      await batchImport({
        planId,
        accounts: convexAccounts,
        debts: convexDebts,
        expenses: convexExpenses,
      });

      setImportSuccess(
        `Successfully imported ${convexAccounts.length} account(s), ${convexDebts.length} debt(s), and ${convexExpenses.length} expense category(ies)!`
      );
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
                <Field>
                  <Label htmlFor="token">Monarch Session Token</Label>
                  <Input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1Ni..."
                  />
                  <Description>
                    Obtain this from your browser cookies (`monarchmoney.com` $\rightarrow$ `sessionid` or authorization header) or from your saved Monarch session.
                  </Description>
                </Field>

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
                      Import Accounts & Balances
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox checked={syncExpenses} onChange={setSyncExpenses} />
                      Import Spending as Expenses
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
                  Accounts & Debts ({mappedAccounts.filter((a) => a.included).length} of {mappedAccounts.length} selected)
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
            {step === 'config' ? (
              <Button
                color="rose"
                onClick={tab === 'direct' ? handleFetchDirect : handleParseCsv}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Preview Import'}
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
