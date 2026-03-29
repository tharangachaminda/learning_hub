import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  StaffUser,
  StaffStats,
} from '../../services/auth.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.scss',
})
export class ManageUsersComponent implements OnInit {
  users: StaffUser[] = [];
  stats: StaffStats | null = null;
  isLoading = true;
  error: string | null = null;

  // Invite form
  showInviteForm = false;
  inviteForm!: FormGroup;
  isInviting = false;
  inviteError: string | null = null;
  inviteSuccess: string | null = null;

  // Filter
  roleFilter: 'all' | 'admin' | 'teacher' = 'all';
  statusFilter: 'all' | 'active' | 'disabled' = 'all';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.inviteForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/
          ),
        ],
      ],
      role: ['teacher', [Validators.required]],
    });

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    // Load both users and stats
    this.authService.getStaffUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loadStats();
      },
      error: () => {
        this.error = 'Failed to load users.';
        this.isLoading = false;
      },
    });
  }

  private loadStats(): void {
    this.authService.getStaffStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: () => {
        // Stats are optional — show users even if stats fail
        this.isLoading = false;
      },
    });
  }

  get filteredUsers(): StaffUser[] {
    return this.users.filter((u) => {
      if (this.roleFilter !== 'all' && u.role !== this.roleFilter) return false;
      if (this.statusFilter === 'active' && !u.isActive) return false;
      if (this.statusFilter === 'disabled' && u.isActive) return false;
      return true;
    });
  }

  toggleStatus(user: StaffUser): void {
    const newStatus = !user.isActive;
    this.authService.toggleUserStatus(user.id, newStatus).subscribe({
      next: (result) => {
        user.isActive = result.isActive;
        // Refresh stats
        this.loadStats();
      },
      error: () => {
        this.error = `Failed to ${newStatus ? 'enable' : 'disable'} user.`;
      },
    });
  }

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    this.inviteError = null;
    this.inviteSuccess = null;
    if (this.showInviteForm) {
      this.inviteForm.reset({ role: 'teacher' });
    }
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isInviting = true;
    this.inviteError = null;
    this.inviteSuccess = null;

    this.authService.inviteUser(this.inviteForm.value).subscribe({
      next: (response) => {
        this.isInviting = false;
        this.inviteSuccess = `Created ${response.role} account for ${response.email}`;
        this.inviteForm.reset({ role: 'teacher' });
        // Refresh the user list
        this.loadData();
      },
      error: (err) => {
        this.isInviting = false;
        if (
          err.status === 409 ||
          err.error?.message?.includes('already exists')
        ) {
          this.inviteError = 'A user with this email already exists.';
        } else if (err.status === 400) {
          const messages = err.error?.message;
          this.inviteError = Array.isArray(messages)
            ? messages.join(', ')
            : messages || 'Invalid input. Please check the form.';
        } else {
          this.inviteError = 'Something went wrong. Please try again.';
        }
      },
    });
  }

  get f() {
    return this.inviteForm.controls;
  }

  getUserInitials(user: StaffUser): string {
    return (
      (user.profile.firstName?.[0] ?? '') + (user.profile.lastName?.[0] ?? '')
    ).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
