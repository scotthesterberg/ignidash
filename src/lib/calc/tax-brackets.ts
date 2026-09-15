export const STANDARD_DEDUCTION = {
  single: 14600,
  married: 29200,
  headOfHousehold: 21900,
};

// 2024 Federal Income Tax Brackets (Single and Married Filing Jointly)
export const TAX_BRACKETS = {
  single: [
    { rate: 0.1, max: 11600 },
    { rate: 0.12, max: 47150 },
    { rate: 0.22, max: 100525 },
    { rate: 0.24, max: 191950 },
    { rate: 0.32, max: 243725 },
    { rate: 0.35, max: 609350 },
    { rate: 0.37, max: Infinity },
  ],
  married: [
    { rate: 0.1, max: 23200 },
    { rate: 0.12, max: 94300 },
    { rate: 0.22, max: 201050 },
    { rate: 0.24, max: 383900 },
    { rate: 0.32, max: 487450 },
    { rate: 0.35, max: 731200 },
    { rate: 0.37, max: Infinity },
  ],
};

// Medicare IRMAA Thresholds for 2024
export const IRMAA_THRESHOLDS = {
  single: [103000, 129000, 161000, 193000, 500000],
  married: [206000, 258000, 322000, 386000, 750000],
};

export type FilingStatus = 'single' | 'married' | 'headOfHousehold';

export interface WithdrawalStrategy {
  taxableBalance: number;
  taxableBasis: number; // For capital gains
  taxDeferredBalance: number;
  rothBalance: number;
  targetSpendingAmount: number;
  age: number;
  filingStatus: FilingStatus;
}
