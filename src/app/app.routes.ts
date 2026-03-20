import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { ShellComponent } from './shared/components/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'transfer',
        canActivate: [roleGuard(['Client'])],
        loadComponent: () =>
          import('./features/client/transfer/transfer.component').then((m) => m.TransferComponent),
      },
      {
        path: 'request-loan',
        canActivate: [roleGuard(['Client'])],
        loadComponent: () =>
          import('./features/client/request-loan/request-loan.component').then(
            (m) => m.RequestLoanComponent,
          ),
      },
      {
        path: 'my-loans',
        canActivate: [roleGuard(['Client'])],
        loadComponent: () =>
          import('./features/client/my-loans/my-loans.component').then((m) => m.MyLoansComponent),
      },
      {
        path: 'pending-loans',
        canActivate: [roleGuard(['Manager', 'Supervisor', 'CreditCommittee'])],
        loadComponent: () =>
          import('./features/approver/pending-loans/pending-loans.component').then(
            (m) => m.PendingLoansComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
