import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { ShellComponent } from './features/layout/shell.component';

/**
 * Route table.
 *
 * WHY lazy `loadComponent`: each feature page is code-split into its own chunk,
 * so the initial bundle stays small and pages load on demand. The login page is
 * a top-level route (no shell chrome); every other page is a CHILD of the
 * authenticated shell and protected by `authGuard`.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in',
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list.component').then((m) => m.ProductListComponent),
        title: 'Products',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
        title: 'Categories',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list.component').then((m) => m.UserListComponent),
        title: 'Users',
      },
      {
        path: 'bulk-upload',
        loadComponent: () =>
          import('./features/bulk-upload/bulk-upload.component').then(
            (m) => m.BulkUploadComponent,
          ),
        title: 'Bulk Upload',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
        title: 'Reports',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
