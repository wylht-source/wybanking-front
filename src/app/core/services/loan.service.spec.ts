import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LoanService } from './loan.service';
import { environment } from '../../../environments/environment';

describe('LoanService', () => {
  let service: LoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoanService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets approval details for a loan', () => {
    service.getApprovalDetails('loan-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/loan-1/approval-details`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('posts payroll loan requests', () => {
    const request = {
      amount: 10000,
      installments: 24,
      employerName: 'WY Banking',
      monthlySalary: 4000,
      employmentStatus: 'Active' as const,
      existingPayrollDeductions: 200,
    };

    service.requestPayrollLoan(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/request-payroll`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('posts personal loan requests', () => {
    const request = { amount: 9000, installments: 12 };

    service.requestLoan(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/request`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('gets a specific loan by id', () => {
    service.getLoan('loan-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/loan-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('gets the current user loans with paging params', () => {
    service.getMyLoans(2, 10).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/my-loans?page=2&pageSize=10`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0 });
  });

  it('gets pending loans with paging params', () => {
    service.getPendingLoans(3, 25).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/pending?page=3&pageSize=25`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0 });
  });

  it('posts loan approvals', () => {
    service.approveLoan('loan-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/loan-1/approve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('posts loan rejection reasons', () => {
    const request = { reason: 'Insufficient repayment capacity' };

    service.rejectLoan('loan-1', request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/loan-1/reject`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('posts loan cancellations', () => {
    service.cancelLoan('loan-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/loan-1/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('gets decided loans with paging params', () => {
    service.getDecidedLoans(4, 5).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/loans/decided?page=4&pageSize=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0 });
  });
});
