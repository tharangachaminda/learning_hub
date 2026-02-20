/**
 * Login component for student authentication.
 *
 * Provides a reactive login form with email/password fields,
 * remember me option, and navigation links for password recovery
 * and registration.
 *
 * @component
 * @example
 * ```html
 * <!-- Used via routing -->
 * <app-login></app-login>
 * ```
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  /**
   * Reactive form group for the login form.
   * Contains email, password, and rememberMe controls.
   */
  loginForm!: FormGroup;

  /**
   * Whether an authentication request is in progress.
   * Used to show loading spinner and disable form.
   */
  isLoading = false;

  /**
   * Error message to display after a failed login attempt.
   * Null when no error is present.
   */
  loginError: string | null = null;

  /**
   * Count of consecutive failed login attempts.
   * Used to trigger CAPTCHA display after 3 failures (AC4).
   */
  failedAttempts = 0;

  /**
   * Whether the password field value is visible as plain text.
   * Toggled by the show/hide password button.
   */
  showPassword = false;

  /**
   * Whether CAPTCHA verification should be displayed.
   * Becomes true after 3 consecutive failed login attempts (AC4).
   */
  showCaptcha = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Initialize the login form with validators.
   */
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  /**
   * Toggle password field visibility between text and password types.
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Handle form submission for login.
   *
   * Validates form, calls AuthService.login(), manages loading state,
   * and redirects to dashboard on success.
   *
   * @throws Skips submission if form is invalid
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = null;

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: () => {
        this.isLoading = false;
        this.failedAttempts = 0;
        this.showCaptcha = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.loginError = 'Invalid email or password';
        this.failedAttempts++;
        this.showCaptcha = this.failedAttempts >= 3;
        this.loginForm.get('password')?.setValue('');
      },
    });
  }
}
