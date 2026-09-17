import { NextResponse } from 'next/server';
import { MonarchMoney, EmailOtpRequiredException, RequireMFAException } from '@hakimelek/monarchmoney';
import { transformMonarchAccounts, aggregateMonarchTransactions, aggregateMonarchIncome } from '@/lib/monarch/mapping';
import type { MonarchRawAccount, MonarchRawTransaction } from '@/lib/monarch/mapping';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      otpCode,
      mfaCode,
      lookbackMonths = 6,
      fetchAccounts = true,
      fetchTransactions = true,
      fetchIncome = true,
    } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Monarch Money email is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Monarch Money password is required.' }, { status: 400 });
    }

    const mm = new MonarchMoney();

    try {
      if (otpCode) {
        // User is submitting an email OTP code
        await mm.submitEmailOtp(email, password, otpCode);
      } else if (mfaCode) {
        // User is submitting a TOTP MFA code
        await mm.multiFactorAuthenticate(email, password, mfaCode);
      } else {
        await mm.login(email, password);
      }
    } catch (authErr) {
      if (authErr instanceof EmailOtpRequiredException) {
        // Monarch sent an OTP to the user's email — tell the client to ask for it
        return NextResponse.json({ requiresOtp: true }, { status: 202 });
      }
      if (authErr instanceof RequireMFAException) {
        // TOTP MFA required
        return NextResponse.json({ requiresMfa: true }, { status: 202 });
      }
      throw authErr;
    }

    let mappedAccounts: ReturnType<typeof transformMonarchAccounts> = [];
    let mappedExpenses: ReturnType<typeof aggregateMonarchTransactions> = [];
    let mappedIncome: ReturnType<typeof aggregateMonarchIncome> = [];

    if (fetchAccounts) {
      const { accounts: rawAccounts } = await mm.getAccounts();
      mappedAccounts = transformMonarchAccounts(rawAccounts as unknown as MonarchRawAccount[]);
    }

    if (fetchTransactions || fetchIncome) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - lookbackMonths);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const rawTransactions = (await mm.getAllTransactions({
        startDate: startDateStr,
        endDate: endDateStr,
      })) as unknown as MonarchRawTransaction[];

      if (fetchTransactions) {
        mappedExpenses = aggregateMonarchTransactions(rawTransactions, lookbackMonths);
      }
      if (fetchIncome) {
        mappedIncome = aggregateMonarchIncome(rawTransactions, lookbackMonths);
      }
    }

    return NextResponse.json({
      accounts: mappedAccounts,
      expenses: mappedExpenses,
      income: mappedIncome,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error connecting to Monarch Money';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
