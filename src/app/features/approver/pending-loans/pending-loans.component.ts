import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LoanService } from '../../../core/services/loan.service';
import { AiAnalysisStatus, LoanSummary, LoanApprovalDetails } from '../../../core/models/loan.model';
import { RejectLoanDialogComponent } from './reject-loan-dialog.component';
import { DocumentService } from '../../../core/services/document.service';
import { LoanDocument } from '../../../core/models/loan-document.model';

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
  aiRetrying = signal(false);

  constructor(
    private loanService: LoanService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadLoans();
  }
  aiRetryCooldown = signal(0);

  retryAiAnalysis(loanId: string) {
    this.aiRetrying.set(true);
    this.loanService.retryAiAnalysis(loanId).subscribe({
      next: (result) => {
        this.selectedDetail.update((d) =>
          d
            ? {
                ...d,
                loanSummary: {
                  ...d.loanSummary,
                  aiAnalysisStatus: result.aiAnalysisStatus,
                  aiAnalysisRequestedAt: new Date().toISOString(),
                },
              }
            : d,
        );
        this.aiRetrying.set(false);
        this.startCooldown();
      },
      error: () => {
        this.selectedDetail.update((d) =>
          d
            ? {
                ...d,
                loanSummary: {
                  ...d.loanSummary,
                  aiAnalysisRequestedAt: new Date().toISOString(),
                },
              }
            : d,
        );
        this.aiRetrying.set(false);
        this.startCooldown();
      },
    });
  }

  private startCooldown() {
    this.aiRetryCooldown.set(10);
    const interval = setInterval(() => {
      this.aiRetryCooldown.update((v) => {
        if (v <= 1) {
          clearInterval(interval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
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

  private documentService = inject(DocumentService);
  loanDocuments = signal<LoanDocument[]>([]);
  downloadingDoc = signal<string | null>(null);

  openDetail(loan: LoanSummary) {
    this.detailLoading.set(true);
    this.viewState.set('detail');
    this.selectedDetail.set(null);
    this.loanDocuments.set([]);

    this.loanService.getApprovalDetails(loan.loanId).subscribe({
      next: (detail) => {
        this.selectedDetail.set(detail);
        this.detailLoading.set(false);
        this.loadLoanDocuments(loan.loanId);
      },
      error: () => {
        this.errorMessage.set('Failed to load loan details.');
        this.detailLoading.set(false);
        this.viewState.set('list');
      },
    });
  }

  private loadLoanDocuments(loanId: string) {
    this.documentService.getDocuments(loanId).subscribe({
      next: (docs) => this.loanDocuments.set(docs),
      error: () => {},
    });
  }

  downloadDocument(doc: LoanDocument) {
    this.downloadingDoc.set(doc.documentId);
    this.documentService
      .getDownloadUrl(this.selectedDetail()!.loanSummary.loanId, doc.documentId)
      .subscribe({
        next: (result) => {
          window.open(result.downloadUri, '_blank');
          this.downloadingDoc.set(null);
        },
        error: () => this.downloadingDoc.set(null),
      });
  }

  getFileIcon(contentType: string): string {
    if (contentType === 'application/pdf') return 'picture_as_pdf';
    if (contentType.startsWith('image/')) return 'image';
    return 'insert_drive_file';
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  getMarginUsageClass(usage: number): string {
    if (usage > 1) return 'usage-critical';
    if (usage > 0.7) return 'usage-high';
    if (usage > 0.4) return 'usage-medium';
    return 'usage-low';
  }

  getProfitMarginClass(margin: number): string {
    if (margin >= 0.1) return 'margin-high';
    if (margin >= 0.05) return 'margin-mid';
    return 'margin-low';
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

  getDecisionSummary(detail: LoanApprovalDetails): string {
    const margin = detail.bankProfitabilityView.estimatedProfitMargin;
    const profitStatus = this.getProfitabilityStatus(margin);
    const payroll = detail.payrollSummary;

    if (profitStatus === 'negative') {
      if (payroll && this.getPayrollCommitmentLevel(payroll.marginUsageAfterApproval) === 'high') {
        return 'Negative profitability and high payroll commitment — this loan is expected to generate a loss and poses significant risk.';
      }
      return 'Negative profitability — this loan is expected to generate a loss. Review carefully before approving.';
    }

    if (profitStatus === 'low') {
      if (payroll && this.getPayrollCommitmentLevel(payroll.marginUsageAfterApproval) === 'high') {
        return 'High payroll commitment and low profitability — approval should be carefully considered.';
      }
      return 'Low profitability margin — consider the risk before approving.';
    }

    if (payroll && this.getPayrollCommitmentLevel(payroll.marginUsageAfterApproval) === 'high') {
      return 'Good profitability but high payroll commitment — monitor repayment capacity.';
    }

    return 'Healthy profitability and acceptable risk profile — loan appears viable for approval.';
  }

  getDecisionSummaryClass(detail: LoanApprovalDetails): string {
    const margin = detail.bankProfitabilityView.estimatedProfitMargin;
    const profitStatus = this.getProfitabilityStatus(margin);
    const payroll = detail.payrollSummary;
    const highPayroll =
      payroll && this.getPayrollCommitmentLevel(payroll.marginUsageAfterApproval) === 'high';

    if (profitStatus === 'negative') return 'summary-negative';
    if (profitStatus === 'low' || highPayroll) return 'summary-warning';
    return 'summary-positive';
  }

  getRiskDrivers(detail: LoanApprovalDetails): string[] {
    const drivers: string[] = [];
    const margin = detail.bankProfitabilityView.estimatedProfitMargin;
    const payroll = detail.payrollSummary;

    if (margin < 0) drivers.push('Negative profitability — loan generates a loss');
    else if (margin < 0.02)
      drivers.push('Low profitability margin (' + (margin * 100).toFixed(2) + '%)');

    if (payroll) {
      const level = this.getPayrollCommitmentLevel(payroll.marginUsageAfterApproval);
      if (level === 'high')
        drivers.push(
          'High payroll commitment (' + (payroll.marginUsageAfterApproval * 100).toFixed(2) + '%)',
        );
      else if (level === 'medium')
        drivers.push(
          'Medium payroll commitment (' +
            (payroll.marginUsageAfterApproval * 100).toFixed(2) +
            '%)',
        );
      if (payroll.remainingPayrollMargin < 0)
        drivers.push('Payroll margin exceeded after approval');
    }

    if (detail.loanSummary.amount >= 50000)
      drivers.push('High loan amount — requires careful review');

    return drivers;
  }

  getAiCardClass(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'ai-card-pending';
      case 'Completed':
        return 'ai-card-completed';
      case 'Failed':
        return 'ai-card-failed';
      default:
        return '';
    }
  }

  getAiBadgeClass(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'ai-badge-pending';
      case 'Completed':
        return 'ai-badge-completed';
      case 'Failed':
        return 'ai-badge-failed';
      default:
        return '';
    }
  }

  getAiIcon(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'hourglass_empty';
      case 'Completed':
        return 'check_circle';
      case 'Failed':
        return 'cloud_off';
      default:
        return 'info';
    }
  }

  getAiStatusLabel(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'Processing':
        return 'Processing';
      case 'Completed':
        return 'Completed';
      case 'Failed':
        return 'Temporarily unavailable';
      default:
        return '';
    }
  }

  getAiMessage(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'AI risk analysis in progress. This may take a few moments.';
      case 'Completed':
        return 'AI risk analysis completed. Results available below.';
      case 'Failed':
        return 'AI risk analysis unavailable. The loan workflow is still available, but AI insights could not be generated at this time.';
      default:
        return '';
    }
  }
}
