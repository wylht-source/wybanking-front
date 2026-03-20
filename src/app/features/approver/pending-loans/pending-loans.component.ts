import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LoanService } from '../../../core/services/loan.service';
import { LoanSummary, LoanApprovalDetails } from '../../../core/models/loan.model';
import { RejectLoanDialogComponent } from './reject-loan-dialog.component';

type ViewState = 'list' | 'detail';

@Component({
  selector: 'app-pending-loans',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './pending-loans.component.html',
  styleUrl: './pending-loans.component.scss',
})
export class PendingLoansComponent implements OnInit {
  viewState = signal<ViewState>('list');
  loans = signal<LoanSummary[]>([]);
  selectedDetail = signal<LoanApprovalDetails | null>(null);
  loading = signal(true);
  detailLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  page = signal(1);
  totalCount = signal(0);
  readonly pageSize = 10;

  constructor(
    private loanService: LoanService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);
    this.loanService.getPendingLoans(this.page(), this.pageSize).subscribe({
      next: (result) => {
        this.loans.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load pending loans.');
        this.loading.set(false);
      },
    });
  }

  openDetail(loan: LoanSummary) {
    this.detailLoading.set(true);
    this.viewState.set('detail');
    this.selectedDetail.set(null);

    this.loanService.getApprovalDetails(loan.loanId).subscribe({
      next: (detail) => {
        this.selectedDetail.set(detail);
        this.detailLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load loan details.');
        this.detailLoading.set(false);
        this.viewState.set('list');
      },
    });
  }

  backToList() {
    this.viewState.set('list');
    this.selectedDetail.set(null);
    this.clearMessages();
  }

  approveLoan(loanId: string) {
    this.clearMessages();
    this.loanService.approveLoan(loanId).subscribe({
      next: () => {
        this.successMessage.set('Loan approved successfully.');
        this.viewState.set('list');
        this.selectedDetail.set(null);
        this.loadLoans();
      },
      error: () => this.errorMessage.set('Failed to approve loan. Please try again.'),
    });
  }

  openRejectDialog(loanId: string, amount: number) {
    const ref = this.dialog.open(RejectLoanDialogComponent, {
      width: '440px',
      data: { loan: { loanId, amount } },
    });

    ref.afterClosed().subscribe((reason: string | undefined) => {
      if (reason) this.rejectLoan(loanId, reason);
    });
  }

  private rejectLoan(loanId: string, reason: string) {
    this.clearMessages();
    this.loanService.rejectLoan(loanId, { reason }).subscribe({
      next: () => {
        this.successMessage.set('Loan rejected.');
        this.viewState.set('list');
        this.selectedDetail.set(null);
        this.loadLoans();
      },
      error: () => this.errorMessage.set('Failed to reject loan. Please try again.'),
    });
  }

  nextPage() {
    this.page.update((p) => p + 1);
    this.loadLoans();
  }
  prevPage() {
    this.page.update((p) => p - 1);
    this.loadLoans();
  }
  get hasNextPage(): boolean {
    return this.page() * this.pageSize < this.totalCount();
  }
  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
  getRiskClass(role: string): string {
    switch (role) {
      case 'Manager':
        return 'risk-low';
      case 'Supervisor':
        return 'risk-medium';
      case 'CreditCommittee':
        return 'risk-high';
      default:
        return 'risk-low';
    }
  }

  getRiskLabel(role: string): string {
    switch (role) {
      case 'Manager':
        return 'Low risk';
      case 'Supervisor':
        return 'Medium risk';
      case 'CreditCommittee':
        return 'High risk';
      default:
        return 'Low risk';
    }
  }

  getProfitMarginClass(margin: number): string {
    if (margin >= 0.1) return 'margin-high';
    if (margin >= 0.05) return 'margin-mid';
    return 'margin-low';
  }
}
