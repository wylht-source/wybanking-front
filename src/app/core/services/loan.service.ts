import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  LoanDetail,
  LoanSummary,
  RequestLoanRequest,
  RequestLoanResult,
  RejectLoanRequest,
  RequestPayrollLoanRequest,
  RequestPayrollLoanResult,
  LoanApprovalDetails,
} from '../models/loan.model';
import { PagedResult } from '../models/transaction.model';
import { AiAnalysisStatus } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly base = `${environment.apiUrl}/api/loans`;

  constructor(private http: HttpClient) {}

  getApprovalDetails(id: string) {
    return this.http.get<LoanApprovalDetails>(`${this.base}/${id}/approval-details`);
  }

  requestPayrollLoan(request: RequestPayrollLoanRequest) {
    return this.http.post<RequestPayrollLoanResult>(`${this.base}/request-payroll`, request);
  }

  requestLoan(request: RequestLoanRequest) {
    return this.http.post<RequestLoanResult>(`${this.base}/request`, request);
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

  approveLoan(id: string) {
    return this.http.post<void>(`${this.base}/${id}/approve`, {});
  }

  rejectLoan(id: string, request: RejectLoanRequest) {
    return this.http.post<void>(`${this.base}/${id}/reject`, request);
  }

  cancelLoan(id: string) {
    return this.http.post<void>(`${this.base}/${id}/cancel`, {});
  }

  getDecidedLoans(page = 1, pageSize = 20) {
    return this.http.get<PagedResult<LoanSummary>>(`${this.base}/decided`, {
      params: { page, pageSize },
    });
  }
  retryAiAnalysis(id: string) {
    return this.http.post<{ loanId: string; aiAnalysisStatus: AiAnalysisStatus }>(
      `${this.base}/${id}/retry-ai-analysis`,
      {},
    );
  }
}
