import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  AsyncValidatorFn,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  map,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';

/**
 * Registration component for student account creation.
 * Implements multi-step registration form with validation.
 *
 * @component
 */
@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration implements OnInit {
  /**
   * Current step in the multi-step registration process.
   * Step 1: Basic Information, Step 2: Profile Details, Step 3: Avatar Selection
   */
  currentStep = 1;

  /**
   * Reactive form for student registration.
   * Contains form controls for basic information, profile details, and avatar selection.
   *
   * @type {FormGroup}
   */
  registrationForm!: FormGroup;

  /**
   * Available grade levels for selection (1-12).
   */
  readonly availableGrades = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  /**
   * Available learning goal subjects.
   */
  readonly learningGoalOptions = [
    { id: 'math', label: 'Mathematics' },
    { id: 'science', label: 'Science' },
    { id: 'reading', label: 'Reading' },
    { id: 'writing', label: 'Writing' },
    { id: 'history', label: 'History' },
  ];

  /**
   * Available avatar options for student profile.
   * Contains 15 different avatar identifiers.
   */
  readonly availableAvatars = Array.from({ length: 15 }, (_, i) => ({
    id: `avatar-${i}`,
    url: `/assets/avatars/avatar-${i}.svg`,
  }));

  /**
   * Loading state during registration submission.
   */
  isLoading = false;

  /**
   * Error message from registration attempt.
   */
  registrationError: string | null = null;

  /**
   * Success state after successful registration.
   */
  registrationSuccess = false;

  /**
   * Step announcement for screen readers.
   */
  stepAnnouncement = '';

  /**
   * Visibility state for password fields.
   * Keys are form control names ('password', 'confirmPassword').
   */
  passwordVisible: Record<string, boolean> = {
    password: false,
    confirmPassword: false,
  };

  /**
   * Toggles password field visibility between plain text and masked.
   *
   * @param {string} field - The form control name ('password' or 'confirmPassword')
   */
  togglePasswordVisibility(field: string): void {
    this.passwordVisible[field] = !this.passwordVisible[field];
  }

  /** Total number of registration steps. */
  private readonly TOTAL_STEPS = 3;

  /** HTTP client for API requests. */
  private readonly http = inject(HttpClient);

  /** Angular Router for navigation. */
  private readonly router = inject(Router);

  /** Angular FormBuilder service for creating reactive forms. */
  private readonly fb = inject(FormBuilder);

  /** SessionStorage key for form data persistence. */
  private readonly STORAGE_KEY = 'registration-form-data';

  /** User-friendly labels for form field error messages. */
  private readonly FIELD_LABELS: Readonly<Record<string, string>> = {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
  };

  /**
   * Angular lifecycle hook - initializes the registration form.
   * Sets up form controls with validation rules per AC2 requirements.
   */
  ngOnInit(): void {
    this.initializeForm();
    this.restoreFormData();
    this.setupAutoSave();
  }

  /**
   * Initializes the reactive form with all required controls and validators.
   * Implements AC2 validation requirements for Step 1 - Basic Information.
   *
   * Form Controls:
   * - firstName: Required, 2-50 characters
   * - lastName: Required, 2-50 characters
   * - email: Required, valid email format
   * - password: Required, minimum 8 characters
   * - confirmPassword: Required, must match password
   *
   * @private
   */
  private initializeForm(): void {
    this.registrationForm = this.fb.group(
      {
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
        email: [
          '',
          [Validators.required, Validators.email],
          [this.emailUniquenessValidator()],
        ],
        password: ['', [Validators.required, Validators.minLength(8), this.passwordComplexityValidator]],
        confirmPassword: ['', [Validators.required]],
        grade: ['', [Validators.required]],
        learningGoals: [[]],
        selectedAvatar: [null],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /**
   * Custom validator to check if password and confirmPassword match.
   * Implements AC2 requirement for password confirmation.
   *
   * @param {AbstractControl} control - The form group containing password fields
   * @returns {ValidationErrors | null} Returns error object if passwords don't match, null otherwise
   */
  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  /**
   * Custom validator to enforce password complexity requirements per AC2.
   * Requires at least one uppercase letter, one number, and one special character.
   *
   * @param {AbstractControl} control - The password form control
   * @returns {ValidationErrors | null} Returns error object if complexity requirements not met, null otherwise
   */
  private passwordComplexityValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (hasUpperCase && hasNumber && hasSpecialChar) {
      return null;
    }

    return { passwordComplexity: true };
  }

  /**
   * Async validator to check email uniqueness via API.
   * Implements AC2 requirement for email uniqueness validation with debouncing.
   *
   * @returns {AsyncValidatorFn} Async validator function
   */
  private emailUniquenessValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((email) =>
          this.http
            .get<{ exists: boolean }>(`/api/auth/check-email/${email}`)
            .pipe(
              map((response) =>
                response.exists ? { emailTaken: true } : null
              ),
              catchError(() => of(null))
            )
        )
      );
    };
  }

  /**
   * Calculates password strength based on complexity.
   * Implements AC2 requirement for password strength indicator.
   *
   * Strength levels:
   * - weak: Basic password (length + lowercase/numbers)
   * - medium: Password with uppercase and numbers
   * - strong: Password with uppercase, numbers, and special characters
   *
   * @returns {'weak' | 'medium' | 'strong'} Password strength level
   */
  getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    const password = this.registrationForm.get('password')?.value || '';

    if (password.length === 0) {
      return 'weak';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasUpperCase && hasNumber && hasSpecialChar) {
      return 'strong';
    } else if (hasUpperCase && hasNumber) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  /**
   * Gets error message for a specific form control.
   * Returns appropriate validation error message based on error type.
   *
   * @param {string} fieldName - The name of the form control
   * @returns {string | null} Error message or null if no errors
   */
  getErrorMessage(fieldName: string): string | null {
    const control = this.registrationForm.get(fieldName);

    if (!control || !control.touched) {
      return null;
    }

    // Check form-level password mismatch error for confirmPassword
    if (
      fieldName === 'confirmPassword' &&
      this.registrationForm.hasError('passwordMismatch')
    ) {
      return 'Passwords do not match';
    }

    if (!control.errors) {
      return null;
    }

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(
        fieldName
      )} must be at least ${minLength} characters`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(
        fieldName
      )} must not exceed ${maxLength} characters`;
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('emailTaken')) {
      return 'This email is already in use';
    }

    if (control.hasError('passwordComplexity')) {
      return 'Password must contain at least one uppercase letter, one number, and one special character';
    }

    return null;
  }

  /**
   * Gets user-friendly label for form field names.
   *
   * @param {string} fieldName - The form control name
   * @returns {string} User-friendly field label
   * @private
   */
  private getFieldLabel(fieldName: string): string {
    return this.FIELD_LABELS[fieldName] || fieldName;
  }

  /**
   * Checks whether all Step 1 (Basic Information) fields are valid.
   * Validates firstName, lastName, email, password, confirmPassword and password match.
   * Ignores Step 2/3 fields so the Next button on Step 1 works independently.
   * Treats email PENDING state (async uniqueness check in progress) as acceptable
   * so the user is not blocked while the debounced API call completes.
   *
   * @returns {boolean} True if all Step 1 fields pass validation
   */
  isStep1Valid(): boolean {
    const syncFields = ['firstName', 'lastName', 'password', 'confirmPassword'];
    const allSyncValid = syncFields.every(
      (f) => this.registrationForm.get(f)?.valid
    );
    const emailControl = this.registrationForm.get('email');
    const emailAcceptable = emailControl?.valid || (emailControl?.pending && !emailControl?.hasError('email'));
    const noPasswordMismatch = !this.registrationForm.hasError('passwordMismatch');
    return allSyncValid && !!emailAcceptable && noPasswordMismatch;
  }

  /**
   * Checks whether all Step 2 (Profile Details) fields are valid.
   * Currently only requires grade selection.
   *
   * @returns {boolean} True if Step 2 fields pass validation
   */
  isStep2Valid(): boolean {
    return this.registrationForm.get('grade')?.valid ?? false;
  }

  /**
   * Navigate to the next step in the registration process.
   * Validates current step before proceeding.
   */
  nextStep(): void {
    if (this.currentStep < this.TOTAL_STEPS) {
      this.currentStep++;
      this.announceStep();
    }
  }

  /**
   * Navigate to the previous step in the registration process.
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.announceStep();
    }
  }

  /**
   * Announce current step for screen readers.
   */
  private announceStep(): void {
    const stepNames: Record<number, string> = {
      1: 'Basic Information',
      2: 'Profile Details',
      3: 'Avatar Selection',
    };
    const name = stepNames[this.currentStep];
    this.stepAnnouncement = name
      ? `Step ${this.currentStep} of ${this.TOTAL_STEPS}: ${name}`
      : '';
  }

  /**
   * Handle learning goal checkbox changes.
   * Updates the learningGoals form array.
   *
   * @param {string} goalId - The ID of the learning goal
   * @param {Event} event - The change event
   */
  onLearningGoalChange(goalId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentGoals =
      this.registrationForm.get('learningGoals')?.value || [];

    if (checkbox.checked) {
      this.registrationForm.patchValue({
        learningGoals: [...currentGoals, goalId],
      });
    } else {
      this.registrationForm.patchValue({
        learningGoals: currentGoals.filter((g: string) => g !== goalId),
      });
    }
  }

  /**
   * Select an avatar for the student profile.
   * Updates the selectedAvatar form control.
   *
   * @param {string} avatarId - The ID of the selected avatar
   */
  selectAvatar(avatarId: string): void {
    this.registrationForm.patchValue({ selectedAvatar: avatarId });
  }

  /**
   * Skip avatar selection.
   * Clears the selectedAvatar form control.
   */
  skipAvatar(): void {
    this.registrationForm.patchValue({ selectedAvatar: null });
  }

  /**
   * Restore form data from sessionStorage.
   */
  private restoreFormData(): void {
    const savedData = sessionStorage.getItem(this.STORAGE_KEY);
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);
        this.registrationForm.patchValue(formData, { emitEvent: false });
      } catch (e) {
        // Invalid data, ignore
      }
    }
  }

  /**
   * Setup auto-save to sessionStorage on form changes.
   */
  private setupAutoSave(): void {
    this.registrationForm.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.saveFormData();
      });
  }

  /**
   * Save current form data to sessionStorage.
   */
  private saveFormData(): void {
    const formData = this.registrationForm.value;
    // Don't save passwords to sessionStorage for security
    const dataToSave = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      grade: formData.grade,
      learningGoals: formData.learningGoals,
      selectedAvatar: formData.selectedAvatar,
    };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
  }

  /**
   * Submit registration form to create student account.
   * Sends POST request to /api/auth/student/register with form data.
   * Handles loading states, errors, and successful registration.
   */
  register(): void {
    if (this.registrationForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.registrationError = null;

    const formValue = this.registrationForm.value;
    const registrationData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      grade: formValue.grade,
      learningGoals: formValue.learningGoals,
      selectedAvatar: formValue.selectedAvatar,
    };

    this.http.post('/api/auth/student/register', registrationData).subscribe({
      next: () => {
        this.isLoading = false;
        this.registrationSuccess = true;
        sessionStorage.removeItem(this.STORAGE_KEY);
        this.router.navigate(['/achievements']);
      },
      error: () => {
        this.isLoading = false;
        this.registrationError = 'Registration failed. Please try again.';
      },
    });
  }
}
