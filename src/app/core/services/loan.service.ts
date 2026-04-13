import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  LoanDetail,
  LoanSummary,
  RequestLoanRequest,
  RequestLoanResult,
  RequestPayrollLoanRequest,
  RequestPayrollLoanResult,
  RejectLoanRequest,
  LoanApprovalDetails,
  AiAnalysisStatus,
} from '../models/loan.model';
import { PagedResult } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly base = `${environment.apiUrl}/api/loans`;

  constructor(private http: HttpClient) {}

  requestLoan(request: RequestLoanRequest) {
    return this.http.post<RequestLoanResult>(`${this.base}/request`, request, {
      headers: this.idempotencyHeader(),
    });
  }

  requestPayrollLoan(request: RequestPayrollLoanRequest) {
    return this.http.post<RequestPayrollLoanResult>(`${this.base}/request-payroll`, request, {
      headers: this.idempotencyHeader(),
    });
  }

  getLoan(id: string) {
    return this.http.get<LoanDetail>(`${this.base}/${id}`);
  }

  getMyLoans(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<LoanSummary>>(`${this.base}/my-loans`, {
      params: { page, pageSize },
    });
  }

  getPendingLoans(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<LoanSummary>>(`${this.base}/pending`, {
      params: { page, pageSize },
    });
  }

  getDecidedLoans(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<LoanSummary>>(`${this.base}/decided`, {
      params: { page, pageSize },
    });
  }

  getApprovalDetails(id: string) {
    return this.http.get<LoanApprovalDetails>(`${this.base}/${id}/approval-details`);
  }

  approveLoan(id: string) {
    return this.http.post<void>(`${this.base}/${id}/approve`, {});
  }

  rejectLoan(id: string, request: RejectLoanRequest) {
    return this.http.post<void>(`${this.base}/${id}/reject`, request);
  }

  cancelLoan(id: string) {
    return this.http.post<void>(`${this.base}/${id}/cancel`, {});
  }

  retryAiAnalysis(id: string) {
    return this.http.post<{
      loanId: string;
      aiAnalysisStatus: AiAnalysisStatus;
      documentCount: number;
    }>(`${this.base}/${id}/retry-ai-analysis`, {});
  }

  private idempotencyHeader(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}
