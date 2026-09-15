const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/lib/calc/taxes.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!code.includes('STATE_TAX_DATA')) {
  code = code.replace(
    "import { SECTION_121_EXCLUSION } from './tax-data/section-121-exclusion';",
    "import { SECTION_121_EXCLUSION } from './tax-data/section-121-exclusion';\nimport { STATE_TAX_DATA } from './tax-data/state-tax-brackets';"
  );
}

// 2. Update constructor
if (!code.includes('private state?: string')) {
  code = code.replace(
    'private filingStatus: FilingStatus',
    'private filingStatus: FilingStatus,\n    private state?: string'
  );
}

// 3. Update process method
if (!code.includes('const stateTaxes = this.processStateTaxes')) {
  code = code.replace(
    'const niit = this.processNIIT(incomeData);',
    'const niit = this.processNIIT(incomeData);\n\n    const stateTaxes = this.processStateTaxes(incomeData.taxableIncomeTaxedAsOrdinary || incomeData.adjustedIncomeTaxedAsOrdinary, incomeData.taxableIncomeTaxedAsCapitalGains || incomeData.adjustedIncomeTaxedAsCapitalGains);'
  );
  
  // wait, taxableIncomeTaxedAsOrdinary is calculated locally in `process()`. Let's look at `process` carefully.
}
fs.writeFileSync(path, code);
