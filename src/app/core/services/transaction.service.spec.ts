import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TransactionService } from './transaction.service';
import { environment } from '../../../environments/environment';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

    TestBed.configureTestingModule({
      providers: [TransactionService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('posts deposits with an idempotency header', () => {
    const request = { accountId: 'account-1', amount: 100, description: 'Cash in' };

    service.deposit(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/transactions/deposit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('Idempotency-Key')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    req.flush({});
  });

  it('posts withdrawals with an idempotency header', () => {
    const request = { accountId: 'account-1', amount: 50, description: 'ATM' };

    service.withdraw(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/transactions/withdraw`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('Idempotency-Key')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    req.flush({});
  });

  it('posts transfers with an idempotency header', () => {
    const request = {
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      amount: 75,
      description: 'Rent',
    };

    service.transfer(request).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/transactions/transfer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('Idempotency-Key')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    req.flush({});
  });
});
