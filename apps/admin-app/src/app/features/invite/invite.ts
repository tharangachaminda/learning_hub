import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-invite-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invite.html',
  styleUrl: './invite.scss',
})
export class InviteComponent implements OnInit {
  inviteForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Only admins can access this page
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
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.authService.inviteUser(this.inviteForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.success = `Successfully created ${response.role} account for ${response.email}`;
        this.inviteForm.reset({ role: 'teacher' });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403) {
          this.error = 'Access denied. Only admins can invite users.';
        } else if (
          err.status === 409 ||
          err.error?.message?.includes('already exists')
        ) {
          this.error = 'A user with this email already exists.';
        } else if (err.status === 400) {
          const messages = err.error?.message;
          this.error = Array.isArray(messages)
            ? messages.join(', ')
            : messages || 'Invalid input. Please check the form fields.';
        } else {
          this.error = 'Something went wrong. Please try again.';
        }
      },
    });
  }

  get f() {
    return this.inviteForm.controls;
  }
}
