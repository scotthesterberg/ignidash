const fs = require('fs');
const path = '/home/sh38499/git/github/external/ignidash/src/lib/calc/taxes.ts';
let code = fs.readFileSync(path, 'utf8');

// fix processStateTaxes call
code = code.replace(
  'const stateTaxes = this.processStateTaxes(incomeData.taxableIncomeTaxedAsOrdinary || incomeData.adjustedIncomeTaxedAsOrdinary, incomeData.taxableIncomeTaxedAsCapitalGains || incomeData.adjustedIncomeTaxedAsCapitalGains);',
  'const stateTaxes = this.processStateTaxes(taxableIncomeTaxedAsOrdinary, taxableIncomeTaxedAsCapitalGains);'
);

// update totalTaxLiabilityExcludingFICA
code = code.replace(
  'earlyWithdrawalPenalties.totalPenaltyAmount;',
  'earlyWithdrawalPenalties.totalPenaltyAmount +\n      stateTaxes.stateIncomeTaxAmount + stateTaxes.stateCapitalGainsTaxAmount;'
);

// add stateTaxes to TaxesData return
code = code.replace(
  'capitalGainsTaxes,',
  'capitalGainsTaxes,\n      stateTaxes,'
);

// implement processStateTaxes
if (!code.includes('private processStateTaxes')) {
  code = code.replace(
    '  /** Calculates progressive income tax across ordinary income brackets (IRC §1) */',
    `  private processStateTaxes(taxableOrdinary: number, taxableCapitalGains: number): StateIncomeTaxesData {
    if (!this.state || !STATE_TAX_DATA[this.state]) {
      return { stateIncomeTaxAmount: 0, stateCapitalGainsTaxAmount: 0 };
    }

    const stateData = STATE_TAX_DATA[this.state];
    
    // Calculate ordinary income tax
    let stateIncomeTaxAmount = 0;
    const incomeBrackets = stateData.incomeBrackets[this.filingStatus];
    if (incomeBrackets) {
      let incomeToTax = taxableOrdinary;
      for (const bracket of incomeBrackets) {
        if (incomeToTax <= 0) break;
        const taxableInBracket = Math.min(incomeToTax, bracket.max);
        stateIncomeTaxAmount += taxableInBracket * bracket.rate;
        incomeToTax -= bracket.max;
      }
    }

    // Calculate capital gains tax
    let stateCapitalGainsTaxAmount = 0;
    if (stateData.capitalGainsRate === 'income') {
      let gainsToTax = taxableCapitalGains;
      // Stack gains on top of ordinary income
      if (incomeBrackets) {
        let totalIncome = taxableOrdinary + taxableCapitalGains;
        let taxWithGains = 0;
        for (const bracket of incomeBrackets) {
          if (totalIncome <= 0) break;
          const taxableInBracket = Math.min(totalIncome, bracket.max);
          taxWithGains += taxableInBracket * bracket.rate;
          totalIncome -= bracket.max;
        }
        stateCapitalGainsTaxAmount = Math.max(0, taxWithGains - stateIncomeTaxAmount);
      }
    } else {
      stateCapitalGainsTaxAmount = taxableCapitalGains * stateData.capitalGainsRate;
    }

    return { stateIncomeTaxAmount, stateCapitalGainsTaxAmount };
  }

  /** Calculates progressive income tax across ordinary income brackets (IRC §1) */`
  );
}

fs.writeFileSync(path, code);
