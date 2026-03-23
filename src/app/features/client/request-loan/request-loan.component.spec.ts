import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RequestLoanComponent } from './request-loan.component';
import { LoanService } from '../../../core/services/loan.service';
import { RequestLoanResult } from '../../../core/models/loan.model';

describe('RequestLoanComponent', () => {
  let loanServiceStub: {
    requestLoan: ReturnType<typeof vi.fn>;
  };

  const requestResult: RequestLoanResult = {
    loanId: 'loan-1',
    amount: 10000,
    installments: 12,
    interestRate: 0.015,
    monthlyPayment: 916.8,
    requiredApprovalRole: 'Supervisor',
    status: 'PendingApproval',
    requestedAt: '2026-03-23T10:00:00Z',
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));

    loanServiceStub = {
      requestLoan: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RequestLoanComponent],
      providers: [{ provide: LoanService, useValue: loanServiceStub }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the user on the form and marks fields as touched when the form is invalid', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;

    component.goToReview();

    expect(component.viewState()).toBe('form');
    expect(component.form.get('amount')?.touched).toBe(true);
  });

  it('moves to the review step and clears stale errors when the form is valid', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.errorMessage.set('stale error');
    component.form.setValue({ amount: 10000 });

    component.goToReview();

    expect(component.viewState()).toBe('review');
    expect(component.errorMessage()).toBe('');
  });

  it('updates the selected installments and calculates estimated values', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10000 });
    component.selectInstallments(24);

    expect(component.selectedInstallments()).toBe(24);
    expect(component.estimatedMonthly()).toBe(499.24);
    expect(component.estimatedTotal()).toBe(11981.76);
    expect(component.estimatedInterest()).toBe(1981.76);
    expect(component.getRequiredRole()).toBe('Supervisor');
  });

  it('returns zero estimates when the amount is not valid', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;

    expect(component.estimatedMonthly()).toBe(0);
    expect(component.estimatedTotal()).toBe(0);
    expect(component.estimatedInterest()).toBe(0);
    expect(component.getRequiredRole()).toBe('Manager');
  });

  it('computes deterministic payment dates based on the current date', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.selectInstallments(12);

    expect(component.firstPaymentDate().toISOString()).toBe('2026-04-22T12:00:00.000Z');
    expect(component.getInstallmentDate(3).toISOString()).toBe('2026-06-22T12:00:00.000Z');
    expect(component.lastPaymentDate().toISOString()).toBe('2027-03-22T12:00:00.000Z');
  });

  it('submits the request successfully and moves to the success state', () => {
    loanServiceStub.requestLoan.mockReturnValue(of(requestResult));
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10000 });
    component.selectInstallments(12);
    component.viewState.set('review');

    component.onSubmit();

    expect(loanServiceStub.requestLoan).toHaveBeenCalledWith({
      amount: 10000,
      installments: 12,
    });
    expect(component.result()).toEqual(requestResult);
    expect(component.submitting()).toBe(false);
    expect(component.viewState()).toBe('success');
    expect(component.resultTotal()).toBeCloseTo(11001.6);
    expect(component.resultInterest()).toBeCloseTo(1001.6);
  });

  it('shows a backend error string from error.error.error when submission fails', () => {
    loanServiceStub.requestLoan.mockReturnValue(
      throwError(() => ({
        error: {
          error: 'Insufficient credit score.',
        },
      })),
    );
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10000 });
    component.viewState.set('review');

    component.onSubmit();

    expect(component.errorMessage()).toBe('Insufficient credit score.');
    expect(component.submitting()).toBe(false);
    expect(component.viewState()).toBe('form');
  });

  it('falls back to the first backend validation error and then to the generic message', () => {
    loanServiceStub.requestLoan
      .mockReturnValueOnce(
        throwError(() => ({
          error: {
            errors: ['Amount exceeds allowed limit.'],
          },
        })),
      )
      .mockReturnValueOnce(throwError(() => new Error('network')));

    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10000 });
    component.viewState.set('review');

    component.onSubmit();
    expect(component.errorMessage()).toBe('Amount exceeds allowed limit.');
    expect(component.viewState()).toBe('form');

    component.viewState.set('review');
    component.onSubmit();
    expect(component.errorMessage()).toBe('Failed to request loan. Please try again.');
    expect(component.submitting()).toBe(false);
  });

  it('returns to the form step when editing from review', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.viewState.set('review');

    component.backToForm();

    expect(component.viewState()).toBe('form');
  });

  it('resets the form state for a new request', () => {
    const fixture = TestBed.createComponent(RequestLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ amount: 10000 });
    component.form.markAsDirty();
    component.form.markAllAsTouched();
    component.selectedInstallments.set(24);
    component.result.set(requestResult);
    component.errorMessage.set('stale error');
    component.viewState.set('success');

    component.newRequest();

    expect(component.result()).toBeNull();
    expect(component.errorMessage()).toBe('');
    expect(component.form.get('amount')?.value).toBeNull();
    expect(component.form.pristine).toBe(true);
    expect(component.form.untouched).toBe(true);
    expect(component.selectedInstallments()).toBe(12);
    expect(component.viewState()).toBe('form');
  });
});
