import { NextResponse } from 'next/server';
import { MonarchClient } from '@/lib/monarch/client';
import { transformMonarchAccounts, aggregateMonarchTransactions } from '@/lib/monarch/mapping';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, lookbackMonths = 6, fetchAccounts = true, fetchTransactions = true } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Monarch Money session token is required.' }, { status: 400 });
    }

    const client = new MonarchClient(token);

    let mappedAccounts: ReturnType<typeof transformMonarchAccounts> = [];
    let mappedExpenses: ReturnType<typeof aggregateMonarchTransactions> = [];

    if (fetchAccounts) {
      const rawAccounts = await client.getAccounts();
      mappedAccounts = transformMonarchAccounts(rawAccounts);
    }

    if (fetchTransactions) {
      const rawTransactions = await client.getTransactions(lookbackMonths);
      mappedExpenses = aggregateMonarchTransactions(rawTransactions, lookbackMonths);
    }

    return NextResponse.json({
      accounts: mappedAccounts,
      expenses: mappedExpenses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error connecting to Monarch Money';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
