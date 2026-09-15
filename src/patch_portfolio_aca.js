const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/lib/calc/portfolio.ts';
let code = fs.readFileSync(path, 'utf8');

// The ACA FPL constants
const acaConstants = `
const ACA_FPL_BASE = 15060;
const ACA_FPL_PER_PERSON = 5380;
`;

if (!code.includes('ACA_FPL_BASE')) {
  code = code.replace(
    'const DEFAULT_ASSET_ALLOCATION = { stocks: 0.6, bonds: 0.4, cash: 0 };',
    'const DEFAULT_ASSET_ALLOCATION = { stocks: 0.6, bonds: 0.4, cash: 0 };\n' + acaConstants
  );
}

// Modify the taxEfficient withdrawal strategy
const optimizedLogic = `
    if (this.withdrawalStrategy === 'taxEfficient') {
      // 1. Savings
      withdrawFromAccounts([{ type: 'savings' }]);

      // 2. Taxable First
      withdrawFromAccounts([{ type: 'taxableBrokerage' }]);

      // 3. Tax-Deferred Fill
      const standardDeduction = STANDARD_DEDUCTION[this.filingStatus];
      const brackets = TAX_BRACKETS[this.filingStatus];
      
      let annualRoom = 0;
      
      if (this.acaOptimization && this.simulationState.time.age < 65) {
        // Optimize for ACA subsidies (Target 200% FPL to balance tax-deferred drawdown with high subsidies)
        // Assume household size 1 for single, 2 for married/HoH as a simplified default if not provided
        const householdSize = this.filingStatus === 'single' ? 1 : 2; 
        const fpl = ACA_FPL_BASE + ACA_FPL_PER_PERSON * (householdSize - 1);
        const targetMagi = fpl * 2.0; // 200% FPL
        
        // The room we have for tax-deferred withdrawals is the target MAGI.
        // We divide by 12 for the monthly allowance.
        annualRoom = targetMagi;
      } else {
        // Default tax-efficient: fill up to the 12% bracket
        annualRoom = brackets[1].max + standardDeduction;
      }
      
      const monthlyRoom = annualRoom / 12;

      withdrawFromAccounts([{ type: '401k' }, { type: '403b' }, { type: 'ira' }], monthlyRoom);

      // 4. Roth Remainder
      withdrawFromAccounts([{ type: 'roth401k' }, { type: 'roth403b' }, { type: 'rothIra' }, { type: 'hsa' }]);

      // 5. If still deficit, pull from tax-deferred again
      withdrawFromAccounts([{ type: '401k' }, { type: '403b' }, { type: 'ira' }]);
    } else {
`;

code = code.replace(
  /if \(this\.withdrawalStrategy === 'taxEfficient'\) \{[\s\S]*?\} else \{/,
  optimizedLogic
);

fs.writeFileSync(path, code);
