import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LoanService } from '../../../core/services/loan.service';
import { DocumentService } from '../../../core/services/document.service';
import { AiAnalysisStatus, LoanDetail } from '../../../core/models/loan.model';
import { LoanDocument, DocumentType } from '../../../core/models/loan-document.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './loan-detail.component.html',
  styleUrl: './loan-detail.component.scss',
})
export class LoanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanService = inject(LoanService);
  private documentService = inject(DocumentService);

  loan = signal<LoanDetail | null>(null);
  documents = signal<LoanDocument[]>([]);
  loading = signal(true);
  uploading = signal(false);
  downloading = signal<string | null>(null);
  errorMessage = signal('');
  uploadError = signal('');
  selectedDocumentType = signal<DocumentType | null>(null);

  documentTypeOptions: { value: DocumentType; label: string }[] = [
    { value: 'PaySlip', label: 'Pay Slip' },
    { value: 'IncomeProof', label: 'Income Proof' },
    { value: 'Identity', label: 'Identity Document' },
    { value: 'BankStatement', label: 'Bank Statement' },
    { value: 'Other', label: 'Other' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadLoan(id);
    this.loadDocuments(id);
  }

  private loadLoan(id: string) {
    this.loanService.getLoan(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load loan details.');
        this.loading.set(false);
      },
    });
  }

  private loadDocuments(id: string) {
    this.documentService.getDocuments(id).subscribe({
      next: (docs) => this.documents.set(docs),
      error: () => {}, // silently fail — documents are optional
    });
  }

  goBack() {
    this.router.navigate(['/my-loans']);
  }


  private uploadFile(file: File) {
    const maxSize = 10 * 1024 * 1024;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      this.uploadError.set('File exceeds the 10MB limit.');
      return;
    }

    if (!allowed.includes(file.type)) {
      this.uploadError.set('Only PDF, JPG and PNG files are allowed.');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set('');

    this.documentService
      .uploadDocument(this.loan()!.loanId, file, this.selectedDocumentType() ?? undefined)
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.loadDocuments(this.loan()!.loanId);
        },
        error: (err) => {
          this.uploadError.set(err?.error?.error ?? 'Failed to upload document.');
          this.uploading.set(false);
        },
      });
  }

  downloadDocument(doc: LoanDocument) {
    this.downloading.set(doc.documentId);
    this.documentService.getDownloadUrl(this.loan()!.loanId, doc.documentId).subscribe({
      next: (result) => {
        window.open(result.downloadUri, '_blank');
        this.downloading.set(null);
      },
      error: () => {
        this.downloading.set(null);
      },
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  totalPayable(): number {
    const loan = this.loan();
    if (!loan) return 0;
    return Math.round(loan.monthlyPayment * loan.installments * 100) / 100;
  }

  totalInterest(): number {
    const loan = this.loan();
    if (!loan) return 0;
    return Math.round((this.totalPayable() - loan.amount) * 100) / 100;
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

  getFileIcon(contentType: string): string {
    if (contentType === 'application/pdf') return 'picture_as_pdf';
    if (contentType.startsWith('image/')) return 'image';
    return 'insert_drive_file';
  }

  selectedFile = signal<File | null>(null);
  uploadSuccess = signal(false);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    const maxSize = 10 * 1024 * 1024;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      this.uploadError.set('File exceeds the 10MB limit.');
      this.selectedFile.set(null);
      return;
    }

    if (!allowed.includes(file.type)) {
      this.uploadError.set('Only PDF, JPG and PNG files are allowed.');
      this.selectedFile.set(null);
      return;
    }

    this.uploadError.set('');
    this.selectedFile.set(file);
  }

  submitUpload() {
    if (!this.selectedFile()) return;
    this.uploading.set(true);
    this.uploadError.set('');

    this.documentService.uploadDocument(
      this.loan()!.loanId,
      this.selectedFile()!,
      this.selectedDocumentType() ?? undefined
    ).subscribe({
      next: () => {
        this.uploading.set(false);
        this.selectedFile.set(null);
        this.selectedDocumentType.set(null);
        this.uploadSuccess.set(true);
        this.loadDocuments(this.loan()!.loanId);
        setTimeout(() => this.uploadSuccess.set(false), 4000);
      },
      error: (err) => {
        this.uploadError.set(err?.error?.error ?? 'Failed to upload document.');
        this.uploading.set(false);
      }
    });
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    this.uploadError.set('');
  }
  getAiCardClass(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing': return 'ai-card-pending';
      case 'Completed': return 'ai-card-completed';
      case 'Failed': return 'ai-card-failed';
      default: return '';
    }
  }

  getAiBadgeClass(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing': return 'ai-badge-pending';
      case 'Completed': return 'ai-badge-completed';
      case 'Failed': return 'ai-badge-failed';
      default: return '';
    }
  }

  getAiIcon(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing': return 'hourglass_empty';
      case 'Completed': return 'check_circle';
      case 'Failed': return 'cloud_off';
      default: return 'info';
    }
  }

  getAiStatusLabel(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'Processing': return 'Processing';
      case 'Completed': return 'Completed';
      case 'Failed': return 'Temporarily unavailable';
      default: return '';
    }
  }

  getAiMessage(status: AiAnalysisStatus): string {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'AI risk analysis is in progress for your loan request.';
      case 'Completed':
        return 'AI risk analysis has been completed for your loan request.';
      case 'Failed':
        return 'AI risk analysis is temporarily unavailable. Your loan request has been submitted and will be reviewed normally.';
      default: return '';
    }
  }
}
