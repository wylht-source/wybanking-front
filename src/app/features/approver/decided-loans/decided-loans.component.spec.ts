import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DecidedLoansComponent } from './decided-loans.component';
import { LoanService } from '../../../core/services/loan.service';
import { LoanApprovalDetails, LoanSummary } from '../../../core/models/loan.model';

describe('DecidedLoansComponent', () => {
  let loanServiceStub: {
    getDecidedLoans: ReturnType<typeof vi.fn>;
    getApprovalDetails: ReturnType<typeof vi.fn>;
  };

  const decidedLoan: LoanSummary = {
    loanId: 'loan-1',
    amount: 18000,
    installments: 12,
    monthlyPayment: 1650,
    status: 'Approved',
    requiredApprovalRole: 'Manager',
    requestedAt: '2026-03-20T10:00:00Z',
    loanType: 'Personal',
  };

  const approvalDetails: LoanApprovalDetails = {
    loanSummary: {
      loanId: 'loan-1',
      clientId: 'client-1',
      clientDisplayName: 'Serge Junior',
      amount: 18000,
      installments: 12,
      interestRateMonthly: 0.018,
      monthlyPayment: 1650,
      requestedAt: '2026-03-20T10:00:00Z',
      requiredApprovalRole: 'Manager',
      status: 'Approved',
      loanType: 'Personal',
    },
    customerPaymentView: {
      monthlyPayment: 1650,
      totalPayable: 19800,
      totalInterestCharged: 1800,
      firstDueDate: '2026-04-20T00:00:00Z',
      lastDueDate: '2027-03-20T00:00:00Z',
      isEstimated: false,
      paymentSchedule: [
        {
          installmentNumber: 1,
          dueDate: '2026-04-20T00:00:00Z',
          paymentAmount: 1650,
        },
      ],
    },
    bankProfitabilityView: {
      totalPayable: 19800,
      grossInterestRevenue: 1800,
      estimatedFundingCost: 300,
      expectedCreditLoss: 100,
      estimatedOperationalCost: 80,
      estimatedCapitalCharge: 50,
      estimatedNetProfit: 1270,
      estimatedProfitMargin: 0.064,
    },
    workflowHistory: [
      {
        action: 'Submitted',
        performedBy: 'user-1',
        performedByRole: 'Client',
        performedAt: '2026-03-20T10:00:00Z',
      },
      {
        action: 'Approved',
        performedBy: 'user-2',
        performedByRole: 'Manager',
        performedAt: '2026-03-20T11:00:00Z',
        comment: 'Healthy profile',
      },
    ],
    payrollSummary: null,
  };

  beforeEach(async () => {
    loanServiceStub = {
      getDecidedLoans: vi.fn(),
      getApprovalDetails: vi.fn(),
    };

    loanServiceStub.getDecidedLoans.mockReturnValue(
      of({
        items: [decidedLoan],
        totalCount: 25,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [DecidedLoansComponent],
      providers: [{ provide: LoanService, useValue: loanServiceStub }],
    }).compileComponents();
  });

  it('loads decided loans on init', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(loanServiceStub.getDecidedLoans).toHaveBeenCalledWith(1, 20);
    expect(component.loans()).toEqual([decidedLoan]);
    expect(component.totalCount()).toBe(25);
    expect(component.loading()).toBe(false);
  });

  it('shows an error message when the initial load fails', () => {
    loanServiceStub.getDecidedLoans.mockReturnValueOnce(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load reviewed loans.');
    expect(component.loading()).toBe(false);
  });

  it('opens loan details successfully', () => {
    loanServiceStub.getApprovalDetails.mockReturnValue(of(approvalDetails));
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.openDetail(decidedLoan);

    expect(loanServiceStub.getApprovalDetails).toHaveBeenCalledWith('loan-1');
    expect(component.viewState()).toBe('detail');
    expect(component.selectedDetail()).toEqual(approvalDetails);
    expect(component.detailLoading()).toBe(false);
  });

  it('returns to list view when loading details fails', () => {
    loanServiceStub.getApprovalDetails.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.openDetail(decidedLoan);

    expect(component.errorMessage()).toBe('Failed to load loan details.');
    expect(component.viewState()).toBe('list');
    expect(component.selectedDetail()).toBeNull();
    expect(component.detailLoading()).toBe(false);
  });

  it('clears selected detail and error when going back to the list', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    component.viewState.set('detail');
    component.selectedDetail.set(approvalDetails);
    component.errorMessage.set('stale error');

    component.backToList();

    expect(component.viewState()).toBe('list');
    expect(component.selectedDetail()).toBeNull();
    expect(component.errorMessage()).toBe('');
  });

  it('moves to the next page and reloads the list', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.nextPage();

    expect(component.page()).toBe(2);
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('moves to the previous page and reloads the list', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.page.set(2);
    component.prevPage();

    expect(component.page()).toBe(1);
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('reports when there is a next page', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    component.page.set(1);
    component.totalCount.set(25);
    expect(component.hasNextPage).toBe(true);

    component.page.set(2);
    expect(component.hasNextPage).toBe(false);
  });

  it('returns the final approval decision from workflow history', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    expect(component.getDecisionInfo(approvalDetails)).toEqual(approvalDetails.workflowHistory[1]);
  });

  it('maps status and profitability helpers to the expected labels and classes', () => {
    const fixture = TestBed.createComponent(DecidedLoansComponent);
    const component = fixture.componentInstance;

    expect(component.getStatusClass('Approved')).toBe('badge-approved');
    expect(component.getStatusClass('Rejected')).toBe('badge-rejected');
    expect(component.getStatusClass('PendingApproval')).toBe('badge-pending');

    expect(component.getProfitabilityBadgeClass(-0.01)).toBe('badge-negative');
    expect(component.getProfitabilityBadgeClass(0.01)).toBe('badge-low');
    expect(component.getProfitabilityBadgeClass(0.08)).toBe('badge-good');
    expect(component.getProfitabilityBadgeText(0.08)).toBe('Good profitability (8.00% margin)');

    expect(component.getPayrollCommitmentClass(0.2)).toBe('commitment-low');
    expect(component.getPayrollCommitmentClass(0.5)).toBe('commitment-medium');
    expect(component.getPayrollCommitmentClass(0.8)).toBe('commitment-high');
    expect(component.getPayrollCommitmentLabel(0.5)).toBe('Medium');
  });
});
