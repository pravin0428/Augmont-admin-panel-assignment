import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

/**
 * Authenticated app shell: fixed toolbar (navbar) + collapsible sidebar +
 * routed content. Wrapping the protected feature routes as CHILDREN of this
 * component means the chrome renders once and only the content area changes on
 * navigation (better perf and no flicker).
 *
 * Responsive: on small screens the sidebar switches to an overlay ('over') that
 * closes on navigation; on desktop it's a persistent 'side' panel.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly breakpoints = inject(BreakpointObserver);

  /** Reactive flag: true on handset/narrow viewports (drives sidebar mode). */
  readonly isHandset = toSignal(
    this.breakpoints
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly currentUser = this.auth.currentUser;

  readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Products', icon: 'inventory_2', route: '/products' },
    { label: 'Categories', icon: 'category', route: '/categories' },
    { label: 'Users', icon: 'group', route: '/users' },
    { label: 'Bulk Upload', icon: 'upload_file', route: '/bulk-upload' },
    { label: 'Reports', icon: 'assessment', route: '/reports' },
  ];

  logout(): void {
    this.auth.logout();
    this.notify.success('You have been logged out');
    void this.router.navigate(['/login']);
  }
}
