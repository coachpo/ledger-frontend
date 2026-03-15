export interface BalanceRead {
  id: number;
  portfolioId: number;
  label: string;
  amount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceWriteInput {
  label: string;
  amount: string;
}

export interface BalanceUpdateInput {
  label?: string;
  amount?: string;
}

export interface BalanceCompactRead {
  id: number;
  label: string;
  amount: string;
  currency: string;
}
