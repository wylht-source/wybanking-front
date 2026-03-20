import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoanService } from '../../../core/services/loan.service';
import { RequestPayrollLoanResult } from '../../../core/models/loan.model';

type ViewState = 'form' | 'review' | 'success';

@Component({
  selector: 'app-request-payroll-loan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './request-payroll-loan.component.html',
  styleUrl: './request-payroll-loan.component.scss',
})
export class RequestPayrollLoanComponent {
  form: FormGroup;
  viewState = signal<ViewState>('form');
  submitting = signal(false);
  result = signal<RequestPayrollLoanResult | null>(null);
  errorMessage = signal('');

  installmentOptions = [6, 12, 24, 36, 48, 60, 72];
  selectedInstallments = signal(24);

  private readonly monthlyRate = 0.009;

  employmentStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'OnLeave', label: 'On Leave' },
  ];

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1000), Validators.max(80000)]],
      employerName: ['', Validators.required],
      monthlySalary: [null, [Validators.required, Validators.min(1)]],
      employmentStatus: ['Active', Validators.required],
      existingPayrollDeductions: [0, [Validators.required, Validators.min(0)]],
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

  estimatedTotal(): number {
    return Math.round(this.estimatedMonthly() * this.selectedInstallments() * 100) / 100;
  }

  estimatedInterest(): number {
    return Math.round((this.estimatedTotal() - (this.form.get('amount')?.value ?? 0)) * 100) / 100;
  }

  payrollMarginLimit(): number {
    const salary = this.form.get('monthlySalary')?.value ?? 0;
    return Math.round(salary * 0.35 * 100) / 100;
  }

  availableMargin(): number {
    const deductions = this.form.get('existingPayrollDeductions')?.value ?? 0;
    return Math.round((this.payrollMarginLimit() - deductions) * 100) / 100;
  }

  marginAfterApproval(): number {
    return Math.round((this.availableMargin() - this.estimatedMonthly()) * 100) / 100;
  }

  marginUsage(): number {
    const salary = this.form.get('monthlySalary')?.value ?? 0;
    if (!salary) return 0;
    return Math.round((this.estimatedMonthly() / salary) * 10000) / 10000;
  }

  isMarginSufficient(): boolean {
    return this.availableMargin() >= this.estimatedMonthly();
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
      .requestPayrollLoan({
        amount: this.form.value.amount,
        installments: this.selectedInstallments(),
        employerName: this.form.value.employerName,
        monthlySalary: this.form.value.monthlySalary,
        employmentStatus: this.form.value.employmentStatus,
        existingPayrollDeductions: this.form.value.existingPayrollDeductions,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.submitting.set(false);
          this.viewState.set('success');
        },
        error: (err) => {
          const message = err?.error?.error ?? 'Failed to request payroll loan. Please try again.';
          this.errorMessage.set(message);
          this.submitting.set(false);
          this.viewState.set('form');
        },
      });
  }

  newRequest() {
    this.result.set(null);
    this.errorMessage.set('');
    this.form.reset({ employmentStatus: 'Active', existingPayrollDeductions: 0 });
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.selectedInstallments.set(24);
    this.viewState.set('form');
  }
  suggestedMaxAmount(): number {
    const n = this.selectedInstallments();
    const margin = this.availableMargin();
    if (margin <= 0) return 0;
    const raw = (margin * (Math.pow(1 + this.monthlyRate, n) - 1)) /
      (this.monthlyRate * Math.pow(1 + this.monthlyRate, n));
    return Math.floor(raw / 100) * 100;
  }

  marginUsagePercent(): number {
    const margin = this.availableMargin();
    if (!margin || margin <= 0) return 0;
    return Math.round((this.estimatedMonthly() / margin) * 10000) / 100;
  }
  isEmploymentActive(): boolean {
    return this.form.get('employmentStatus')?.value === 'Active';
  }
}
