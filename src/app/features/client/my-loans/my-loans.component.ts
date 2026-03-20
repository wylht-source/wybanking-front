import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LoanService } from '../../../core/services/loan.service';
import { LoanSummary } from '../../../core/models/loan.model';
import { CancelLoanDialogComponent } from './cancel-loan-dialog.component';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './my-loans.component.html',
  styleUrl: './my-loans.component.scss',
})
export class MyLoansComponent implements OnInit {
  loans = signal<LoanSummary[]>([]);
  loading = signal(true);
  errorMessage = signal('');
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
    this.loanService.getMyLoans(this.page(), this.pageSize).subscribe({
      next: (result) => {
        this.loans.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load loans.');
        this.loading.set(false);
      },
    });
  }

  confirmCancel(loan: LoanSummary) {
    const ref = this.dialog.open(CancelLoanDialogComponent, {
      width: '400px',
      data: { loan },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.cancelLoan(loan.loanId);
    });
  }

  private cancelLoan(id: string) {
    this.loanService.cancelLoan(id).subscribe({
      next: () => this.loadLoans(),
      error: () => this.errorMessage.set('Failed to cancel loan. Please try again.'),
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'badge-approved';
      case 'Rejected':
        return 'badge-rejected';
      case 'Cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }
}
