import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export interface StateTaxData {
  standardDeduction: Record<FilingStatus, number>;
  incomeBrackets: Record<FilingStatus, { rate: number; max: number }[]>;
  capitalGainsRate: number | 'income';
}

/** Human-readable state names keyed by two-letter code (includes DC) */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

// Helper to create a flat-rate state with no standard deduction
const flatRate = (rate: number, capitalGainsRate: number | 'income' = 'income'): StateTaxData => ({
  standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
  incomeBrackets: {
    single: [{ rate, max: Infinity }],
    marriedFilingJointly: [{ rate, max: Infinity }],
    headOfHousehold: [{ rate, max: Infinity }],
  },
  capitalGainsRate,
});

// Helper for no-income-tax states
const noTax = (): StateTaxData => flatRate(0, 0);

export const STATE_TAX_DATA: Record<string, StateTaxData> = {
  // ── No-income-tax states ───────────────────────────────────────
  AK: noTax(),
  FL: noTax(),
  NV: noTax(),
  NH: noTax(), // taxes only interest/dividends (phasing out 2025)
  SD: noTax(),
  TN: noTax(), // Hall tax fully repealed 2022
  TX: noTax(),
  WA: noTax(), // has capital gains tax on high earners (7%) but no income tax
  WY: noTax(),

  // ── Flat-rate states ──────────────────────────────────────────
  CO: flatRate(0.044, 'income'),
  IL: flatRate(0.0495, 'income'),
  IN: flatRate(0.0305, 'income'),
  KY: flatRate(0.04, 'income'),
  MA: flatRate(0.05, 'income'),
  MI: flatRate(0.0425, 'income'),
  NC: flatRate(0.0499, 'income'),
  PA: flatRate(0.0307, 'income'),
  UT: flatRate(0.0465, 'income'),

  // ── Alabama ───────────────────────────────────────────────────
  AL: {
    standardDeduction: { single: 3000, marriedFilingJointly: 8500, headOfHousehold: 4700 },
    incomeBrackets: {
      single: [
        { rate: 0.02, max: 500 },
        { rate: 0.04, max: 3000 },
        { rate: 0.05, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.02, max: 1000 },
        { rate: 0.04, max: 6000 },
        { rate: 0.05, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.02, max: 500 },
        { rate: 0.04, max: 3000 },
        { rate: 0.05, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Arizona ───────────────────────────────────────────────────
  AZ: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [{ rate: 0.025, max: Infinity }],
      marriedFilingJointly: [{ rate: 0.025, max: Infinity }],
      headOfHousehold: [{ rate: 0.025, max: Infinity }],
    },
    capitalGainsRate: 'income',
  },

  // ── Arkansas ──────────────────────────────────────────────────
  AR: {
    standardDeduction: { single: 2340, marriedFilingJointly: 4680, headOfHousehold: 2340 },
    incomeBrackets: {
      single: [
        { rate: 0.02, max: 5000 },
        { rate: 0.04, max: 10000 },
        { rate: 0.044, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.02, max: 5000 },
        { rate: 0.04, max: 10000 },
        { rate: 0.044, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.02, max: 5000 },
        { rate: 0.04, max: 10000 },
        { rate: 0.044, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── California ────────────────────────────────────────────────
  CA: {
    standardDeduction: {
      single: 5363,
      marriedFilingJointly: 10726,
      headOfHousehold: 10726,
    },
    incomeBrackets: {
      single: [
        { rate: 0.01, max: 10412 },
        { rate: 0.02, max: 24684 },
        { rate: 0.04, max: 38959 },
        { rate: 0.06, max: 54081 },
        { rate: 0.08, max: 68350 },
        { rate: 0.093, max: 349137 },
        { rate: 0.103, max: 418961 },
        { rate: 0.113, max: 698271 },
        { rate: 0.123, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.01, max: 20824 },
        { rate: 0.02, max: 49368 },
        { rate: 0.04, max: 77918 },
        { rate: 0.06, max: 108162 },
        { rate: 0.08, max: 136700 },
        { rate: 0.093, max: 698274 },
        { rate: 0.103, max: 837922 },
        { rate: 0.113, max: 1396542 },
        { rate: 0.123, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.01, max: 20839 },
        { rate: 0.02, max: 49371 },
        { rate: 0.04, max: 63644 },
        { rate: 0.06, max: 78765 },
        { rate: 0.08, max: 93037 },
        { rate: 0.093, max: 474824 },
        { rate: 0.103, max: 569790 },
        { rate: 0.113, max: 949649 },
        { rate: 0.123, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Connecticut ───────────────────────────────────────────────
  CT: {
    standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
    incomeBrackets: {
      single: [
        { rate: 0.03, max: 10000 },
        { rate: 0.05, max: 50000 },
        { rate: 0.055, max: 100000 },
        { rate: 0.06, max: 200000 },
        { rate: 0.065, max: 250000 },
        { rate: 0.069, max: 500000 },
        { rate: 0.0699, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.03, max: 20000 },
        { rate: 0.05, max: 100000 },
        { rate: 0.055, max: 200000 },
        { rate: 0.06, max: 400000 },
        { rate: 0.065, max: 500000 },
        { rate: 0.069, max: 1000000 },
        { rate: 0.0699, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.03, max: 16000 },
        { rate: 0.05, max: 80000 },
        { rate: 0.055, max: 160000 },
        { rate: 0.06, max: 320000 },
        { rate: 0.065, max: 400000 },
        { rate: 0.069, max: 800000 },
        { rate: 0.0699, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Delaware ──────────────────────────────────────────────────
  DE: {
    standardDeduction: { single: 3250, marriedFilingJointly: 6500, headOfHousehold: 3250 },
    incomeBrackets: {
      single: [
        { rate: 0, max: 2000 },
        { rate: 0.022, max: 5000 },
        { rate: 0.039, max: 10000 },
        { rate: 0.048, max: 20000 },
        { rate: 0.052, max: 25000 },
        { rate: 0.0555, max: 60000 },
        { rate: 0.066, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0, max: 2000 },
        { rate: 0.022, max: 5000 },
        { rate: 0.039, max: 10000 },
        { rate: 0.048, max: 20000 },
        { rate: 0.052, max: 25000 },
        { rate: 0.0555, max: 60000 },
        { rate: 0.066, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0, max: 2000 },
        { rate: 0.022, max: 5000 },
        { rate: 0.039, max: 10000 },
        { rate: 0.048, max: 20000 },
        { rate: 0.052, max: 25000 },
        { rate: 0.0555, max: 60000 },
        { rate: 0.066, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── District of Columbia ──────────────────────────────────────
  DC: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.04, max: 10000 },
        { rate: 0.06, max: 40000 },
        { rate: 0.065, max: 60000 },
        { rate: 0.085, max: 250000 },
        { rate: 0.0925, max: 500000 },
        { rate: 0.0975, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.04, max: 10000 },
        { rate: 0.06, max: 40000 },
        { rate: 0.065, max: 60000 },
        { rate: 0.085, max: 250000 },
        { rate: 0.0925, max: 500000 },
        { rate: 0.0975, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.04, max: 10000 },
        { rate: 0.06, max: 40000 },
        { rate: 0.065, max: 60000 },
        { rate: 0.085, max: 250000 },
        { rate: 0.0925, max: 500000 },
        { rate: 0.0975, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Georgia ───────────────────────────────────────────────────
  GA: {
    standardDeduction: { single: 12000, marriedFilingJointly: 24000, headOfHousehold: 18000 },
    incomeBrackets: {
      single: [{ rate: 0.0549, max: Infinity }],
      marriedFilingJointly: [{ rate: 0.0549, max: Infinity }],
      headOfHousehold: [{ rate: 0.0549, max: Infinity }],
    },
    capitalGainsRate: 'income',
  },

  // ── Hawaii ────────────────────────────────────────────────────
  HI: {
    standardDeduction: { single: 2200, marriedFilingJointly: 4400, headOfHousehold: 3212 },
    incomeBrackets: {
      single: [
        { rate: 0.014, max: 2400 },
        { rate: 0.032, max: 4800 },
        { rate: 0.055, max: 9600 },
        { rate: 0.064, max: 14400 },
        { rate: 0.068, max: 19200 },
        { rate: 0.072, max: 24000 },
        { rate: 0.076, max: 36000 },
        { rate: 0.079, max: 48000 },
        { rate: 0.0825, max: 150000 },
        { rate: 0.09, max: 175000 },
        { rate: 0.1, max: 200000 },
        { rate: 0.11, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.014, max: 4800 },
        { rate: 0.032, max: 9600 },
        { rate: 0.055, max: 19200 },
        { rate: 0.064, max: 28800 },
        { rate: 0.068, max: 38400 },
        { rate: 0.072, max: 48000 },
        { rate: 0.076, max: 72000 },
        { rate: 0.079, max: 96000 },
        { rate: 0.0825, max: 300000 },
        { rate: 0.09, max: 350000 },
        { rate: 0.1, max: 400000 },
        { rate: 0.11, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.014, max: 3600 },
        { rate: 0.032, max: 7200 },
        { rate: 0.055, max: 14400 },
        { rate: 0.064, max: 21600 },
        { rate: 0.068, max: 28800 },
        { rate: 0.072, max: 36000 },
        { rate: 0.076, max: 54000 },
        { rate: 0.079, max: 72000 },
        { rate: 0.0825, max: 225000 },
        { rate: 0.09, max: 262500 },
        { rate: 0.1, max: 300000 },
        { rate: 0.11, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Idaho ─────────────────────────────────────────────────────
  ID: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [{ rate: 0.058, max: Infinity }],
      marriedFilingJointly: [{ rate: 0.058, max: Infinity }],
      headOfHousehold: [{ rate: 0.058, max: Infinity }],
    },
    capitalGainsRate: 'income',
  },

  // ── Iowa ──────────────────────────────────────────────────────
  IA: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.044, max: 6210 },
        { rate: 0.048, max: 31050 },
        { rate: 0.057, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.044, max: 12420 },
        { rate: 0.048, max: 62100 },
        { rate: 0.057, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.044, max: 6210 },
        { rate: 0.048, max: 31050 },
        { rate: 0.057, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Kansas ────────────────────────────────────────────────────
  KS: {
    standardDeduction: { single: 3500, marriedFilingJointly: 8000, headOfHousehold: 6000 },
    incomeBrackets: {
      single: [
        { rate: 0.031, max: 15000 },
        { rate: 0.057, max: 30000 },
        { rate: 0.057, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.031, max: 30000 },
        { rate: 0.057, max: 60000 },
        { rate: 0.057, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.031, max: 15000 },
        { rate: 0.057, max: 30000 },
        { rate: 0.057, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Louisiana ─────────────────────────────────────────────────
  LA: {
    standardDeduction: { single: 4500, marriedFilingJointly: 9000, headOfHousehold: 4500 },
    incomeBrackets: {
      single: [
        { rate: 0.0185, max: 12500 },
        { rate: 0.035, max: 50000 },
        { rate: 0.0425, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0185, max: 25000 },
        { rate: 0.035, max: 100000 },
        { rate: 0.0425, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0185, max: 12500 },
        { rate: 0.035, max: 50000 },
        { rate: 0.0425, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Maine ─────────────────────────────────────────────────────
  ME: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.058, max: 26050 },
        { rate: 0.0675, max: 61600 },
        { rate: 0.0715, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.058, max: 52100 },
        { rate: 0.0675, max: 123250 },
        { rate: 0.0715, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.058, max: 39250 },
        { rate: 0.0675, max: 92400 },
        { rate: 0.0715, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Maryland ──────────────────────────────────────────────────
  MD: {
    standardDeduction: { single: 2550, marriedFilingJointly: 5150, headOfHousehold: 2550 },
    incomeBrackets: {
      single: [
        { rate: 0.02, max: 1000 },
        { rate: 0.03, max: 2000 },
        { rate: 0.04, max: 3000 },
        { rate: 0.0475, max: 100000 },
        { rate: 0.05, max: 125000 },
        { rate: 0.0525, max: 150000 },
        { rate: 0.055, max: 250000 },
        { rate: 0.0575, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.02, max: 1000 },
        { rate: 0.03, max: 2000 },
        { rate: 0.04, max: 3000 },
        { rate: 0.0475, max: 150000 },
        { rate: 0.05, max: 175000 },
        { rate: 0.0525, max: 225000 },
        { rate: 0.055, max: 300000 },
        { rate: 0.0575, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.02, max: 1000 },
        { rate: 0.03, max: 2000 },
        { rate: 0.04, max: 3000 },
        { rate: 0.0475, max: 150000 },
        { rate: 0.05, max: 175000 },
        { rate: 0.0525, max: 225000 },
        { rate: 0.055, max: 300000 },
        { rate: 0.0575, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Minnesota ─────────────────────────────────────────────────
  MN: {
    standardDeduction: { single: 14575, marriedFilingJointly: 29150, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.0535, max: 31690 },
        { rate: 0.068, max: 104090 },
        { rate: 0.0785, max: 193240 },
        { rate: 0.0985, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0535, max: 46330 },
        { rate: 0.068, max: 184040 },
        { rate: 0.0785, max: 320090 },
        { rate: 0.0985, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0535, max: 39010 },
        { rate: 0.068, max: 156570 },
        { rate: 0.0785, max: 256665 },
        { rate: 0.0985, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Mississippi ───────────────────────────────────────────────
  MS: {
    standardDeduction: { single: 2300, marriedFilingJointly: 4600, headOfHousehold: 3400 },
    incomeBrackets: {
      single: [{ rate: 0.047, max: Infinity }],
      marriedFilingJointly: [{ rate: 0.047, max: Infinity }],
      headOfHousehold: [{ rate: 0.047, max: Infinity }],
    },
    capitalGainsRate: 'income',
  },

  // ── Missouri ──────────────────────────────────────────────────
  MO: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.02, max: 1207 },
        { rate: 0.035, max: 2414 },
        { rate: 0.045, max: 3621 },
        { rate: 0.05, max: 4828 },
        { rate: 0.055, max: 6035 },
        { rate: 0.06, max: 7242 },
        { rate: 0.065, max: 8584 },
        { rate: 0.048, max: Infinity }, // 2024 top rate
      ],
      marriedFilingJointly: [
        { rate: 0.02, max: 1207 },
        { rate: 0.035, max: 2414 },
        { rate: 0.045, max: 3621 },
        { rate: 0.05, max: 4828 },
        { rate: 0.055, max: 6035 },
        { rate: 0.06, max: 7242 },
        { rate: 0.065, max: 8584 },
        { rate: 0.048, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.02, max: 1207 },
        { rate: 0.035, max: 2414 },
        { rate: 0.045, max: 3621 },
        { rate: 0.05, max: 4828 },
        { rate: 0.055, max: 6035 },
        { rate: 0.06, max: 7242 },
        { rate: 0.065, max: 8584 },
        { rate: 0.048, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Montana ───────────────────────────────────────────────────
  MT: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.047, max: 20500 },
        { rate: 0.059, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.047, max: 41000 },
        { rate: 0.059, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.047, max: 20500 },
        { rate: 0.059, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Nebraska ──────────────────────────────────────────────────
  NE: {
    standardDeduction: { single: 7900, marriedFilingJointly: 15800, headOfHousehold: 7900 },
    incomeBrackets: {
      single: [
        { rate: 0.0246, max: 3700 },
        { rate: 0.0351, max: 22170 },
        { rate: 0.0501, max: 35730 },
        { rate: 0.0584, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0246, max: 7390 },
        { rate: 0.0351, max: 44350 },
        { rate: 0.0501, max: 71460 },
        { rate: 0.0584, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0246, max: 3700 },
        { rate: 0.0351, max: 22170 },
        { rate: 0.0501, max: 35730 },
        { rate: 0.0584, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── New Jersey ────────────────────────────────────────────────
  NJ: {
    standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
    incomeBrackets: {
      single: [
        { rate: 0.014, max: 20000 },
        { rate: 0.0175, max: 35000 },
        { rate: 0.035, max: 40000 },
        { rate: 0.05525, max: 75000 },
        { rate: 0.0637, max: 500000 },
        { rate: 0.0897, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.014, max: 20000 },
        { rate: 0.0175, max: 50000 },
        { rate: 0.0245, max: 70000 },
        { rate: 0.035, max: 80000 },
        { rate: 0.05525, max: 150000 },
        { rate: 0.0637, max: 500000 },
        { rate: 0.0897, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.014, max: 20000 },
        { rate: 0.0175, max: 50000 },
        { rate: 0.0245, max: 70000 },
        { rate: 0.035, max: 80000 },
        { rate: 0.05525, max: 150000 },
        { rate: 0.0637, max: 500000 },
        { rate: 0.0897, max: 1000000 },
        { rate: 0.1075, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── New Mexico ────────────────────────────────────────────────
  NM: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.017, max: 5500 },
        { rate: 0.032, max: 11000 },
        { rate: 0.047, max: 16000 },
        { rate: 0.049, max: 210000 },
        { rate: 0.059, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.017, max: 8000 },
        { rate: 0.032, max: 16000 },
        { rate: 0.047, max: 24000 },
        { rate: 0.049, max: 315000 },
        { rate: 0.059, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.017, max: 8000 },
        { rate: 0.032, max: 16000 },
        { rate: 0.047, max: 24000 },
        { rate: 0.049, max: 315000 },
        { rate: 0.059, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── New York ──────────────────────────────────────────────────
  NY: {
    standardDeduction: {
      single: 8000,
      marriedFilingJointly: 16050,
      headOfHousehold: 11200,
    },
    incomeBrackets: {
      single: [
        { rate: 0.04, max: 8500 },
        { rate: 0.045, max: 11700 },
        { rate: 0.0525, max: 13900 },
        { rate: 0.0585, max: 80650 },
        { rate: 0.0597, max: 215400 },
        { rate: 0.0685, max: 1077550 },
        { rate: 0.0965, max: 5000000 },
        { rate: 0.103, max: 25000000 },
        { rate: 0.109, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.04, max: 17150 },
        { rate: 0.045, max: 23600 },
        { rate: 0.0525, max: 27900 },
        { rate: 0.0585, max: 161550 },
        { rate: 0.0597, max: 323200 },
        { rate: 0.0685, max: 2155350 },
        { rate: 0.0965, max: 5000000 },
        { rate: 0.103, max: 25000000 },
        { rate: 0.109, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.04, max: 12800 },
        { rate: 0.045, max: 17650 },
        { rate: 0.0525, max: 20900 },
        { rate: 0.0585, max: 107650 },
        { rate: 0.0597, max: 269300 },
        { rate: 0.0685, max: 1616450 },
        { rate: 0.0965, max: 5000000 },
        { rate: 0.103, max: 25000000 },
        { rate: 0.109, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── North Dakota ──────────────────────────────────────────────
  ND: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0.0195, max: 44725 },
        { rate: 0.0245, max: 225975 },
        { rate: 0.029, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0195, max: 74750 },
        { rate: 0.0245, max: 275925 },
        { rate: 0.029, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0195, max: 59850 },
        { rate: 0.0245, max: 275925 },
        { rate: 0.029, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Ohio ──────────────────────────────────────────────────────
  OH: {
    standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
    incomeBrackets: {
      single: [
        { rate: 0, max: 26050 },
        { rate: 0.02765, max: 100000 },
        { rate: 0.03226, max: 115300 },
        { rate: 0.03688, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0, max: 26050 },
        { rate: 0.02765, max: 100000 },
        { rate: 0.03226, max: 115300 },
        { rate: 0.03688, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0, max: 26050 },
        { rate: 0.02765, max: 100000 },
        { rate: 0.03226, max: 115300 },
        { rate: 0.03688, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Oklahoma ──────────────────────────────────────────────────
  OK: {
    standardDeduction: { single: 6350, marriedFilingJointly: 12700, headOfHousehold: 9350 },
    incomeBrackets: {
      single: [
        { rate: 0.0025, max: 1000 },
        { rate: 0.0075, max: 2500 },
        { rate: 0.0175, max: 3750 },
        { rate: 0.0275, max: 4900 },
        { rate: 0.0375, max: 7200 },
        { rate: 0.0475, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0025, max: 2000 },
        { rate: 0.0075, max: 5000 },
        { rate: 0.0175, max: 7500 },
        { rate: 0.0275, max: 9800 },
        { rate: 0.0375, max: 12200 },
        { rate: 0.0475, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0025, max: 2000 },
        { rate: 0.0075, max: 5000 },
        { rate: 0.0175, max: 7500 },
        { rate: 0.0275, max: 9800 },
        { rate: 0.0375, max: 12200 },
        { rate: 0.0475, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Oregon ────────────────────────────────────────────────────
  OR: {
    standardDeduction: { single: 2420, marriedFilingJointly: 4840, headOfHousehold: 4840 },
    incomeBrackets: {
      single: [
        { rate: 0.0475, max: 18400 },
        { rate: 0.0675, max: 46200 },
        { rate: 0.0875, max: 250000 },
        { rate: 0.099, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0475, max: 36800 },
        { rate: 0.0675, max: 92400 },
        { rate: 0.0875, max: 500000 },
        { rate: 0.099, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0475, max: 18400 },
        { rate: 0.0675, max: 46200 },
        { rate: 0.0875, max: 250000 },
        { rate: 0.099, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Rhode Island ──────────────────────────────────────────────
  RI: {
    standardDeduction: { single: 10550, marriedFilingJointly: 21150, headOfHousehold: 10550 },
    incomeBrackets: {
      single: [
        { rate: 0.0375, max: 77450 },
        { rate: 0.0475, max: 176050 },
        { rate: 0.0599, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0375, max: 77450 },
        { rate: 0.0475, max: 176050 },
        { rate: 0.0599, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0375, max: 77450 },
        { rate: 0.0475, max: 176050 },
        { rate: 0.0599, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── South Carolina ────────────────────────────────────────────
  SC: {
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
    incomeBrackets: {
      single: [
        { rate: 0, max: 3460 },
        { rate: 0.03, max: 17330 },
        { rate: 0.064, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0, max: 3460 },
        { rate: 0.03, max: 17330 },
        { rate: 0.064, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0, max: 3460 },
        { rate: 0.03, max: 17330 },
        { rate: 0.064, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Vermont ───────────────────────────────────────────────────
  VT: {
    standardDeduction: { single: 7000, marriedFilingJointly: 14000, headOfHousehold: 7000 },
    incomeBrackets: {
      single: [
        { rate: 0.0335, max: 45400 },
        { rate: 0.066, max: 110050 },
        { rate: 0.076, max: 229550 },
        { rate: 0.0875, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0335, max: 75850 },
        { rate: 0.066, max: 183400 },
        { rate: 0.076, max: 279450 },
        { rate: 0.0875, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0335, max: 60850 },
        { rate: 0.066, max: 156700 },
        { rate: 0.076, max: 254500 },
        { rate: 0.0875, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Virginia ──────────────────────────────────────────────────
  VA: {
    standardDeduction: { single: 8000, marriedFilingJointly: 16000, headOfHousehold: 8000 },
    incomeBrackets: {
      single: [
        { rate: 0.02, max: 3000 },
        { rate: 0.03, max: 5000 },
        { rate: 0.05, max: 17000 },
        { rate: 0.0575, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.02, max: 3000 },
        { rate: 0.03, max: 5000 },
        { rate: 0.05, max: 17000 },
        { rate: 0.0575, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.02, max: 3000 },
        { rate: 0.03, max: 5000 },
        { rate: 0.05, max: 17000 },
        { rate: 0.0575, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── West Virginia ─────────────────────────────────────────────
  WV: {
    standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
    incomeBrackets: {
      single: [
        { rate: 0.0236, max: 10000 },
        { rate: 0.0315, max: 25000 },
        { rate: 0.0354, max: 40000 },
        { rate: 0.0472, max: 60000 },
        { rate: 0.0512, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.0236, max: 10000 },
        { rate: 0.0315, max: 25000 },
        { rate: 0.0354, max: 40000 },
        { rate: 0.0472, max: 60000 },
        { rate: 0.0512, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.0236, max: 10000 },
        { rate: 0.0315, max: 25000 },
        { rate: 0.0354, max: 40000 },
        { rate: 0.0472, max: 60000 },
        { rate: 0.0512, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },

  // ── Wisconsin ─────────────────────────────────────────────────
  WI: {
    standardDeduction: { single: 13230, marriedFilingJointly: 24490, headOfHousehold: 13230 },
    incomeBrackets: {
      single: [
        { rate: 0.035, max: 14320 },
        { rate: 0.044, max: 28640 },
        { rate: 0.053, max: 315310 },
        { rate: 0.0765, max: Infinity },
      ],
      marriedFilingJointly: [
        { rate: 0.035, max: 19090 },
        { rate: 0.044, max: 38190 },
        { rate: 0.053, max: 420420 },
        { rate: 0.0765, max: Infinity },
      ],
      headOfHousehold: [
        { rate: 0.035, max: 14320 },
        { rate: 0.044, max: 28640 },
        { rate: 0.053, max: 315310 },
        { rate: 0.0765, max: Infinity },
      ],
    },
    capitalGainsRate: 'income',
  },
};
