import type { MonarchRawAccount, MonarchRawTransaction } from './mapping';

const MONARCH_GRAPHQL_ENDPOINT = 'https://api.monarchmoney.com/graphql';

const GET_ACCOUNTS_QUERY = `
  query GetAccounts {
    accounts {
      id
      displayName
      currentBalance
      type {
        name
        display
      }
      subtype {
        name
        display
      }
      isAsset
      mask
      syncDisabled
      deactivatedAt
      isHidden
    }
  }
`;

const GET_TRANSACTIONS_QUERY = `
  query GetTransactionsList($offset: Int, $limit: Int, $filters: TransactionFilterInput) {
    allTransactions(filters: $filters) {
      totalCount
      results(offset: $offset, limit: $limit) {
        id
        amount
        date
        hideFromReports
        category {
          id
          name
          group {
            id
            type
            name
          }
        }
        merchant {
          name
        }
      }
    }
  }
`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Direct GraphQL client for Monarch Money.
 */
export class MonarchClient {
  private token: string;

  constructor(token: string) {
    this.token = token.trim();
  }

  private async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(MONARCH_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.token}`,
        'User-Agent': 'Ignidash-Monarch-Sync/1.0',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401) {
      throw new Error('Invalid or expired Monarch Money session token (401 Unauthorized).');
    }

    if (res.status === 429) {
      throw new Error('Monarch Money API rate limit reached (429). Please try again in a few moments.');
    }

    if (!res.ok) {
      throw new Error(`Monarch Money request failed with status ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      throw new Error(`Monarch GraphQL Error: ${json.errors[0].message}`);
    }

    if (!json.data) {
      throw new Error('No data returned from Monarch GraphQL.');
    }

    return json.data;
  }

  async getAccounts(): Promise<MonarchRawAccount[]> {
    const data = await this.request<{ accounts: MonarchRawAccount[] }>(GET_ACCOUNTS_QUERY);
    return data.accounts || [];
  }

  async getTransactions(lookbackMonths: number = 6): Promise<MonarchRawTransaction[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - lookbackMonths);
    const startDateStr = startDate.toISOString().split('T')[0];

    const allTransactions: MonarchRawTransaction[] = [];
    const limit = 500;
    let offset = 0;

    while (true) {
      const data = await this.request<{
        allTransactions: {
          totalCount: number;
          results: MonarchRawTransaction[];
        };
      }>(GET_TRANSACTIONS_QUERY, {
        limit,
        offset,
        filters: {
          startDate: startDateStr,
        },
      });

      const results = data.allTransactions?.results || [];
      if (results.length === 0) break;

      allTransactions.push(...results);
      offset += limit;

      const total = data.allTransactions?.totalCount || 0;
      if (offset >= total || allTransactions.length >= 5000) {
        break;
      }
    }

    return allTransactions;
  }
}
