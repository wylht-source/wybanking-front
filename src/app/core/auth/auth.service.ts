import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'Client' | 'Manager' | 'Supervisor' | 'CreditCommittee';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'wy_token';
  currentUser = signal<AuthUser | null>(this.loadUserFromToken());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(tap((response) => this.saveToken(response.token)));
  }

  register(name: string, email: string, password: string) {
    return this.http.post(
      `${environment.apiUrl}/api/auth/register`,
      { name, email, password }, // ← era username, corrigir para name
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload['exp'];
      if (!exp) return false;
      // exp é em segundos, Date.now() em milissegundos
      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUser.set(this.decodeToken(token));
  }

  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rolesClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      // pode vir como string (uma role) ou array (múltiplas roles)
      const roles: string[] = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];

      // pega a role mais privilegiada
      const rolePriority = ['CreditCommittee', 'Supervisor', 'Manager', 'Client'];
      const role = rolePriority.find((r) => roles.includes(r)) ?? 'Client';

      return {
        userId: payload['sub'],
        email: payload['email'],
        name: payload['name'] ?? payload['email']?.split('@')[0],
        role: role as AuthUser['role'],
      };
    } catch {
      return null;
    }
  }

  private loadUserFromToken(): AuthUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    if (!this.isLoggedIn()) {
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }

    return this.decodeToken(token);
  }
}
