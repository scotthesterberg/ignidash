import { FilingStatus } from '../tax-brackets';

export interface StateTaxData {
  standardDeduction: Record<FilingStatus, number>;
  incomeBrackets: Record<FilingStatus, { rate: number; max: number }[]>;
  capitalGainsRate: number | 'income';
}

// Minimal placeholder data for representative states
export const STATE_TAX_DATA: Record<string, StateTaxData> = {
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
        { rate: 0.123, max: Infinity }, // Not accounting for 1% mental health surcharge over 1M
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
    capitalGainsRate: 'income', // CA taxes capital gains as ordinary income
  },
  TX: {
    standardDeduction: { single: 0, marriedFilingJointly: 0, headOfHousehold: 0 },
    incomeBrackets: {
      single: [{ rate: 0, max: Infinity }],
      marriedFilingJointly: [{ rate: 0, max: Infinity }],
      headOfHousehold: [{ rate: 0, max: Infinity }],
    },
    capitalGainsRate: 0,
  },
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
};
