import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';

export interface MonarchRawAccount {
  id: string;
  displayName: string;
  currentBalance: number;
  type?: {
    name: string;
    display?: string;
  } | string;
  subtype?: {
    name: string;
    display?: string;
  } | string;
  isAsset?: boolean;
  mask?: string;
}

export interface MonarchRawTransaction {
  id: string;
  amount: number;
  date: string;
  category?: {
    id?: string;
    name?: string;
    group?: {
      id?: string;
      type?: string;
      name?: string;
    };
  };
  merchant?: {
    name?: string;
  };
  hideFromReports?: boolean;
}

export interface MappedAccountItem {
  id: string;
  originalName: string;
  name: string;
  balance: number;
  isDebt: boolean;
  detectedType: AccountInputs['type'] | 'debt';
  selectedType: AccountInputs['type'] | 'debt';
  percentBonds: number;
  costBasis?: number;
  contributionBasis?: number;
  apr?: number;
  monthlyPayment?: number;
  included: boolean;
}

export interface MappedExpenseItem {
  id: string;
  categoryName: string;
  monthlyAverage: number;
  totalSpent: number;
  transactionCount: number;
  included: boolean;
}

/**
 * Maps Monarch account types & subtypes to Ignidash account types.
 */
export function mapMonarchAccountType(
  typeInput?: { name: string } | string,
  subtypeInput?: { name: string } | string
): { type: AccountInputs['type'] | 'debt'; isDebt: boolean } {
  const typeStr = (typeof typeInput === 'string' ? typeInput : typeInput?.name || '').toLowerCase();
  const subtypeStr = (typeof subtypeInput === 'string' ? subtypeInput : subtypeInput?.name || '').toLowerCase();

  // 1. Debt check
  if (
    typeStr === 'credit' ||
    typeStr === 'loan' ||
    typeStr === 'mortgage' ||
    subtypeStr.includes('loan') ||
    subtypeStr.includes('mortgage') ||
    subtypeStr.includes('credit')
  ) {
    return { type: 'debt', isDebt: true };
  }

  // 2. Roth check
  if (subtypeStr.includes('roth')) {
    if (subtypeStr.includes('401')) return { type: 'roth401k', isDebt: false };
    if (subtypeStr.includes('403')) return { type: 'roth403b', isDebt: false };
    return { type: 'rothIra', isDebt: false };
  }

  // 3. Tax Deferred check
  if (
    subtypeStr.includes('401') ||
    subtypeStr.includes('ira') ||
    subtypeStr.includes('403') ||
    subtypeStr.includes('sep') ||
    subtypeStr.includes('simple')
  ) {
    if (subtypeStr.includes('403')) return { type: '403b', isDebt: false };
    if (subtypeStr.includes('ira')) return { type: 'ira', isDebt: false };
    return { type: '401k', isDebt: false };
  }

  // 4. HSA check
  if (subtypeStr.includes('hsa') || typeStr.includes('hsa')) {
    return { type: 'hsa', isDebt: false };
  }

  // 5. Brokerage / Taxable
  if (
    typeStr === 'brokerage' ||
    typeStr === 'investment' ||
    subtypeStr.includes('brokerage') ||
    subtypeStr.includes('investment')
  ) {
    return { type: 'taxableBrokerage', isDebt: false };
  }

  // 6. Depository / Cash / Savings default
  return { type: 'savings', isDebt: false };
}

/**
 * Transforms raw Monarch accounts to MappedAccountItems for preview and editing.
 */
export function transformMonarchAccounts(rawAccounts: MonarchRawAccount[]): MappedAccountItem[] {
  return rawAccounts.map((acc) => {
    const { type, isDebt } = mapMonarchAccountType(acc.type, acc.subtype);
    const balance = Math.abs(acc.currentBalance ?? 0);

    return {
      id: acc.id || crypto.randomUUID(),
      originalName: acc.displayName,
      name: acc.displayName,
      balance,
      isDebt,
      detectedType: type,
      selectedType: type,
      percentBonds: 0,
      costBasis: type === 'taxableBrokerage' ? balance : undefined,
      contributionBasis: type === 'roth401k' || type === 'roth403b' || type === 'rothIra' ? balance : undefined,
      apr: isDebt ? 5 : undefined,
      monthlyPayment: isDebt ? Math.max(25, Math.round(balance * 0.02)) : undefined,
      included: true,
    };
  });
}

/**
 * Aggregates Monarch transactions by category and computes monthly averages.
 */
export function aggregateMonarchTransactions(
  transactions: MonarchRawTransaction[],
  lookbackMonths: number = 6
): MappedExpenseItem[] {
  const categoryStats: Record<string, { total: number; count: number }> = {};

  // Ignored categories (transfers, cc payments, investments)
  const ignoredKeywords = ['transfer', 'payment', 'credit card payment', 'investment', 'deposit', 'paycheck', 'income'];

  for (const txn of transactions) {
    if (txn.hideFromReports) continue;

    const catName = txn.category?.name?.trim() || 'General Expenses';
    const groupType = txn.category?.group?.type?.toLowerCase();

    // Skip income or transfers
    if (groupType === 'income' || groupType === 'transfer') continue;

    const lowerCat = catName.toLowerCase();
    if (ignoredKeywords.some((kw) => lowerCat.includes(kw))) continue;

    // Monarch amounts for expenses are positive or negative depending on export/api
    // Generally in Monarch API: positive = income, negative = expense, or vice versa
    const absAmount = Math.abs(txn.amount);
    if (absAmount <= 0) continue;

    if (!categoryStats[catName]) {
      categoryStats[catName] = { total: 0, count: 0 };
    }
    categoryStats[catName].total += absAmount;
    categoryStats[catName].count += 1;
  }

  const months = Math.max(1, lookbackMonths);

  return Object.entries(categoryStats)
    .map(([name, stats]) => {
      const monthlyAverage = Math.round((stats.total / months) * 100) / 100;
      return {
        id: crypto.randomUUID(),
        categoryName: name,
        monthlyAverage,
        totalSpent: Math.round(stats.total * 100) / 100,
        transactionCount: stats.count,
        included: monthlyAverage >= 5, // Default include if at least $5/month
      };
    })
    .sort((a, b) => b.monthlyAverage - a.monthlyAverage);
}
