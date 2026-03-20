import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoanSummary } from '../../../core/models/loan.model';

@Component({
  selector: 'app-reject-loan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  template: `
    <div class="dialog">
      <h3>Reject loan request</h3>
      <p>
        Rejecting loan of
        <strong>{{ data.loan.amount | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
        >. Please provide a reason — this will be visible to the client.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Rejection reason</mat-label>
          <textarea
            matInput
            formControlName="reason"
            rows="3"
            placeholder="e.g. Insufficient credit history..."
          >
          </textarea>
          @if (form.get('reason')?.hasError('minlength')) {
            <mat-error>Reason must be at least 10 characters</mat-error>
          }
          @if (form.get('reason')?.hasError('required')) {
            <mat-error>Reason is required</mat-error>
          }
        </mat-form-field>

        <div class="dialog-actions">
          <button type="button" mat-button (click)="close()">Cancel</button>
          <button type="submit" mat-flat-button class="reject-btn" [disabled]="form.invalid">
            Reject loan
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .dialog {
        padding: 8px;
      }
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 10px;
      }
      p {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 20px;
        line-height: 1.6;
      }
      strong {
        color: #111827;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
      }
      .reject-btn {
        background-color: #ef4444 !important;
        color: #ffffff !important;
        font-weight: 600;
        border-radius: 8px;
      }
    `,
  ],
})
export class RejectLoanDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RejectLoanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loan: LoanSummary },
  ) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.reason);
  }

  close() {
    this.dialogRef.close();
  }
}
