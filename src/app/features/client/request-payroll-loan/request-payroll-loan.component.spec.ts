import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RequestPayrollLoanComponent } from './request-payroll-loan.component';
import { LoanService } from '../../../core/services/loan.service';
import { RequestPayrollLoanResult } from '../../../core/models/loan.model';

describe('RequestPayrollLoanComponent', () => {
  let loanServiceStub: {
    requestPayrollLoan: ReturnType<typeof vi.fn>;
  };

  const requestResult: RequestPayrollLoanResult = {
    loanId: 'loan-1',
    amount: 10000,
    installments: 24,
    interestRate: 0.009,
    monthlyPayment: 456.84,
    requiredApprovalRole: 'Manager',
    status: 'PendingApproval',
    requestedAt: '2026-03-23T10:00:00Z',
    payrollMarginLimit: 1400,
    availablePayrollMargin: 1200,
    remainingPayrollMargin: 743.16,
    marginUsageAfterApproval: 0.1142,
  };

  beforeEach(async () => {
    loanServiceStub = {
      requestPayrollLoan: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RequestPayrollLoanComponent],
      providers: [{ provide: LoanService, useValue: loanServiceStub }],
    }).compileComponents();
  });

  function fillValidForm(component: RequestPayrollLoanComponent) {
    component.form.setValue({
      amount: 10000,
      employerName: 'WY Banking',
      monthlySalary: 4000,
      employmentStatus: 'Active',
      existingPayrollDeductions: 200,
    });
  }

  it('keeps the user on the form and marks fields as touched when the form is invalid', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;

    component.goToReview();

    expect(component.viewState()).toBe('form');
    expect(component.form.get('amount')?.touched).toBe(true);
  });

  it('moves to the review step and clears stale errors when the form is valid', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.errorMessage.set('stale error');

    component.goToReview();

    expect(component.viewState()).toBe('review');
    expect(component.errorMessage()).toBe('');
  });

  it('updates installments and calculates estimated values and payroll margin', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.selectInstallments(24);

    expect(component.selectedInstallments()).toBe(24);
    expect(component.estimatedMonthly()).toBe(465.15);
    expect(component.estimatedTotal()).toBe(11163.6);
    expect(component.estimatedInterest()).toBe(1163.6);
    expect(component.payrollMarginLimit()).toBe(1400);
    expect(component.availableMargin()).toBe(1200);
    expect(component.marginAfterApproval()).toBe(734.85);
    expect(component.marginUsage()).toBe(0.1163);
    expect(component.marginUsagePercent()).toBe(38.76);
    expect(component.isMarginSufficient()).toBe(true);
    expect(component.suggestedMaxAmount()).toBe(25700);
    expect(component.isEmploymentActive()).toBe(true);
  });

  it('returns safe defaults when salary or margin is not available', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;

    expect(component.estimatedMonthly()).toBe(0);
    expect(component.estimatedTotal()).toBe(0);
    expect(component.estimatedInterest()).toBe(0);
    expect(component.payrollMarginLimit()).toBe(0);
    expect(component.availableMargin()).toBe(0);
    expect(component.marginUsage()).toBe(0);
    expect(component.marginUsagePercent()).toBe(0);
    expect(component.suggestedMaxAmount()).toBe(0);
  });

  it('detects when payroll margin is insufficient or employment is not active', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    component.form.setValue({
      amount: 20000,
      employerName: 'WY Banking',
      monthlySalary: 2000,
      employmentStatus: 'OnLeave',
      existingPayrollDeductions: 500,
    });

    expect(component.isMarginSufficient()).toBe(false);
    expect(component.marginAfterApproval()).toBeLessThan(0);
    expect(component.isEmploymentActive()).toBe(false);
  });

  it('submits the payroll loan successfully and moves to the success state', () => {
    loanServiceStub.requestPayrollLoan.mockReturnValue(of(requestResult));
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.viewState.set('review');

    component.onSubmit();

    expect(loanServiceStub.requestPayrollLoan).toHaveBeenCalledWith({
      amount: 10000,
      installments: 24,
      employerName: 'WY Banking',
      monthlySalary: 4000,
      employmentStatus: 'Active',
      existingPayrollDeductions: 200,
    });
    expect(component.result()).toEqual(requestResult);
    expect(component.submitting()).toBe(false);
    expect(component.viewState()).toBe('success');
  });

  it('shows the backend error when submission fails', () => {
    loanServiceStub.requestPayrollLoan.mockReturnValue(
      throwError(() => ({
        error: {
          error: 'Payroll margin exceeded.',
        },
      })),
    );
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.viewState.set('review');

    component.onSubmit();

    expect(component.errorMessage()).toBe('Payroll margin exceeded.');
    expect(component.submitting()).toBe(false);
    expect(component.viewState()).toBe('form');
  });

  it('falls back to the generic message when submission fails without backend text', () => {
    loanServiceStub.requestPayrollLoan.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.viewState.set('review');

    component.onSubmit();

    expect(component.errorMessage()).toBe('Failed to request payroll loan. Please try again.');
    expect(component.submitting()).toBe(false);
    expect(component.viewState()).toBe('form');
  });

  it('returns to the form step when editing from review', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    component.viewState.set('review');

    component.backToForm();

    expect(component.viewState()).toBe('form');
  });

  it('resets the form state for a new request', () => {
    const fixture = TestBed.createComponent(RequestPayrollLoanComponent);
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.form.markAsDirty();
    component.form.markAllAsTouched();
    component.selectedInstallments.set(60);
    component.result.set(requestResult);
    component.errorMessage.set('stale error');
    component.viewState.set('success');

    component.newRequest();

    expect(component.result()).toBeNull();
    expect(component.errorMessage()).toBe('');
    expect(component.form.get('amount')?.value).toBeNull();
    expect(component.form.get('employmentStatus')?.value).toBe('Active');
    expect(component.form.get('existingPayrollDeductions')?.value).toBe(0);
    expect(component.form.pristine).toBe(true);
    expect(component.form.untouched).toBe(true);
    expect(component.selectedInstallments()).toBe(24);
    expect(component.viewState()).toBe('form');
  });
});
