import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoanService } from '../../../core/services/loan.service';
import { RequestLoanResult } from '../../../core/models/loan.model';

type ViewState = 'form' | 'review' | 'success';

@Component({
  selector: 'app-request-loan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './request-loan.component.html',
  styleUrl: './request-loan.component.scss',
})
export class RequestLoanComponent {
  form: FormGroup;
  viewState = signal<ViewState>('form');
  submitting = signal(false);
  result = signal<RequestLoanResult | null>(null);
  errorMessage = signal('');

  installmentOptions = [6, 12, 24, 36];
  selectedInstallments = signal(12);

  private readonly monthlyRate = 0.015;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1000)]],
    });
  }

  selectInstallments(value: number) {
    this.selectedInstallments.set(value);
  }

  estimatedMonthly(): number {
    const amount = this.form.get('amount')?.value;
    if (!amount || amount <= 0) return 0;
    const n = this.selectedInstallments();
    const raw =
      (amount * this.monthlyRate * Math.pow(1 + this.monthlyRate, n)) /
      (Math.pow(1 + this.monthlyRate, n) - 1);
    return Math.round(raw * 100) / 100;
  }

  getInstallmentDate(installmentNumber: number): Date {
    const date = this.firstPaymentDate();
    date.setMonth(date.getMonth() + installmentNumber - 1);
    return date;
  }

  getRequiredRole(): string {
    const amount = this.form.get('amount')?.value ?? 0;
    if (amount >= 50000) return 'Credit Committee';
    if (amount >= 10000) return 'Supervisor';
    return 'Manager';
  }

  estimatedTotal(): number {
    return Math.round(this.estimatedMonthly() * this.selectedInstallments() * 100) / 100;
  }

  estimatedInterest(): number {
    return Math.round((this.estimatedTotal() - (this.form.get('amount')?.value ?? 0)) * 100) / 100;
  }

  firstPaymentDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  lastPaymentDate(): Date {
    const date = this.firstPaymentDate();
    date.setMonth(date.getMonth() + this.selectedInstallments() - 1);
    return date;
  }

  // confirmed result values
  resultTotal(): number {
    return this.result() ? this.result()!.monthlyPayment * this.result()!.installments : 0;
  }

  resultInterest(): number {
    return this.result() ? this.resultTotal() - this.result()!.amount : 0;
  }

  goToReview() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set('');
    this.viewState.set('review');
  }

  backToForm() {
    this.viewState.set('form');
  }

  onSubmit() {
    this.submitting.set(true);
    this.errorMessage.set('');

    this.loanService
      .requestLoan({
        amount: this.form.value.amount,
        installments: this.selectedInstallments(),
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.submitting.set(false);
          this.viewState.set('success');
        },
        error: (err) => {
          const message =
            err?.error?.error ??
            err?.error?.errors?.[0] ??
            'Failed to request loan. Please try again.';
          this.errorMessage.set(message);
          this.submitting.set(false);
          this.viewState.set('form');
        },
      });
  }

  newRequest() {
    this.result.set(null);
    this.errorMessage.set('');
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.selectedInstallments.set(12);
    this.viewState.set('form');
  }
}
