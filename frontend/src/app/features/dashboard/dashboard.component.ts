import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { UserService } from '../../core/services/user.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  route: string;
  accent: string;
}

/**
 * Dashboard: at-a-glance counts with skeleton placeholders while loading.
 * Uses forkJoin to fire the three independent count requests in parallel and
 * render once they all resolve (fewer renders, one loading state).
 */
@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly products = inject(ProductService);
  private readonly categories = inject(CategoryService);
  private readonly users = inject(UserService);

  readonly loading = signal(true);
  readonly stats = signal<StatCard[]>([]);

  ngOnInit(): void {
    // We only need the product TOTAL, so request the smallest possible page.
    forkJoin({
      products: this.products.list({ page: 1, limit: 1, sortBy: 'createdAt', order: 'desc' }),
      categories: this.categories.list(),
      users: this.users.list(),
    }).subscribe({
      next: ({ products, categories, users }) => {
        this.stats.set([
          { label: 'Products', value: products.total, icon: 'inventory_2', route: '/products', accent: '#1565c0' },
          { label: 'Categories', value: categories.length, icon: 'category', route: '/categories', accent: '#6a1b9a' },
          { label: 'Users', value: users.length, icon: 'group', route: '/users', accent: '#2e7d32' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
