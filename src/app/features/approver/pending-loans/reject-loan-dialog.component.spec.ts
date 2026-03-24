import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RejectLoanDialogComponent } from './reject-loan-dialog.component';

describe('RejectLoanDialogComponent', () => {
  let dialogRefStub: {
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dialogRefStub = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RejectLoanDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            loan: {
              loanId: 'loan-1',
              amount: 50000,
              installments: 24,
              monthlyPayment: 2750,
              status: 'PendingApproval',
              requiredApprovalRole: 'Supervisor',
              requestedAt: '2026-03-20T10:00:00Z',
              loanType: 'Payroll',
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('keeps the dialog open when the reason is invalid', () => {
    const fixture = TestBed.createComponent(RejectLoanDialogComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ reason: 'short' });

    component.submit();

    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('closes the dialog with the rejection reason when the form is valid', () => {
    const fixture = TestBed.createComponent(RejectLoanDialogComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ reason: 'Insufficient repayment capacity' });

    component.submit();

    expect(dialogRefStub.close).toHaveBeenCalledWith('Insufficient repayment capacity');
  });

  it('closes the dialog without a payload when cancelled', () => {
    const fixture = TestBed.createComponent(RejectLoanDialogComponent);
    const component = fixture.componentInstance;

    component.close();

    expect(dialogRefStub.close).toHaveBeenCalledWith();
  });
});
