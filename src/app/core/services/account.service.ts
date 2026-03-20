import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Account, CreateAccountRequest } from '../models/account.model';
import { PagedResult, Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly base = `${environment.apiUrl}/api/accounts`;

  constructor(private http: HttpClient) {}

  createAccount(request: CreateAccountRequest) {
    return this.http.post<Account>(this.base, request);
  }

  getMyAccount() {
    return this.http.get<Account>(`${this.base}/me`);
  }

  getAccount(id: string) {
    return this.http.get<Account>(`${this.base}/${id}`);
  }

  getStatement(id: string, page = 1, pageSize = 20) {
    return this.http.get<PagedResult<Transaction>>(`${this.base}/${id}/statement`, {
      params: { page, pageSize },
    });
  }
}
