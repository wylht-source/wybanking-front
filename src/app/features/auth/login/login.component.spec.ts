import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, AuthUser } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let router: Router;
  let authServiceStub: {
    login: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
  };

  beforeEach(async () => {
    authServiceStub = {
      login: vi.fn(),
      currentUser: signal<AuthUser | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('does not attempt login when the form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(authServiceStub.login).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('redirects approvers to pending loans after a successful login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'manager@example.com',
      name: 'Manager',
      role: 'Manager',
    });
    authServiceStub.login.mockReturnValue(of({}));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'manager@example.com', password: 'secret' });

    component.onSubmit();

    expect(authServiceStub.login).toHaveBeenCalledWith('manager@example.com', 'secret');
    expect(navigateSpy).toHaveBeenCalledWith(['/pending-loans']);
  });

  it('redirects clients to dashboard after a successful login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'client@example.com',
      name: 'Client',
      role: 'Client',
    });
    authServiceStub.login.mockReturnValue(of({}));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'client@example.com', password: 'secret' });

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows an error message when login fails', () => {
    authServiceStub.login.mockReturnValue(throwError(() => new Error('invalid')));

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'client@example.com', password: 'secret' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid email or password.');
    expect(component.loading).toBe(false);
  });
});
