import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from './core/services/loading.service';

/**
 * Root component. Deliberately minimal: it renders a GLOBAL loading bar (driven
 * by the loading interceptor via a signal) and the top-level router outlet.
 * The authenticated layout (navbar/sidebar) lives in ShellComponent so the
 * login page can render without it.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly loading = inject(LoadingService);
}
