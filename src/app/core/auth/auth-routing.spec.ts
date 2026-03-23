import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService, AuthUser } from './auth.service';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { authInterceptor } from './auth.interceptor';

describe('auth routing helpers', () => {
  let router: Router;
  let authServiceStub: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
  };

  beforeEach(() => {
    authServiceStub = {
      isLoggedIn: vi.fn(),
      getToken: vi.fn(),
      currentUser: signal<AuthUser | null>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('authGuard allows authenticated users', () => {
    authServiceStub.isLoggedIn.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('authGuard redirects anonymous users to login', () => {
    authServiceStub.isLoggedIn.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login');
  });

  it('roleGuard allows users with an accepted role', () => {
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'manager@example.com',
      name: 'Manager',
      role: 'Manager',
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['Manager', 'Supervisor'])({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it('roleGuard redirects users without permission to dashboard', () => {
    authServiceStub.currentUser.set({
      userId: 'user-1',
      email: 'client@example.com',
      name: 'Client',
      role: 'Client',
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['Manager'])({} as never, {} as never),
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/dashboard');
  });

  it('authInterceptor appends the bearer token when available', () => {
    authServiceStub.getToken.mockReturnValue('secure-token');
    const next = vi.fn((req: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => authInterceptor(new HttpRequest('GET', '/api/test'), next))
      .subscribe();

    expect(next).toHaveBeenCalledTimes(1);
    expect((next.mock.calls[0][0] as HttpRequest<unknown>).headers.get('Authorization')).toBe(
      'Bearer secure-token',
    );
  });

  it('authInterceptor keeps the request untouched when there is no token', () => {
    authServiceStub.getToken.mockReturnValue(null);
    const next = vi.fn((req: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));

    TestBed.runInInjectionContext(() => authInterceptor(new HttpRequest('GET', '/api/test'), next))
      .subscribe();

    expect((next.mock.calls[0][0] as HttpRequest<unknown>).headers.has('Authorization')).toBe(false);
  });
});
