import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { AuthService, AuthUser } from '../../../core/auth/auth.service';

describe('ShellComponent', () => {
  let authServiceStub: {
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceStub = {
      currentUser: signal<AuthUser | null>(null),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();
  });

  it('identifies client users and computes their initials', () => {
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'client@example.com',
      name: 'Serge Junior',
      role: 'Client',
    });
    const fixture = TestBed.createComponent(ShellComponent);
    const component = fixture.componentInstance;

    expect(component.isClient()).toBe(true);
    expect(component.isApprover()).toBe(false);
    expect(component.initials()).toBe('SJ');
  });

  it('identifies approver roles and excludes client navigation', () => {
    authServiceStub.currentUser.set({
      userId: 'user-2',
      email: 'manager@example.com',
      name: 'Maria Silva',
      role: 'Manager',
    });
    const fixture = TestBed.createComponent(ShellComponent);
    const component = fixture.componentInstance;

    expect(component.isClient()).toBe(false);
    expect(component.isApprover()).toBe(true);
    expect(component.initials()).toBe('MS');
  });

  it('renders client navigation items for client users', () => {
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'client@example.com',
      name: 'Serge Junior',
      role: 'Client',
    });
    const fixture = TestBed.createComponent(ShellComponent);

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Dashboard');
    expect(text).toContain('Deposit');
    expect(text).toContain('Withdraw');
    expect(text).toContain('Transfer');
    expect(text).toContain('Request Loan');
    expect(text).toContain('Payroll Loan');
    expect(text).toContain('My Loans');
    expect(text).not.toContain('Pending Loans');
  });

  it('renders approver navigation items for approver users', () => {
    authServiceStub.currentUser.set({
      userId: 'user-2',
      email: 'committee@example.com',
      name: 'Ana Costa',
      role: 'CreditCommittee',
    });
    const fixture = TestBed.createComponent(ShellComponent);

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Pending Loans');
    expect(text).toContain('Reviewed Loans');
    expect(text).not.toContain('Request Loan');
    expect(text).not.toContain('My Loans');
  });

  it('delegates logout to the auth service', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    const component = fixture.componentInstance;

    component.logout();

    expect(authServiceStub.logout).toHaveBeenCalled();
  });
});
