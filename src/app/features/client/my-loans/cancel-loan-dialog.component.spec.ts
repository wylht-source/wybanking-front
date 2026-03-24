import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CancelLoanDialogComponent } from './cancel-loan-dialog.component';

describe('CancelLoanDialogComponent', () => {
  let dialogRefStub: {
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    dialogRefStub = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CancelLoanDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            loan: {
              loanId: 'loan-1',
              amount: 12000,
              installments: 12,
              monthlyPayment: 1100,
              status: 'PendingApproval',
              requiredApprovalRole: 'Manager',
              requestedAt: '2026-03-20T10:00:00Z',
              loanType: 'Personal',
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('closes the dialog with false when keeping the loan request', () => {
    const fixture = TestBed.createComponent(CancelLoanDialogComponent);
    const component = fixture.componentInstance;

    component.close(false);

    expect(dialogRefStub.close).toHaveBeenCalledWith(false);
  });

  it('closes the dialog with true when confirming cancellation', () => {
    const fixture = TestBed.createComponent(CancelLoanDialogComponent);
    const component = fixture.componentInstance;

    component.close(true);

    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });
});
