export interface Account {
  id: string;
  accountNumber: string;
  ownerName: string;
  balance: number;
  createdAt: string;
}

export interface CreateAccountRequest {
  ownerName: string;
}
