import { describe, it, expect } from 'vitest';
import {
  mapMonarchAccountType,
  transformMonarchAccounts,
  aggregateMonarchTransactions,
} from '../mapping';
import { parseMonarchAccountsCsv, parseMonarchTransactionsCsv } from '../csv-parser';

describe('Monarch Mapping & Auto-tagging', () => {
  it('correctly auto-tags various account types and subtypes', () => {
    // 401(k) / IRA
    expect(mapMonarchAccountType('investment', 'traditional_401k').type).toBe('401k');
    expect(mapMonarchAccountType('investment', 'traditional_ira').type).toBe('ira');
    expect(mapMonarchAccountType('investment', '403b').type).toBe('403b');

    // Roth variants
    expect(mapMonarchAccountType('investment', 'roth_ira').type).toBe('rothIra');
    expect(mapMonarchAccountType('investment', 'roth_401k').type).toBe('roth401k');

    // HSA
    expect(mapMonarchAccountType('investment', 'hsa').type).toBe('hsa');

    // Brokerage
    expect(mapMonarchAccountType('brokerage', 'taxable').type).toBe('taxableBrokerage');

    // Cash / Savings
    expect(mapMonarchAccountType('depository', 'checking').type).toBe('savings');
    expect(mapMonarchAccountType('depository', 'savings').type).toBe('savings');

    // Debts
    expect(mapMonarchAccountType('credit', 'credit_card').isDebt).toBe(true);
    expect(mapMonarchAccountType('loan', 'mortgage').isDebt).toBe(true);
    expect(mapMonarchAccountType('loan', 'auto_loan').isDebt).toBe(true);
  });

  it('aggregates transactions into monthly expense categories and excludes transfers', () => {
    const rawTxns = [
      { id: '1', amount: 300, date: '2026-01-10', category: { name: 'Groceries', group: { type: 'expense' } } },
      { id: '2', amount: 300, date: '2026-02-10', category: { name: 'Groceries', group: { type: 'expense' } } },
      { id: '3', amount: 150, date: '2026-01-15', category: { name: 'Utilities', group: { type: 'expense' } } },
      { id: '4', amount: 1000, date: '2026-01-01', category: { name: 'Transfer', group: { type: 'transfer' } } },
      { id: '5', amount: 500, date: '2026-01-05', category: { name: 'Credit Card Payment', group: { type: 'expense' } } },
    ];

    const expenses = aggregateMonarchTransactions(rawTxns, 6);

    // Should only have Groceries and Utilities
    expect(expenses.length).toBe(2);

    const groceries = expenses.find((e) => e.categoryName === 'Groceries');
    expect(groceries).toBeDefined();
    // $600 total across 6 months lookback = $100/mo
    expect(groceries?.monthlyAverage).toBe(100);
    expect(groceries?.transactionCount).toBe(2);

    const utilities = expenses.find((e) => e.categoryName === 'Utilities');
    expect(utilities).toBeDefined();
    // $150 total across 6 months = $25/mo
    expect(utilities?.monthlyAverage).toBe(25);
  });
});

describe('Monarch CSV Parsers', () => {
  it('parses accounts CSV correctly', () => {
    const csv = `Account Name,Type,Subtype,Current Balance
Fidelity 401k,investment,traditional_401k,"$125,430.50"
Vanguard Roth IRA,investment,roth_ira,"$85,000.00"
Chase Checking,depository,checking,"$5,200.00"
Chase Sapphire,credit,credit_card,"-$1,250.00"`;

    const parsed = parseMonarchAccountsCsv(csv);
    expect(parsed.length).toBe(4);

    const transformed = transformMonarchAccounts(parsed);
    expect(transformed[0].selectedType).toBe('401k');
    expect(transformed[0].balance).toBe(125430.5);

    expect(transformed[1].selectedType).toBe('rothIra');
    expect(transformed[1].balance).toBe(85000);

    expect(transformed[2].selectedType).toBe('savings');
    expect(transformed[2].balance).toBe(5200);

    expect(transformed[3].isDebt).toBe(true);
    expect(transformed[3].balance).toBe(1250);
  });

  it('parses transactions CSV correctly', () => {
    const csv = `Date,Merchant,Category,Amount,Account
2026-02-01,Trader Joe's,Groceries,85.50,Chase Checking
2026-02-02,PG&E,Utilities,120.00,Chase Checking
2026-02-03,Online Transfer,Transfer,500.00,Chase Checking`;

    const parsed = parseMonarchTransactionsCsv(csv);
    expect(parsed.length).toBe(3);

    const expenses = aggregateMonarchTransactions(parsed, 1);
    expect(expenses.length).toBe(2); // Transfer excluded
    expect(expenses.find((e) => e.categoryName === 'Groceries')?.monthlyAverage).toBe(85.5);
    expect(expenses.find((e) => e.categoryName === 'Utilities')?.monthlyAverage).toBe(120);
  });
});
