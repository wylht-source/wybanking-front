import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TransferComponent } from './transfer.component';
import { AccountService } from '../../../core/services/account.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Account } from '../../../core/models/account.model';

describe('TransferComponent', () => {
  let router: Router;
  let queryParams$: BehaviorSubject<Record<string, unknown>>;
  let accountServiceStub: {
    getMyAccount: ReturnType<typeof vi.fn>;
  };
  let transactionServiceStub: {
    deposit: ReturnType<typeof vi.fn>;
    withdraw: ReturnType<typeof vi.fn>;
    transfer: ReturnType<typeof vi.fn>;
  };

  const account: Account = {
    id: 'account-1',
    accountNumber: '000123-4',
    ownerName: 'Serge Junior',
    balance: 1000,
    createdAt: '2026-03-20T10:00:00Z',
  };

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, unknown>>({});

    accountServiceStub = {
      getMyAccount: vi.fn().mockReturnValue(of(account)),
    };

    transactionServiceStub = {
      deposit: vi.fn(),
      withdraw: vi.fn(),
      transfer: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TransferComponent],
      providers: [
        provideRouter([]),
        { provide: AccountService, useValue: accountServiceStub },
        { provide: TransactionService, useValue: transactionServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('loads the account and syncs the selected tab from query params on init', () => {
    queryParams$.next({ tab: '2' });
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(accountServiceStub.getMyAccount).toHaveBeenCalled();
    expect(component.account()).toEqual(account);
    expect(component.selectedTab()).toBe(2);
  });

  it('keeps the user on the form and marks fields as touched when the requested operation form is invalid', () => {
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;

    component.requestConfirm('deposit');

    expect(component.viewState()).toBe('form');
    expect(component.pendingOperation()).toBeNull();
    expect(component.depositForm.get('amount')?.touched).toBe(true);
  });

  it('stores the pending operation and moves to confirmation for a valid deposit', () => {
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    component.depositForm.setValue({ amount: 150, description: 'Cash in' });

    component.requestConfirm('deposit');

    expect(component.viewState()).toBe('confirm');
    expect(component.pendingOperation()?.type).toBe('deposit');
    expect(component.pendingOperation()?.form).toBe(component.depositForm);
  });

  it('returns to the form and clears the pending operation when confirmation is cancelled', () => {
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    component.depositForm.setValue({ amount: 150, description: 'Cash in' });
    component.requestConfirm('deposit');

    component.cancelConfirm();

    expect(component.viewState()).toBe('form');
    expect(component.pendingOperation()).toBeNull();
  });

  it('does nothing when confirm is triggered without a pending operation', () => {
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;

    component.confirm();

    expect(component.loading()).toBe(false);
    expect(transactionServiceStub.deposit).not.toHaveBeenCalled();
    expect(transactionServiceStub.withdraw).not.toHaveBeenCalled();
    expect(transactionServiceStub.transfer).not.toHaveBeenCalled();
  });

  it('executes a deposit, updates the balance, shows the receipt and resets the form', () => {
    transactionServiceStub.deposit.mockReturnValue(
      of({
        transactionId: 'tx-1',
        newBalance: 1150,
        wasDuplicate: false,
      }),
    );
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.depositForm.setValue({ amount: 150, description: 'Cash in' });
    component.requestConfirm('deposit');

    component.confirm();

    expect(transactionServiceStub.deposit).toHaveBeenCalledWith({
      accountId: 'account-1',
      amount: 150,
      description: 'Cash in',
    });
    expect(component.account()?.balance).toBe(1150);
    expect(component.receipt()?.type).toBe('deposit');
    expect(component.receipt()?.newBalance).toBe(1150);
    expect(component.viewState()).toBe('receipt');
    expect(component.loading()).toBe(false);
    expect(component.pendingOperation()).toBeNull();
    expect(component.depositForm.get('amount')?.value).toBeNull();
    expect(component.depositForm.pristine).toBe(true);
  });

  it('executes a withdrawal, updates the balance and shows the receipt', () => {
    transactionServiceStub.withdraw.mockReturnValue(
      of({
        transactionId: 'tx-2',
        newBalance: 800,
        wasDuplicate: false,
      }),
    );
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.withdrawForm.setValue({ amount: 200, description: 'ATM' });
    component.requestConfirm('withdraw');

    component.confirm();

    expect(transactionServiceStub.withdraw).toHaveBeenCalledWith({
      accountId: 'account-1',
      amount: 200,
      description: 'ATM',
    });
    expect(component.account()?.balance).toBe(800);
    expect(component.receipt()?.type).toBe('withdraw');
    expect(component.receipt()?.newBalance).toBe(800);
    expect(component.viewState()).toBe('receipt');
  });

  it('executes a transfer, reloads the account and shows the receipt', () => {
    transactionServiceStub.transfer.mockReturnValue(
      of({
        transactionId: 'tx-3',
        newBalance: 0,
        wasDuplicate: false,
      }),
    );
    accountServiceStub.getMyAccount
      .mockReturnValueOnce(of(account))
      .mockReturnValueOnce(of({ ...account, balance: 700 }));
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.transferForm.setValue({
      toAccountId: 'account-2',
      amount: 300,
      description: 'Rent',
    });
    component.requestConfirm('transfer');

    component.confirm();

    expect(transactionServiceStub.transfer).toHaveBeenCalledWith({
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      amount: 300,
      description: 'Rent',
    });
    expect(accountServiceStub.getMyAccount).toHaveBeenCalledTimes(2);
    expect(component.account()?.balance).toBe(700);
    expect(component.receipt()?.type).toBe('transfer');
    expect(component.receipt()?.toAccountId).toBe('account-2');
    expect(component.receipt()?.newBalance).toBeUndefined();
    expect(component.viewState()).toBe('receipt');
  });

  it('returns to the form and clears the pending operation when a transaction fails', () => {
    transactionServiceStub.transfer.mockReturnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.transferForm.setValue({
      toAccountId: 'account-2',
      amount: 300,
      description: 'Rent',
    });
    component.requestConfirm('transfer');

    component.confirm();

    expect(component.loading()).toBe(false);
    expect(component.viewState()).toBe('form');
    expect(component.pendingOperation()).toBeNull();
    expect(component.receipt()).toBeNull();
  });

  it('starts a new transaction flow and navigates back to the dashboard', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;
    component.receipt.set({
      type: 'deposit',
      amount: 100,
      description: 'Cash in',
      newBalance: 1100,
      date: new Date(),
    });
    component.viewState.set('receipt');

    component.newTransaction();
    expect(component.viewState()).toBe('form');
    expect(component.receipt()).toBeNull();

    component.goToDashboard();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('maps operation helpers to the expected labels and icons', () => {
    const fixture = TestBed.createComponent(TransferComponent);
    const component = fixture.componentInstance;

    expect(component.getOperationLabel('deposit')).toBe('Deposit');
    expect(component.getOperationLabel('withdraw')).toBe('Withdrawal');
    expect(component.getOperationLabel('transfer')).toBe('Transfer');
    expect(component.getOperationIcon('deposit')).toBe('arrow_downward');
    expect(component.getOperationIcon('withdraw')).toBe('arrow_upward');
    expect(component.getOperationIcon('transfer')).toBe('swap_horiz');
  });
});
