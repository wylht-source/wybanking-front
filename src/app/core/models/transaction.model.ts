export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DepositRequest {
  accountId: string;
  amount: number;
  description: string;
}

export interface WithdrawRequest {
  accountId: string;
  amount: number;
  description: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}

export interface DepositResult {
  transactionId: string;
  newBalance: number;
  wasDuplicate: boolean;
}

export interface WithdrawResult {
  transactionId: string;
  newBalance: number;
  wasDuplicate: boolean;
}
