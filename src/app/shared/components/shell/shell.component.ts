import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  isClient = computed(() => this.user()?.role === 'Client');
  isApprover = computed(() =>
    ['Manager', 'Supervisor', 'CreditCommittee'].includes(this.user()?.role ?? ''),
  );

  initials = computed(() => {
    const name = this.user()?.name ?? '';
    const parts = name
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  logout() {
    this.authService.logout();
  }
}
