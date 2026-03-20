import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  DepositRequest,
  DepositResult,
  WithdrawRequest,
  WithdrawResult,
  TransferRequest,
} from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly base = `${environment.apiUrl}/api/transactions`;

  constructor(private http: HttpClient) {}

  deposit(request: DepositRequest) {
    return this.http.post<DepositResult>(`${this.base}/deposit`, request, {
      headers: this.idempotencyHeader(),
    });
  }

  withdraw(request: WithdrawRequest) {
    return this.http.post<WithdrawResult>(`${this.base}/withdraw`, request, {
      headers: this.idempotencyHeader(),
    });
  }

  transfer(request: TransferRequest) {
    return this.http.post<WithdrawResult>(`${this.base}/transfer`, request, {
      headers: this.idempotencyHeader(),
    });
  }

  private idempotencyHeader(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}
