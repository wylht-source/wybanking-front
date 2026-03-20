import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoanService } from '../../../core/services/loan.service';
import { LoanSummary, LoanApprovalDetails } from '../../../core/models/loan.model';

type ViewState = 'list' | 'detail';

@Component({
  selector: 'app-decided-loans',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './decided-loans.component.html',
  styleUrl: './decided-loans.component.scss',
})
export class DecidedLoansComponent implements OnInit {
  viewState = signal<ViewState>('list');
  loans = signal<LoanSummary[]>([]);
  selectedDetail = signal<LoanApprovalDetails | null>(null);
  loading = signal(true);
  detailLoading = signal(false);
  errorMessage = signal('');
  page = signal(1);
  totalCount = signal(0);
  readonly pageSize = 20;

  constructor(private loanService: LoanService) {}

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);
    this.loanService.getDecidedLoans(this.page(), this.pageSize).subscribe({
      next: (result) => {
        this.loans.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load reviewed loans.');
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
    this.errorMessage.set('');
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
      default:
        return 'badge-pending';
    }
  }

  getDecisionInfo(detail: LoanApprovalDetails) {
    const history = detail.workflowHistory;
    const final = [...history]
      .reverse()
      .find((h) => h.action === 'Approved' || h.action === 'Rejected');
    return final ?? null;
  }

  getProfitabilityStatus(margin: number): 'negative' | 'low' | 'good' {
    if (margin < 0) return 'negative';
    if (margin < 0.02) return 'low';
    return 'good';
  }

  getProfitabilityBadgeClass(margin: number): string {
    switch (this.getProfitabilityStatus(margin)) {
      case 'negative':
        return 'badge-negative';
      case 'low':
        return 'badge-low';
      default:
        return 'badge-good';
    }
  }

  getProfitabilityBadgeText(margin: number): string {
    const pct = (margin * 100).toFixed(2);
    switch (this.getProfitabilityStatus(margin)) {
      case 'negative':
        return `Negative profitability (${pct}% margin)`;
      case 'low':
        return `Low profitability (${pct}% margin)`;
      default:
        return `Good profitability (${pct}% margin)`;
    }
  }

  getPayrollCommitmentLevel(usage: number): 'low' | 'medium' | 'high' {
    if (usage < 0.3) return 'low';
    if (usage <= 0.6) return 'medium';
    return 'high';
  }

  getPayrollCommitmentClass(usage: number): string {
    switch (this.getPayrollCommitmentLevel(usage)) {
      case 'low':
        return 'commitment-low';
      case 'medium':
        return 'commitment-medium';
      default:
        return 'commitment-high';
    }
  }

  getPayrollCommitmentLabel(usage: number): string {
    const level = this.getPayrollCommitmentLevel(usage);
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
}
