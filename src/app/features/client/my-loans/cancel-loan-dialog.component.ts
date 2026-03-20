import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoanSummary } from '../../../core/models/loan.model';

@Component({
  selector: 'app-cancel-loan-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="dialog">
      <h3>Cancel loan request</h3>
      <p>Are you sure you want to cancel your loan request of
        <strong>{{ data.loan.amount | currency:'USD':'symbol':'1.2-2' }}</strong>?
        This action cannot be undone.
      </p>
      <div class="dialog-actions">
        <button mat-button (click)="close(false)">Keep it</button>
        <button mat-flat-button class="cancel-btn" (click)="close(true)">Yes, cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog { padding: 8px; }
    h3 { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px; }
    p { font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    strong { color: #111827; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .cancel-btn {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      font-weight: 600;
      border-radius: 8px;
    }
  `]
})
export class CancelLoanDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CancelLoanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loan: LoanSummary }
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
