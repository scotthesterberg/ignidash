import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 14600,
  marriedFilingJointly: 29200,
  headOfHousehold: 21900,
};

// 2024 Federal Income Tax Brackets (Single, Married Filing Jointly, Head of Household)
export const TAX_BRACKETS: Record<FilingStatus, { rate: number; max: number }[]> = {
  single: [
    { rate: 0.1, max: 11600 },
    { rate: 0.12, max: 47150 },
    { rate: 0.22, max: 100525 },
    { rate: 0.24, max: 191950 },
    { rate: 0.32, max: 243725 },
    { rate: 0.35, max: 609350 },
    { rate: 0.37, max: Infinity },
  ],
  marriedFilingJointly: [
    { rate: 0.1, max: 23200 },
    { rate: 0.12, max: 94300 },
    { rate: 0.22, max: 201050 },
    { rate: 0.24, max: 383900 },
    { rate: 0.32, max: 487450 },
    { rate: 0.35, max: 731200 },
    { rate: 0.37, max: Infinity },
  ],
  headOfHousehold: [
    { rate: 0.1, max: 16550 },
    { rate: 0.12, max: 63100 },
    { rate: 0.22, max: 100500 },
    { rate: 0.24, max: 191950 },
    { rate: 0.32, max: 243700 },
    { rate: 0.35, max: 609350 },
    { rate: 0.37, max: Infinity },
  ],
};

// Medicare IRMAA Thresholds for 2024
export const IRMAA_THRESHOLDS: Record<FilingStatus, number[]> = {
  single: [103000, 129000, 161000, 193000, 500000],
  marriedFilingJointly: [206000, 258000, 322000, 386000, 750000],
  headOfHousehold: [103000, 129000, 161000, 193000, 500000],
};

export type { FilingStatus };

export interface WithdrawalStrategy {
  taxableBalance: number;
  taxableBasis: number; // For capital gains
  taxDeferredBalance: number;
  rothBalance: number;
  targetSpendingAmount: number;
  age: number;
  filingStatus: FilingStatus;
}
