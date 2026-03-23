import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TransactionService } from '../../../core/services/transaction.service';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../core/models/account.model';
import { ActivatedRoute } from '@angular/router';


type OperationType = 'deposit' | 'withdraw' | 'transfer';
type ViewState = 'form' | 'confirm' | 'receipt';

interface Receipt {
  type: OperationType;
  amount: number;
  description: string;
  newBalance?: number;
  toAccountId?: string;
  date: Date;
}

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss',
})
export class TransferComponent implements OnInit {
  account = signal<Account | null>(null);
  viewState = signal<ViewState>('form');
  loading = signal(false);
  receipt = signal<Receipt | null>(null);
  pendingOperation = signal<{ type: OperationType; form: FormGroup } | null>(null);
  selectedTab = signal(0);
  errorMessage = signal('');

  depositForm: FormGroup;
  withdrawForm: FormGroup;
  transferForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.depositForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
    });

    this.withdrawForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
    });

    this.transferForm = this.fb.group({
      toAccountId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.accountService.getMyAccount().subscribe({
      next: (account) => this.account.set(account),
      error: () => this.errorMessage.set('Failed to load account. Please try again.'),
    });

    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab !== undefined) this.selectedTab.set(+tab);
    });
  }

  requestConfirm(type: OperationType) {
    const form = this.getForm(type);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.pendingOperation.set({ type, form });
    this.viewState.set('confirm');
  }

  cancelConfirm() {
    this.viewState.set('form');
    this.pendingOperation.set(null);
  }

  confirm() {
    const op = this.pendingOperation();
    if (!op || !this.account()) return;
    this.loading.set(true);

    switch (op.type) {
      case 'deposit':
        this.executeDeposit(op.form);
        break;
      case 'withdraw':
        this.executeWithdraw(op.form);
        break;
      case 'transfer':
        this.executeTransfer(op.form);
        break;
    }
  }

  private executeDeposit(form: FormGroup) {
    this.transactionService
      .deposit({
        accountId: this.account()!.id,
        amount: form.value.amount,
        description: form.value.description,
      })
      .subscribe({
        next: (result) => {
          this.account.update((a) => (a ? { ...a, balance: result.newBalance } : a));
          this.showReceipt({
            type: 'deposit',
            amount: form.value.amount,
            description: form.value.description,
            newBalance: result.newBalance,
            date: new Date(),
          });
          this.resetForm(form);
        },
        error: () => this.handleError(),
      });
  }

  private executeWithdraw(form: FormGroup) {
    this.transactionService
      .withdraw({
        accountId: this.account()!.id,
        amount: form.value.amount,
        description: form.value.description,
      })
      .subscribe({
        next: (result) => {
          this.account.update((a) => (a ? { ...a, balance: result.newBalance } : a));
          this.showReceipt({
            type: 'withdraw',
            amount: form.value.amount,
            description: form.value.description,
            newBalance: result.newBalance,
            date: new Date(),
          });
          this.resetForm(form);
        },
        error: () => this.handleError(),
      });
  }

  private executeTransfer(form: FormGroup) {
    this.transactionService
      .transfer({
        fromAccountId: this.account()!.id,
        toAccountId: form.value.toAccountId,
        amount: form.value.amount,
        description: form.value.description,
      })
      .subscribe({
        next: () => {
          this.accountService.getMyAccount().subscribe({
            next: (account) => this.account.set(account),
          });
          this.showReceipt({
            type: 'transfer',
            amount: form.value.amount,
            description: form.value.description,
            toAccountId: form.value.toAccountId,
            date: new Date(),
          });
          this.resetForm(form);
        },
        error: () => this.handleError(),
      });
  }

  private showReceipt(data: Receipt) {
    this.receipt.set(data);
    this.loading.set(false);
    this.pendingOperation.set(null);
    this.viewState.set('receipt');
  }

  private handleError() {
    this.loading.set(false);
    this.viewState.set('form');
    this.pendingOperation.set(null);
  }

  newTransaction() {
    this.viewState.set('form');
    this.receipt.set(null);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  private getForm(type: OperationType): FormGroup {
    switch (type) {
      case 'deposit':
        return this.depositForm;
      case 'withdraw':
        return this.withdrawForm;
      case 'transfer':
        return this.transferForm;
    }
  }

  private resetForm(form: FormGroup) {
    form.reset();
    form.markAsUntouched();
    form.markAsPristine();
  }

  getOperationLabel(type: OperationType): string {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'transfer':
        return 'Transfer';
    }
  }

  getOperationIcon(type: OperationType): string {
    switch (type) {
      case 'deposit':
        return 'arrow_downward';
      case 'withdraw':
        return 'arrow_upward';
      case 'transfer':
        return 'swap_horiz';
    }
  }
}
