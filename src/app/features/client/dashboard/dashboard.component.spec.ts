import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AccountService } from '../../../core/services/account.service';
import { AuthService, AuthUser } from '../../../core/auth/auth.service';
import { Account } from '../../../core/models/account.model';
import { Transaction } from '../../../core/models/transaction.model';

describe('DashboardComponent', () => {
  let router: Router;
  let accountServiceStub: {
    getMyAccount: ReturnType<typeof vi.fn>;
    getStatement: ReturnType<typeof vi.fn>;
    createAccount: ReturnType<typeof vi.fn>;
  };
  let authServiceStub: {
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
  };

  const account: Account = {
    id: 'account-1',
    accountNumber: '000123-4',
    ownerName: 'Serge Junior',
    balance: 1250.75,
    createdAt: '2026-03-20T10:00:00Z',
  };

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'Deposit',
      amount: 500,
      description: 'Initial deposit',
      createdAt: '2026-03-20T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    accountServiceStub = {
      getMyAccount: vi.fn(),
      getStatement: vi.fn(),
      createAccount: vi.fn(),
    };

    authServiceStub = {
      currentUser: signal<AuthUser | null>({
        userId: 'user-1',
        email: 'serge@example.com',
        name: 'Serge Junior',
        role: 'Client',
      }),
    };

    accountServiceStub.getMyAccount.mockReturnValue(of(account));
    accountServiceStub.getStatement.mockReturnValue(
      of({
        items: transactions,
        page: 1,
        pageSize: 5,
        totalCount: 1,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: accountServiceStub },
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('loads the account and recent transactions on init', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(accountServiceStub.getMyAccount).toHaveBeenCalled();
    expect(accountServiceStub.getStatement).toHaveBeenCalledWith('account-1', 1, 5);
    expect(component.account()).toEqual(account);
    expect(component.transactions()).toEqual(transactions);
    expect(component.loading()).toBe(false);
  });

  it('stops loading and keeps the empty-account state when account lookup fails with a non-server error', () => {
    accountServiceStub.getMyAccount.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.account()).toBeNull();
    expect(component.errorMessage()).toBe('');
    expect(component.loading()).toBe(false);
  });

  it('shows a server error message when account lookup fails with status 500', () => {
    accountServiceStub.getMyAccount.mockReturnValueOnce(throwError(() => ({ status: 500 })));
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Server error. Please try again later.');
    expect(component.loading()).toBe(false);
  });

  it('finishes loading even when statement retrieval fails', () => {
    accountServiceStub.getStatement.mockReturnValueOnce(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.account()).toEqual(account);
    expect(component.transactions()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('creates an account using the current user name', () => {
    accountServiceStub.getMyAccount.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    accountServiceStub.createAccount.mockReturnValue(of(account));
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.createAccount();

    expect(accountServiceStub.createAccount).toHaveBeenCalledWith({ ownerName: 'Serge Junior' });
    expect(component.account()).toEqual(account);
    expect(component.creatingAccount()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  it('falls back to a generic owner name and shows an error when account creation fails', () => {
    accountServiceStub.getMyAccount.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    authServiceStub.currentUser.set(null);
    accountServiceStub.createAccount.mockReturnValueOnce(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.createAccount();

    expect(accountServiceStub.createAccount).toHaveBeenCalledWith({ ownerName: 'Account Owner' });
    expect(component.errorMessage()).toBe('Failed to create account. Please try again.');
    expect(component.creatingAccount()).toBe(false);
  });

  it('toggles balance visibility', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component.balanceVisible()).toBe(true);

    component.toggleBalance();
    expect(component.balanceVisible()).toBe(false);

    component.toggleBalance();
    expect(component.balanceVisible()).toBe(true);
  });

  it('navigates with query params when a tab is provided', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.navigateTo('/transfer', 2);

    expect(navigateSpy).toHaveBeenCalledWith(['/transfer'], { queryParams: { tab: 2 } });
  });

  it('navigates without query params when no tab is provided', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.navigateTo('/request-loan');

    expect(navigateSpy).toHaveBeenCalledWith(['/request-loan'], {});
  });

  it('maps transaction helpers to the expected icons, classes and signs', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component.getTransactionIcon('Deposit')).toBe('arrow_downward');
    expect(component.getTransactionIcon('Withdrawal')).toBe('arrow_upward');
    expect(component.getTransactionIcon('Transfer')).toBe('swap_horiz');
    expect(component.getTransactionIcon('Other')).toBe('receipt');

    expect(component.getTransactionClass('Deposit')).toBe('tx-in');
    expect(component.getTransactionClass('Withdrawal')).toBe('tx-out');
    expect(component.getTransactionClass('Transfer')).toBe('tx-transfer');
    expect(component.getTransactionClass('Other')).toBe('');

    expect(component.isPositive('Deposit')).toBe(true);
    expect(component.isPositive('Transfer')).toBe(false);
  });
});
