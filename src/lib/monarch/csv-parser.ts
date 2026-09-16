import type { MonarchRawAccount, MonarchRawTransaction } from './mapping';

/**
 * Parses CSV text into array of objects with normalized keys.
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header line handling quotes
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]?.trim() ?? '';
    }
    results.push(row);
  }

  return results;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

/**
 * Parses Monarch accounts CSV export.
 * Standard headers typically include:
 * "Account Name", "Display Name", "Type", "Subtype", "Current Balance", "Balance"
 */
export function parseMonarchAccountsCsv(csvContent: string): MonarchRawAccount[] {
  const rows = parseCsv(csvContent);

  return rows.map((row) => {
    const displayName = row['accountname'] || row['displayname'] || row['name'] || row['account'] || 'Unnamed Account';
    const balanceStr = row['currentbalance'] || row['balance'] || row['amount'] || '0';
    const cleanBalance = balanceStr.replace(/[^0-9.-]/g, '');
    const currentBalance = parseFloat(cleanBalance) || 0;

    const type = row['type'] || '';
    const subtype = row['subtype'] || '';

    return {
      id: crypto.randomUUID(),
      displayName,
      currentBalance,
      type: { name: type },
      subtype: { name: subtype },
    };
  });
}

/**
 * Parses Monarch transactions CSV export.
 * Standard headers typically include:
 * "Date", "Merchant", "Category", "Amount", "Account", "Hide from Reports", etc.
 */
export function parseMonarchTransactionsCsv(csvContent: string): MonarchRawTransaction[] {
  const rows = parseCsv(csvContent);

  return rows.map((row) => {
    const date = row['date'] || new Date().toISOString().split('T')[0];
    const amountStr = row['amount'] || '0';
    const cleanAmount = amountStr.replace(/[^0-9.-]/g, '');
    const amount = parseFloat(cleanAmount) || 0;

    const categoryName = row['category'] || 'General Expenses';
    const groupName = row['categorygroup'] || row['group'] || '';
    const merchantName = row['merchant'] || row['originalstatement'] || '';
    const hideFromReports = (row['hidefromreports'] || '').toLowerCase() === 'true';

    return {
      id: crypto.randomUUID(),
      date,
      amount,
      category: {
        name: categoryName,
        group: groupName ? { name: groupName } : undefined,
      },
      merchant: merchantName ? { name: merchantName } : undefined,
      hideFromReports,
    };
  });
}
