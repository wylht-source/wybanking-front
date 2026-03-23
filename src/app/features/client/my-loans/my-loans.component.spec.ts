import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MyLoansComponent } from './my-loans.component';
import { LoanService } from '../../../core/services/loan.service';
import { LoanSummary } from '../../../core/models/loan.model';

describe('MyLoansComponent', () => {
  let loanServiceStub: {
    getMyLoans: ReturnType<typeof vi.fn>;
    cancelLoan: ReturnType<typeof vi.fn>;
  };

  const pendingLoan: LoanSummary = {
    loanId: 'loan-1',
    amount: 12000,
    installments: 12,
    monthlyPayment: 1100,
    status: 'PendingApproval',
    requiredApprovalRole: 'Manager',
    requestedAt: '2026-03-20T10:00:00Z',
    loanType: 'Personal',
  };

  beforeEach(async () => {
    loanServiceStub = {
      getMyLoans: vi.fn(),
      cancelLoan: vi.fn(),
    };

    loanServiceStub.getMyLoans.mockReturnValue(
      of({
        items: [pendingLoan],
        totalCount: 12,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [MyLoansComponent],
      providers: [{ provide: LoanService, useValue: loanServiceStub }],
    }).compileComponents();
  });

  it('loads the user loans on init', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(loanServiceStub.getMyLoans).toHaveBeenCalledWith(1, 10);
    expect(component.loans()).toEqual([pendingLoan]);
    expect(component.totalCount()).toBe(12);
    expect(component.loading()).toBe(false);
  });

  it('shows an error message when loan loading fails', () => {
    loanServiceStub.getMyLoans.mockReturnValueOnce(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load loans.');
    expect(component.loading()).toBe(false);
  });

  it('cancels a loan when the dialog is confirmed and reloads the list', () => {
    loanServiceStub.cancelLoan.mockReturnValue(of(void 0));
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');
    const openSpy = vi.spyOn(component['dialog'] as MatDialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as never);

    component.confirmCancel(pendingLoan);

    expect(openSpy).toHaveBeenCalled();
    expect(loanServiceStub.cancelLoan).toHaveBeenCalledWith('loan-1');
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('does not cancel a loan when the dialog is dismissed', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;
    vi.spyOn(component['dialog'] as MatDialog, 'open').mockReturnValue({
      afterClosed: () => of(false),
    } as never);

    component.confirmCancel(pendingLoan);

    expect(loanServiceStub.cancelLoan).not.toHaveBeenCalled();
  });

  it('shows an error message when cancelling a loan fails', () => {
    loanServiceStub.cancelLoan.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;
    vi.spyOn(component['dialog'] as MatDialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as never);

    component.confirmCancel(pendingLoan);

    expect(component.errorMessage()).toBe('Failed to cancel loan. Please try again.');
  });

  it('moves to the next page and reloads the list', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.nextPage();

    expect(component.page()).toBe(2);
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('moves to the previous page and reloads the list', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;
    const loadLoansSpy = vi.spyOn(component, 'loadLoans');

    component.page.set(2);
    component.prevPage();

    expect(component.page()).toBe(1);
    expect(loadLoansSpy).toHaveBeenCalled();
  });

  it('reports when there is a next page', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;

    component.page.set(1);
    component.totalCount.set(12);
    expect(component.hasNextPage).toBe(true);

    component.page.set(2);
    expect(component.hasNextPage).toBe(false);
  });

  it('maps loan status to the expected badge class', () => {
    const fixture = TestBed.createComponent(MyLoansComponent);
    const component = fixture.componentInstance;

    expect(component.getStatusClass('Approved')).toBe('badge-approved');
    expect(component.getStatusClass('Rejected')).toBe('badge-rejected');
    expect(component.getStatusClass('Cancelled')).toBe('badge-cancelled');
    expect(component.getStatusClass('PendingApproval')).toBe('badge-pending');
  });
});
