import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Account } from '../../../core/models/account.model';
import { Transaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);

  account = signal<Account | null>(null);
  transactions = signal<Transaction[]>([]);
  loading = signal(true);
  creatingAccount = signal(false);
  balanceVisible = signal(true);
  errorMessage = signal('');

  user = this.authService.currentUser;

  // remova o constructor inteiro
  ngOnInit() {
    this.loadMyAccount();
  }

  private loadMyAccount() {
    this.loading.set(true);
    this.accountService.getMyAccount().subscribe({
      next: (account) => {
        this.account.set(account);
        this.loadStatement(account.id);
      },
      error: (err) => {
        // 404 = no account yet, 0 = network/CORS — both show create account screen
        if (err.status === 500) {
          this.errorMessage.set('Server error. Please try again later.');
        }
        this.loading.set(false);
      },
    });
  }

  private loadStatement(id: string) {
    this.accountService.getStatement(id, 1, 5).subscribe({
      next: (result) => {
        this.transactions.set(result.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createAccount() {
    this.creatingAccount.set(true);
    this.errorMessage.set('');
    const ownerName = this.user()?.name ?? 'Account Owner';

    this.accountService.createAccount({ ownerName }).subscribe({
      next: (account) => {
        this.account.set(account);
        this.creatingAccount.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to create account. Please try again.');
        this.creatingAccount.set(false);
      },
    });
  }

  toggleBalance() {
    this.balanceVisible.update((v) => !v);
  }

  navigateTo(path: string, tab?: number) {
    this.router.navigate([path], tab !== undefined ? { queryParams: { tab } } : {});
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'Deposit':
        return 'arrow_downward';
      case 'Withdrawal':
        return 'arrow_upward';
      case 'Transfer':
        return 'swap_horiz';
      default:
        return 'receipt';
    }
  }

  getTransactionClass(type: string): string {
    switch (type) {
      case 'Deposit':
        return 'tx-in';
      case 'Withdrawal':
        return 'tx-out';
      case 'Transfer':
        return 'tx-transfer';
      default:
        return '';
    }
  }

  isPositive(type: string): boolean {
    return type === 'Deposit';
  }
}
