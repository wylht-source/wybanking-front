import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PendingLoansComponent } from './pending-loans.component';
import { LoanService } from '../../../core/services/loan.service';
import { LoanApprovalDetails, LoanSummary } from '../../../core/models/loan.model';

describe('PendingLoansComponent', () => {
  let loanServiceStub: {
    getPendingLoans: ReturnType<typeof vi.fn>;
    getApprovalDetails: ReturnType<typeof vi.fn>;
    approveLoan: ReturnType<typeof vi.fn>;
    rejectLoan: ReturnType<typeof vi.fn>;
  };

  const pendingLoan: LoanSummary = {
    loanId: 'loan-1',
    amount: 50000,
    installments: 24,
    monthlyPayment: 2750,
    status: 'PendingApproval',
    requiredApprovalRole: 'Supervisor',
    requestedAt: '2026-03-20T10:00:00Z',
    loanType: 'Payroll',
  };

  const approvalDetails: LoanApprovalDetails = {
    loanSummary: {
      loanId: 'loan-1',
      clientId: 'client-1',
      clientDisplayName: 'Serge Junior',
      amount: 50000,
      installments: 24,
      interestRateMonthly: 0.015,
      monthlyPayment: 2750,
      requestedAt: '2026-03-20T10:00:00Z',
      requiredApprovalRole: 'Supervisor',
      status: 'PendingApproval',
      loanType: 'Payroll',
    },
    customerPaymentView: {
      monthlyPayment: 2750,
      totalPayable: 66000,
      totalInterestCharged: 16000,
      firstDueDate: '2026-04-20T00:00:00Z',
      lastDueDate: '2028-03-20T00:00:00Z',
      isEstimated: false,
      paymentSchedule: [
        {
          installmentNumber: 1,
          dueDate: '2026-04-20T00:00:00Z',
          paymentAmount: 2750,
        },
      ],
    },
    bankProfitabilityView: {
      totalPayable: 66000,
      grossInterestRevenue: 16000,
      estimatedFundingCost: 4000,
      expectedCreditLoss: 1000,
      estimatedOperationalCost: 500,
      estimatedCapitalCharge: 300,
      estimatedNetProfit: 10200,
      estimatedProfitMargin: 0.1545,
    },
    workflowHistory: [],
    payrollSummary: {
      employerName: 'WY Banking',
      monthlySalary: 10000,
      employmentStatus: 'Active',
      existingPayrollDeductions: 500,
      payrollMarginLimit: 3500,
      availablePayrollMargin: 3000,
      monthlyPayment: 2750,
      remainingPayrollMargin: 250,
      marginUsageAfterApproval: 0.785,
    },
  };

  beforeEach(async () => {
    loanServiceStub = {
      getPendingLoans: vi.fn(),
      getApprovalDetails: vi.fn(),
      approveLoan: vi.fn(),
      rejectLoan: vi.fn(),
    };

    loanServiceStub.getPendingLoans.mockReturnValue(
      of({
        items: [pendingLoan],
        totalCount: 1,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PendingLoansComponent],
      providers: [
        { provide: LoanService, useValue: loanServiceStub },
      ],
    }).compileComponents();

  });

  it('loads pending loans on init', () => {
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(loanServiceStub.getPendingLoans).toHaveBeenCalledWith(1, 10);
    expect(component.loans()).toEqual([pendingLoan]);
    expect(component.totalCount()).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('shows an error message when the initial load fails', () => {
    loanServiceStub.getPendingLoans.mockReturnValueOnce(throwError(() => new Error('network')));

    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load pending loans.');
    expect(component.loading()).toBe(false);
  });

  it('opens loan details successfully', () => {
    loanServiceStub.getApprovalDetails.mockReturnValue(of(approvalDetails));
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.openDetail(pendingLoan);

    expect(loanServiceStub.getApprovalDetails).toHaveBeenCalledWith('loan-1');
    expect(component.viewState()).toBe('detail');
    expect(component.selectedDetail()).toEqual(approvalDetails);
    expect(component.detailLoading()).toBe(false);
  });

  it('returns to list view when loading details fails', () => {
    loanServiceStub.getApprovalDetails.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.openDetail(pendingLoan);

    expect(component.errorMessage()).toBe('Failed to load loan details.');
    expect(component.viewState()).toBe('list');
    expect(component.selectedDetail()).toBeNull();
    expect(component.detailLoading()).toBe(false);
  });

  it('approves the selected loan, clears the detail view and reloads the list', () => {
    loanServiceStub.approveLoan.mockReturnValue(of(void 0));
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.viewState.set('detail');
    component.selectedDetail.set(approvalDetails);
    component.errorMessage.set('stale error');
    component.successMessage.set('stale success');

    component.approveLoan('loan-1');

    expect(loanServiceStub.approveLoan).toHaveBeenCalledWith('loan-1');
    expect(component.successMessage()).toBe('Loan approved successfully.');
    expect(component.errorMessage()).toBe('');
    expect(component.viewState()).toBe('list');
    expect(component.selectedDetail()).toBeNull();
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('shows an error message when approval fails', () => {
    loanServiceStub.approveLoan.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;

    component.successMessage.set('stale success');
    component.errorMessage.set('stale error');
    component.approveLoan('loan-1');

    expect(component.successMessage()).toBe('');
    expect(component.errorMessage()).toBe('Failed to approve loan. Please try again.');
  });

  it('rejects a loan when the dialog returns a reason', () => {
    loanServiceStub.rejectLoan.mockReturnValue(of(void 0));
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');
    const openSpy = vi.spyOn(component['dialog'] as MatDialog, 'open').mockReturnValue({
      afterClosed: () => of('Insufficient repayment capacity'),
    } as never);

    component.viewState.set('detail');
    component.selectedDetail.set(approvalDetails);

    component.openRejectDialog('loan-1', 50000);

    expect(openSpy).toHaveBeenCalled();
    expect(loanServiceStub.rejectLoan).toHaveBeenCalledWith('loan-1', {
      reason: 'Insufficient repayment capacity',
    });
    expect(component.successMessage()).toBe('Loan rejected.');
    expect(component.viewState()).toBe('list');
    expect(component.selectedDetail()).toBeNull();
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('does not reject a loan when the dialog is closed without a reason', () => {
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;
    vi.spyOn(component['dialog'] as MatDialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as never);

    component.openRejectDialog('loan-1', 50000);

    expect(loanServiceStub.rejectLoan).not.toHaveBeenCalled();
  });

  it('moves to the next page and reloads the list', () => {
    const fixture = TestBed.createComponent(PendingLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.nextPage();

    expect(component.page()).toBe(2);
    expect(loadLoansSpy).toHaveBeenCalled();
  });
});
