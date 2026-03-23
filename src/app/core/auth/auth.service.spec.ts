import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function createToken(payload: Record<string, unknown>) {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores token and resolves the highest priority role after login', () => {
    const token = createToken({
      sub: 'user-1',
      email: 'manager@example.com',
      name: 'Manager User',
      exp: Math.floor(Date.now() / 1000) + 3600,
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['Client', 'Manager'],
    });

    service.login('manager@example.com', 'secret').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'manager@example.com', password: 'secret' });
    req.flush({ token });

    expect(localStorage.getItem('wy_token')).toBe(token);
    expect(service.currentUser()).toEqual({
      userId: 'user-1',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'Manager',
    });
    expect(service.isLoggedIn()).toBe(true);
  });

  it('posts the expected registration payload', () => {
    service.register('Serge', 'serge@example.com', '123456').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Serge',
      email: 'serge@example.com',
      password: '123456',
    });
    req.flush({});
  });

  it('clears expired tokens during startup', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      'wy_token',
      createToken({
        sub: 'user-1',
        email: 'expired@example.com',
        exp: Math.floor(Date.now() / 1000) - 60,
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Client',
      }),
    );

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const freshService = TestBed.inject(AuthService);

    expect(freshService.currentUser()).toBeNull();
    expect(localStorage.getItem('wy_token')).toBeNull();
    expect(freshService.isLoggedIn()).toBe(false);
  });

  it('logs out and redirects to login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.setItem('wy_token', 'token');
    service.currentUser.set({
      userId: 'user-1',
      email: 'client@example.com',
      name: 'Client',
      role: 'Client',
    });

    service.logout();

    expect(localStorage.getItem('wy_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
