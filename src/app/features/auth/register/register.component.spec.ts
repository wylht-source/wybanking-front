import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService, AuthUser } from '../../../core/auth/auth.service';

describe('RegisterComponent', () => {
  let router: Router;
  let authServiceStub: {
    register: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
  };

  beforeEach(async () => {
    authServiceStub = {
      register: vi.fn(),
      currentUser: signal<AuthUser | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(authServiceStub.register).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('marks the form invalid when passwords do not match', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      name: 'Serge Junior',
      email: 'serge@example.com',
      password: '123456',
      confirmPassword: '654321',
    });

    expect(component.form.hasError('passwordMismatch')).toBe(true);

    component.onSubmit();

    expect(authServiceStub.register).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits successfully, resets the form and redirects to login', () => {
    vi.useFakeTimers();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authServiceStub.register.mockReturnValue(of({}));

    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.form.setValue({
      name: 'Serge Junior',
      email: 'serge@example.com',
      password: '123456',
      confirmPassword: '123456',
    });

    component.onSubmit();

    expect(authServiceStub.register).toHaveBeenCalledWith(
      'Serge Junior',
      'serge@example.com',
      '123456',
    );
    expect(component.loading).toBe(false);
    expect(component.successMessage).toBe('Account created successfully! Redirecting to login...');
    expect(component.errorMessage).toBe('');
    expect(component.form.get('name')?.value).toBeNull();

    vi.advanceTimersByTime(2000);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('shows the backend validation error when registration fails', () => {
    authServiceStub.register.mockReturnValue(
      throwError(() => ({
        error: {
          errors: ['Email already exists.'],
        },
      })),
    );

    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.form.setValue({
      name: 'Serge Junior',
      email: 'serge@example.com',
      password: '123456',
      confirmPassword: '123456',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Email already exists.');
    expect(component.successMessage).toBe('');
    expect(component.loading).toBe(false);
  });

  it('falls back to the generic error message and clears stale messages before submit', () => {
    authServiceStub.register.mockReturnValue(throwError(() => new Error('unexpected')));

    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.errorMessage = 'stale error';
    component.successMessage = 'stale success';
    component.form.setValue({
      name: 'Serge Junior',
      email: 'serge@example.com',
      password: '123456',
      confirmPassword: '123456',
    });

    component.onSubmit();

    expect(component.successMessage).toBe('stale success');
    expect(component.errorMessage).toBe('Registration failed. Please try again.');
    expect(component.loading).toBe(false);
  });
});
