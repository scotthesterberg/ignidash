import { describe, it, expect } from 'vitest';
import { Portfolio, PortfolioProcessor } from '../portfolio';
import { ContributionRules } from '../contribution-rules';
import {
  create401kAccount,
  createRothIraAccount,
  createTaxableBrokerageAccount,
  createMockSimulationState,
  createSimulationContext,
  createEmptyIncomesData,
  createEmptyExpensesData,
  createEmptyDebtsData,
  createEmptyPhysicalAssetsData,
} from './test-utils';
import { STANDARD_DEDUCTION, TAX_BRACKETS } from '../tax-brackets';

describe('Tax-Efficient Withdrawal Strategy', () => {
  it('pulls remaining funds from Taxable, then Deferred (up to bracket), then Roth without spilling', () => {
    // 1. Setup Portfolio
    // We want exactly $50k in RMDs. Age 75 factor is 24.6. 24.6 * 50,000 = 1,230,000
    const deferredAccount = create401kAccount({ id: '401k-1', balance: 1230000 });
    const taxableAccount = createTaxableBrokerageAccount({ id: 'taxable-1', balance: 10000 });
    const rothAccount = createRothIraAccount({ id: 'roth-1', balance: 100000 });
    
    const portfolio = new Portfolio([deferredAccount, taxableAccount, rothAccount]);
    
    // Age 75 triggers RMDs
    const state = createMockSimulationState(portfolio, 75);
    const context = createSimulationContext({ rmdAge: 73 });
    const rules = new ContributionRules([], { type: 'spend' });
    
    // 2. Initialize Processor with taxEfficient
    const processor = new PortfolioProcessor(state, context, rules, undefined, 'taxEfficient', 'marriedFilingJointly');
    
    // 3. Process RMDs first
    const rmdResult = processor.processRequiredMinimumDistributions();
    expect(rmdResult.rmds).toBeCloseTo(50000, 0); // Should be exactly $50k
    
    // 4. Process withdrawals with $100k need
    const incomes = createEmptyIncomesData({ totalIncomeAfterPayrollDeductions: 0 });
    const expenses = createEmptyExpensesData({ totalExpenses: 100000 });
    
    const result = processor.processContributionsAndWithdrawals(
      incomes,
      expenses,
      createEmptyDebtsData(),
      createEmptyPhysicalAssetsData()
    );
    
    // Withdrawals by account
    const withdrawals = result.portfolioData.perAccountData;
    
    // RMD Savings Account should be fully drained ($50k)
    const rmdAccountId = 'd7288042-1f83-4e50-9a6a-b1ef7a6191cc';
    const rmdWithdrawals = withdrawals[rmdAccountId]?.withdrawals;
    expect(rmdWithdrawals.stocks + rmdWithdrawals.bonds + rmdWithdrawals.cash).toBeCloseTo(50000, 0);
    
    // Taxable should be fully drained ($10k)
    const taxableW = withdrawals['taxable-1']?.withdrawals;
    expect(taxableW.stocks + taxableW.bonds + taxableW.cash).toBeCloseTo(10000, 0);
    
    // Deferred (401k) should be tapped up to the monthly bracket room
    const stdDed = STANDARD_DEDUCTION['marriedFilingJointly']; // 29200
    const brackets = TAX_BRACKETS['marriedFilingJointly'];
    const roomInBracket = brackets[1].max + stdDed; // 94300 + 29200 = 123500
    const monthlyRoom = roomInBracket / 12; // ~10291.66
    
    const deferredW = withdrawals['401k-1']?.withdrawals;
    expect(deferredW.stocks + deferredW.bonds + deferredW.cash).toBeCloseTo(monthlyRoom, 1);
    
    // Roth should cover the rest
    // 100000 - 50000 - 10000 - 10291.66 = 29708.34
    const rothW = withdrawals['roth-1']?.withdrawals;
    expect(rothW.stocks + rothW.bonds + rothW.cash).toBeCloseTo(100000 - 50000 - 10000 - monthlyRoom, 1);
  });
});
