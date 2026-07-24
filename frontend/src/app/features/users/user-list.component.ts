import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { UserFormDialogComponent } from './user-form-dialog.component';
import type { User } from '../../core/models/user.model';

/** Users administration page. */
@Component({
  selector: 'app-user-list',
  imports: [DatePipe, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly service = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['email', 'createdAt', 'actions'];
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  /** Current user id — used to prevent deleting yourself in the UI. */
  readonly currentUserId = this.auth.currentUser()?.id ?? null;

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.openDialog();
  }

  openEdit(user: User): void {
    this.openDialog(user);
  }

  delete(user: User): void {
    this.confirm
      .confirm({
        title: 'Delete user',
        message: `Delete "${user.email}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.service.remove(user.id).subscribe(() => {
          this.notify.success('User deleted');
          this.load();
        });
      });
  }

  private openDialog(user?: User): void {
    this.dialog
      .open<UserFormDialogComponent, User | undefined, User>(UserFormDialogComponent, {
        width: '420px',
        data: user,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.load();
      });
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
