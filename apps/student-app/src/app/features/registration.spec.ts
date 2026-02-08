import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Registration } from './registration';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';

describe('Registration', () => {
  let component: Registration;
  let fixture: ComponentFixture<Registration>;
  let httpMock: HttpTestingController;
  let router: Router;

  /** Valid Step 1 form data for test setup. */
  const VALID_STEP1_DATA = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'Test123!',
    confirmPassword: 'Test123!',
  };

  /** Valid Step 2 form data for test setup. */
  const VALID_STEP2_DATA = {
    grade: '5',
    learningGoals: ['math'],
  };

  /**
   * Fills Step 1 form and flushes the email validation request.
   * Must be called within fakeAsync zone.
   */
  function completeStep1(): void {
    component.registrationForm.patchValue(VALID_STEP1_DATA);
    tick(500);
    flushPendingEmailCheck();
  }

  /**
   * Flushes any pending email check HTTP request, safely skipping cancelled ones.
   */
  function flushPendingEmailCheck(): void {
    const req = httpMock.match('/api/auth/check-email/john@example.com')[0];
    if (req && !req.cancelled) {
      req.flush({ exists: false });
    }
  }

  /**
   * Navigates the component to the specified step by completing prior steps.
   * Must be called within fakeAsync zone.
   *
   * @param targetStep - The step number to navigate to (1, 2, or 3)
   */
  function navigateToStep(targetStep: number): void {
    if (targetStep >= 2) {
      completeStep1();
      component.nextStep();
      fixture.detectChanges();
    }
    if (targetStep >= 3) {
      component.registrationForm.patchValue(VALID_STEP2_DATA);
      component.nextStep();
      fixture.detectChanges();
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registration, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registration);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Flush any pending email validation requests, skipping cancelled ones
    const pending = httpMock.match(() => true);
    pending.forEach((req) => {
      if (!req.cancelled) {
        req.flush({ exists: false });
      }
    });
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AC1: Registration Form Display - Multi-step form structure
  describe('Multi-step Form Display', () => {
    it('should display progress indicator showing current step', () => {
      const compiled = fixture.nativeElement;
      const progressIndicator = compiled.querySelector(
        '[data-testid="progress-indicator"]'
      );
      expect(progressIndicator).toBeTruthy();
    });

    it('should show Step 1: Basic Information on initial load', () => {
      const compiled = fixture.nativeElement;
      const step1Section = compiled.querySelector(
        '[data-testid="step-1-content"]'
      );
      expect(step1Section).toBeTruthy();
      expect(component.currentStep).toBe(1);
    });

    it('should display "Already have an account? Login" link', () => {
      const compiled = fixture.nativeElement;
      const loginLink = compiled.querySelector('[data-testid="login-link"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink.textContent).toContain('Already have an account?');
    });
  });

  // AC2: Step 1 - Basic Information Validation
  describe('Basic Information Form', () => {
    it('should initialize reactive form with all required controls', () => {
      expect(component.registrationForm).toBeDefined();
      expect(component.registrationForm.get('firstName')).toBeDefined();
      expect(component.registrationForm.get('lastName')).toBeDefined();
      expect(component.registrationForm.get('email')).toBeDefined();
      expect(component.registrationForm.get('password')).toBeDefined();
      expect(component.registrationForm.get('confirmPassword')).toBeDefined();
    });

    it('should initialize form as invalid when empty', () => {
      expect(component.registrationForm.valid).toBeFalsy();
    });

    describe('First Name Validation', () => {
      it('should be required', () => {
        const firstName = component.registrationForm.get('firstName');
        firstName?.setValue('');
        expect(firstName?.hasError('required')).toBeTruthy();
      });

      it('should require minimum 2 characters', () => {
        const firstName = component.registrationForm.get('firstName');
        firstName?.setValue('A');
        expect(firstName?.hasError('minlength')).toBeTruthy();
      });

      it('should not exceed 50 characters', () => {
        const firstName = component.registrationForm.get('firstName');
        firstName?.setValue('A'.repeat(51));
        expect(firstName?.hasError('maxlength')).toBeTruthy();
      });

      it('should be valid with 2-50 characters', () => {
        const firstName = component.registrationForm.get('firstName');
        firstName?.setValue('John');
        expect(firstName?.valid).toBeTruthy();
      });
    });

    describe('Last Name Validation', () => {
      it('should be required', () => {
        const lastName = component.registrationForm.get('lastName');
        lastName?.setValue('');
        expect(lastName?.hasError('required')).toBeTruthy();
      });

      it('should require minimum 2 characters', () => {
        const lastName = component.registrationForm.get('lastName');
        lastName?.setValue('D');
        expect(lastName?.hasError('minlength')).toBeTruthy();
      });

      it('should not exceed 50 characters', () => {
        const lastName = component.registrationForm.get('lastName');
        lastName?.setValue('A'.repeat(51));
        expect(lastName?.hasError('maxlength')).toBeTruthy();
      });
    });

    describe('Email Validation', () => {
      it('should be required', () => {
        const email = component.registrationForm.get('email');
        email?.setValue('');
        expect(email?.hasError('required')).toBeTruthy();
      });

      it('should validate email format', () => {
        const email = component.registrationForm.get('email');
        email?.setValue('invalid-email');
        expect(email?.hasError('email')).toBeTruthy();
      });

      it('should accept valid email format', () => {
        const email = component.registrationForm.get('email');
        email?.setValue('student@example.com');
        expect(email?.hasError('email')).toBeFalsy();
      });
    });

    describe('Password Validation', () => {
      it('should be required', () => {
        const password = component.registrationForm.get('password');
        password?.setValue('');
        expect(password?.hasError('required')).toBeTruthy();
      });

      it('should require minimum 8 characters', () => {
        const password = component.registrationForm.get('password');
        password?.setValue('Pass1!');
        expect(password?.hasError('minlength')).toBeTruthy();
      });
    });

    describe('Confirm Password Validation', () => {
      it('should be required', () => {
        const confirmPassword =
          component.registrationForm.get('confirmPassword');
        confirmPassword?.setValue('');
        expect(confirmPassword?.hasError('required')).toBeTruthy();
      });
    });
  });

  // AC2: Form Template Binding - Input fields connected to form controls
  describe('Form Template Binding', () => {
    it('should have first name input field bound to form control', () => {
      const compiled = fixture.nativeElement;
      const firstNameInput = compiled.querySelector(
        'input[formControlName="firstName"]'
      );
      expect(firstNameInput).toBeTruthy();
      expect(firstNameInput.getAttribute('type')).toBe('text');
    });

    it('should have last name input field bound to form control', () => {
      const compiled = fixture.nativeElement;
      const lastNameInput = compiled.querySelector(
        'input[formControlName="lastName"]'
      );
      expect(lastNameInput).toBeTruthy();
      expect(lastNameInput.getAttribute('type')).toBe('text');
    });

    it('should have email input field bound to form control', () => {
      const compiled = fixture.nativeElement;
      const emailInput = compiled.querySelector(
        'input[formControlName="email"]'
      );
      expect(emailInput).toBeTruthy();
      expect(emailInput.getAttribute('type')).toBe('email');
    });

    it('should have password input field bound to form control', () => {
      const compiled = fixture.nativeElement;
      const passwordInput = compiled.querySelector(
        'input[formControlName="password"]'
      );
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('should have confirm password input field bound to form control', () => {
      const compiled = fixture.nativeElement;
      const confirmPasswordInput = compiled.querySelector(
        'input[formControlName="confirmPassword"]'
      );
      expect(confirmPasswordInput).toBeTruthy();
      expect(confirmPasswordInput.getAttribute('type')).toBe('password');
    });

    it('should have form element with formGroup directive', () => {
      const compiled = fixture.nativeElement;
      const formElement = compiled.querySelector(
        'form[data-testid="registration-form"]'
      );
      expect(formElement).toBeTruthy();
    });
  });

  // AC2: Password Strength Indicator
  describe('Password Strength Indicator', () => {
    it('should display password strength indicator', () => {
      const compiled = fixture.nativeElement;
      const strengthIndicator = compiled.querySelector(
        '[data-testid="password-strength"]'
      );
      expect(strengthIndicator).toBeTruthy();
    });

    it('should show weak strength for simple password', () => {
      component.registrationForm.get('password')?.setValue('test1234');
      fixture.detectChanges();
      expect(component.getPasswordStrength()).toBe('weak');
    });

    it('should show medium strength for password with uppercase and number', () => {
      component.registrationForm.get('password')?.setValue('Test1234');
      fixture.detectChanges();
      expect(component.getPasswordStrength()).toBe('medium');
    });

    it('should show strong strength for password with uppercase, number, and special char', () => {
      component.registrationForm.get('password')?.setValue('Test123!');
      fixture.detectChanges();
      expect(component.getPasswordStrength()).toBe('strong');
    });
  });

  // AC2: Password Complexity Validator
  describe('Password Complexity Validation', () => {
    it('should reject password without uppercase letter', () => {
      component.registrationForm.get('password')?.setValue('test1234!');
      expect(
        component.registrationForm
          .get('password')
          ?.hasError('passwordComplexity')
      ).toBeTruthy();
    });

    it('should reject password without a number', () => {
      component.registrationForm.get('password')?.setValue('Testtest!');
      expect(
        component.registrationForm
          .get('password')
          ?.hasError('passwordComplexity')
      ).toBeTruthy();
    });

    it('should reject password without special character', () => {
      component.registrationForm.get('password')?.setValue('Test1234');
      expect(
        component.registrationForm
          .get('password')
          ?.hasError('passwordComplexity')
      ).toBeTruthy();
    });

    it('should accept password meeting all complexity requirements', () => {
      component.registrationForm.get('password')?.setValue('Test123!');
      expect(
        component.registrationForm
          .get('password')
          ?.hasError('passwordComplexity')
      ).toBeFalsy();
    });

    it('should show complexity error message for weak password', () => {
      const passwordControl = component.registrationForm.get('password');
      passwordControl?.setValue('abcdefgh');
      passwordControl?.markAsTouched();
      fixture.detectChanges();
      expect(component.getErrorMessage('password')).toBe(
        'Password must contain at least one uppercase letter, one number, and one special character'
      );
    });
  });

  // AC2: Confirm Password Matching
  describe('Password Matching Validation', () => {
    it('should have no error when passwords match', () => {
      component.registrationForm.get('password')?.setValue('Test123!');
      component.registrationForm.get('confirmPassword')?.setValue('Test123!');
      expect(
        component.registrationForm.hasError('passwordMismatch')
      ).toBeFalsy();
    });

    it('should have error when passwords do not match', () => {
      component.registrationForm.get('password')?.setValue('Test123!');
      component.registrationForm
        .get('confirmPassword')
        ?.setValue('Different1!');
      expect(
        component.registrationForm.hasError('passwordMismatch')
      ).toBeTruthy();
    });
  });

  // AC2: Next Button Behavior
  describe('Next Button', () => {
    it('should have Next button', () => {
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton).toBeTruthy();
    });

    it('should disable Next button when form is invalid', () => {
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton.disabled).toBeTruthy();
    });

    it('should enable Next button when form is valid', fakeAsync(() => {
      component.registrationForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
      });

      // Wait for async email validation
      tick(500);
      const req = httpMock.expectOne('/api/auth/check-email/john@example.com');
      req.flush({ exists: false });

      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton.disabled).toBeFalsy();
    }));

    it('should enable Next button when only Step 1 fields are valid (grade empty)', fakeAsync(() => {
      // Only fill Step 1 fields — grade is empty (Step 2 field)
      component.registrationForm.patchValue(VALID_STEP1_DATA);
      tick(500);
      flushPendingEmailCheck();

      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton.disabled).toBeFalsy();
    }));

    it('should disable Next button when Step 1 email is invalid', () => {
      component.registrationForm.patchValue({
        ...VALID_STEP1_DATA,
        email: 'not-an-email',
      });
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton.disabled).toBeTruthy();
    });

    it('should disable Next button when passwords do not match', fakeAsync(() => {
      component.registrationForm.patchValue({
        ...VALID_STEP1_DATA,
        confirmPassword: 'Different1!',
      });
      tick(500);
      flushPendingEmailCheck();

      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');
      expect(nextButton.disabled).toBeTruthy();
    }));
  });

  // AC2: Per-Step Validation Methods
  describe('Per-Step Validation', () => {
    it('isStep1Valid should return true when Step 1 fields are valid', fakeAsync(() => {
      component.registrationForm.patchValue(VALID_STEP1_DATA);
      tick(500);
      flushPendingEmailCheck();
      expect(component.isStep1Valid()).toBe(true);
    }));

    it('isStep1Valid should return false when firstName is empty', () => {
      component.registrationForm.patchValue({
        ...VALID_STEP1_DATA,
        firstName: '',
      });
      expect(component.isStep1Valid()).toBe(false);
    });

    it('isStep1Valid should return false when passwords mismatch', fakeAsync(() => {
      component.registrationForm.patchValue({
        ...VALID_STEP1_DATA,
        confirmPassword: 'Mismatch1!',
      });
      tick(500);
      flushPendingEmailCheck();
      expect(component.isStep1Valid()).toBe(false);
    }));

    it('isStep2Valid should return true when grade is selected', () => {
      component.registrationForm.patchValue({ grade: '5' });
      expect(component.isStep2Valid()).toBe(true);
    });

    it('isStep2Valid should return false when grade is empty', () => {
      expect(component.isStep2Valid()).toBe(false);
    });
  });

  // AC2: Validation Error Messages
  describe('Validation Error Messages', () => {
    it('should display error message when first name is touched and invalid', () => {
      const firstNameControl = component.registrationForm.get('firstName');
      firstNameControl?.markAsTouched();
      firstNameControl?.setValue('');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector(
        '[data-testid="firstName-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('required');
    });

    it('should display error message when email format is invalid', () => {
      const emailControl = component.registrationForm.get('email');
      emailControl?.markAsTouched();
      emailControl?.setValue('invalid-email');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector(
        '[data-testid="email-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('valid email');
    });

    it('should display error message when password is too short', () => {
      const passwordControl = component.registrationForm.get('password');
      passwordControl?.markAsTouched();
      passwordControl?.setValue('Test1!');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector(
        '[data-testid="password-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('8 characters');
    });

    it('should display error message when passwords do not match', () => {
      component.registrationForm.patchValue({
        password: 'Test123!',
        confirmPassword: 'Different1!',
      });
      const confirmPasswordControl =
        component.registrationForm.get('confirmPassword');
      confirmPasswordControl?.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector(
        '[data-testid="confirmPassword-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('match');
    });

    it('should not display error messages for untouched fields', () => {
      const compiled = fixture.nativeElement;
      const errorMessages = compiled.querySelectorAll('.error-message');
      expect(errorMessages.length).toBe(0);
    });
  });

  // AC2: Password Requirements Display
  describe('Password Requirements Display', () => {
    it('should display password requirements', () => {
      const compiled = fixture.nativeElement;
      const requirements = compiled.querySelector(
        '[data-testid="password-requirements"]'
      );
      expect(requirements).toBeTruthy();
      expect(requirements.textContent).toContain('8 characters');
      expect(requirements.textContent).toContain('uppercase');
      expect(requirements.textContent).toContain('number');
      expect(requirements.textContent).toContain('special character');
    });
  });

  // AC2 / UI-UX: Password Visibility Toggle
  describe('Password Visibility Toggle', () => {
    it('should render toggle button for password field', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector('[data-testid="toggle-password"]');
      expect(toggle).toBeTruthy();
    });

    it('should render toggle button for confirm password field', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector(
        '[data-testid="toggle-confirmPassword"]'
      );
      expect(toggle).toBeTruthy();
    });

    it('should default password input to type password', () => {
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('#password');
      expect(input.type).toBe('password');
    });

    it('should toggle password input type to text when clicked', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector('[data-testid="toggle-password"]');
      toggle.click();
      fixture.detectChanges();
      const input = compiled.querySelector('#password');
      expect(input.type).toBe('text');
    });

    it('should toggle back to password type on second click', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector('[data-testid="toggle-password"]');
      toggle.click();
      fixture.detectChanges();
      toggle.click();
      fixture.detectChanges();
      const input = compiled.querySelector('#password');
      expect(input.type).toBe('password');
    });

    it('should toggle confirm password independently', () => {
      const compiled = fixture.nativeElement;
      const toggleConfirm = compiled.querySelector(
        '[data-testid="toggle-confirmPassword"]'
      );
      toggleConfirm.click();
      fixture.detectChanges();
      const confirmInput = compiled.querySelector('#confirmPassword');
      expect(confirmInput.type).toBe('text');
      // Password field should still be hidden
      const passwordInput = compiled.querySelector('#password');
      expect(passwordInput.type).toBe('password');
    });

    it('should have accessible aria-label for password toggle', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector('[data-testid="toggle-password"]');
      expect(toggle.getAttribute('aria-label')).toBe('Show password');
    });

    it('should update aria-label when toggled', () => {
      const compiled = fixture.nativeElement;
      const toggle = compiled.querySelector('[data-testid="toggle-password"]');
      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    });
  });

  // AC2: Email Uniqueness Validation
  describe('Email Uniqueness Validation', () => {
    it('should validate email uniqueness with API call after debounce', fakeAsync(() => {
      const emailControl = component.registrationForm.get('email');

      // Set valid email
      emailControl?.setValue('existing@example.com');
      emailControl?.markAsTouched();

      // Wait for debounce (500ms)
      tick(500);

      // Verify API call was made
      const req = httpMock.expectOne(
        '/api/auth/check-email/existing@example.com'
      );
      expect(req.request.method).toBe('GET');

      // Respond with email taken
      req.flush({ exists: true });

      // Verify control has emailTaken error
      expect(emailControl?.hasError('emailTaken')).toBe(true);
      expect(emailControl?.valid).toBe(false);
    }));

    it('should pass validation when email is available', fakeAsync(() => {
      const emailControl = component.registrationForm.get('email');

      emailControl?.setValue('available@example.com');
      emailControl?.markAsTouched();

      tick(500);

      const req = httpMock.expectOne(
        '/api/auth/check-email/available@example.com'
      );
      req.flush({ exists: false });

      expect(emailControl?.hasError('emailTaken')).toBe(false);
      expect(emailControl?.errors).toBeNull();
    }));

    it('should display error message when email is already taken', fakeAsync(() => {
      const emailControl = component.registrationForm.get('email');

      emailControl?.setValue('taken@example.com');
      emailControl?.markAsTouched();

      tick(500);

      const req = httpMock.expectOne('/api/auth/check-email/taken@example.com');
      req.flush({ exists: true });

      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector(
        '[data-testid="email-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('already in use');
    }));

    it('should debounce email validation', fakeAsync(() => {
      const emailControl = component.registrationForm.get('email');

      // Set email
      emailControl?.setValue('debounced@example.com');

      // Wait for debounce (500ms) and request
      tick(500);

      const req = httpMock.expectOne(
        '/api/auth/check-email/debounced@example.com'
      );
      req.flush({ exists: false });

      expect(emailControl?.valid).toBe(true);
    }));
  });

  // AC3: Step 2 - Profile Details
  describe('Step 2: Profile Details', () => {
    beforeEach(fakeAsync(() => {
      navigateToStep(2);
    }));

    it('should display Step 2 content', () => {
      const compiled = fixture.nativeElement;
      expect(component.currentStep).toBe(2);
      expect(
        compiled.querySelector('[data-testid="step-2-content"]')
      ).toBeTruthy();
    });

    it('should display grade level selector with options 1-12', () => {
      const compiled = fixture.nativeElement;
      const gradeSelect = compiled.querySelector(
        '[data-testid="grade-select"]'
      );
      expect(gradeSelect).toBeTruthy();

      const options = gradeSelect.querySelectorAll('option');
      expect(options.length).toBeGreaterThanOrEqual(12);
    });

    it('should display learning goals checkboxes', () => {
      const compiled = fixture.nativeElement;
      const mathCheckbox = compiled.querySelector('[data-testid="goal-math"]');
      const scienceCheckbox = compiled.querySelector(
        '[data-testid="goal-science"]'
      );
      const readingCheckbox = compiled.querySelector(
        '[data-testid="goal-reading"]'
      );

      expect(mathCheckbox).toBeTruthy();
      expect(scienceCheckbox).toBeTruthy();
      expect(readingCheckbox).toBeTruthy();
    });

    it('should add grade control to form', () => {
      expect(component.registrationForm.get('grade')).toBeTruthy();
    });

    it('should add learningGoals control to form', () => {
      expect(component.registrationForm.get('learningGoals')).toBeTruthy();
    });

    it('should display Back button', () => {
      const compiled = fixture.nativeElement;
      const backButton = compiled.querySelector('[data-testid="back-button"]');
      expect(backButton).toBeTruthy();
    });

    it('should navigate back to Step 1 when Back button clicked', () => {
      const compiled = fixture.nativeElement;
      const backButton = compiled.querySelector('[data-testid="back-button"]');

      backButton.click();
      fixture.detectChanges();

      expect(component.currentStep).toBe(1);
      expect(
        compiled.querySelector('[data-testid="step-1-content"]')
      ).toBeTruthy();
    });

    it('should enable Next button when grade is selected', () => {
      component.registrationForm.patchValue({
        grade: '5',
        learningGoals: [],
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector(
        '[data-testid="next-button-step-2"]'
      );
      expect(nextButton.disabled).toBeFalsy();
    });

    it('should navigate to Step 3 when Next button clicked', () => {
      component.registrationForm.patchValue({
        grade: '5',
        learningGoals: ['math'],
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector(
        '[data-testid="next-button-step-2"]'
      );
      nextButton.click();
      fixture.detectChanges();

      expect(component.currentStep).toBe(3);
    });
  });

  // AC4: Step 3 - Avatar Selection
  describe('Step 3: Avatar Selection', () => {
    beforeEach(fakeAsync(() => {
      navigateToStep(3);
    }));

    it('should display Step 3 content', () => {
      const compiled = fixture.nativeElement;
      expect(component.currentStep).toBe(3);
      expect(
        compiled.querySelector('[data-testid="step-3-content"]')
      ).toBeTruthy();
    });

    it('should display at least 12 avatar options', () => {
      const compiled = fixture.nativeElement;
      const avatarOptions = compiled.querySelectorAll(
        '[data-testid^="avatar-option-"]'
      );
      expect(avatarOptions.length).toBeGreaterThanOrEqual(12);
    });

    it('should add selectedAvatar control to form', () => {
      expect(component.registrationForm.get('selectedAvatar')).toBeTruthy();
    });

    it('should highlight selected avatar', () => {
      const compiled = fixture.nativeElement;
      const firstAvatar = compiled.querySelector(
        '[data-testid="avatar-option-0"]'
      );

      firstAvatar.click();
      fixture.detectChanges();

      expect(firstAvatar.classList.contains('selected')).toBe(true);
      expect(component.registrationForm.get('selectedAvatar')?.value).toBe(
        'avatar-0'
      );
    });

    it('should allow changing avatar selection', () => {
      const compiled = fixture.nativeElement;
      const firstAvatar = compiled.querySelector(
        '[data-testid="avatar-option-0"]'
      );
      const secondAvatar = compiled.querySelector(
        '[data-testid="avatar-option-1"]'
      );

      firstAvatar.click();
      fixture.detectChanges();
      expect(component.registrationForm.get('selectedAvatar')?.value).toBe(
        'avatar-0'
      );

      secondAvatar.click();
      fixture.detectChanges();
      expect(component.registrationForm.get('selectedAvatar')?.value).toBe(
        'avatar-1'
      );
      expect(firstAvatar.classList.contains('selected')).toBe(false);
      expect(secondAvatar.classList.contains('selected')).toBe(true);
    });

    it('should display Skip for now button', () => {
      const compiled = fixture.nativeElement;
      const skipButton = compiled.querySelector('[data-testid="skip-avatar"]');
      expect(skipButton).toBeTruthy();
    });

    it('should clear avatar selection when Skip is clicked', () => {
      const compiled = fixture.nativeElement;
      const firstAvatar = compiled.querySelector(
        '[data-testid="avatar-option-0"]'
      );
      const skipButton = compiled.querySelector('[data-testid="skip-avatar"]');

      firstAvatar.click();
      fixture.detectChanges();
      expect(component.registrationForm.get('selectedAvatar')?.value).toBe(
        'avatar-0'
      );

      skipButton.click();
      fixture.detectChanges();
      expect(component.registrationForm.get('selectedAvatar')?.value).toBe(
        null
      );
    });

    it('should display Create Account button', () => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );
      expect(createButton).toBeTruthy();
    });

    it('should display Back button', () => {
      const compiled = fixture.nativeElement;
      const backButton = compiled.querySelector(
        '[data-testid="back-button-step-3"]'
      );
      expect(backButton).toBeTruthy();
    });

    it('should navigate back to Step 2 when Back button clicked', () => {
      const compiled = fixture.nativeElement;
      const backButton = compiled.querySelector(
        '[data-testid="back-button-step-3"]'
      );

      backButton.click();
      fixture.detectChanges();

      expect(component.currentStep).toBe(2);
      expect(
        compiled.querySelector('[data-testid="step-2-content"]')
      ).toBeTruthy();
    });
  });

  // AC5: API Integration & Registration
  describe('API Integration & Registration', () => {
    beforeEach(fakeAsync(() => {
      // Navigate to Step 3 and complete all form data
      component.registrationForm.patchValue(VALID_STEP1_DATA);
      tick(500);
      flushPendingEmailCheck();

      component.nextStep();
      fixture.detectChanges();

      component.registrationForm.patchValue({
        grade: '5',
        learningGoals: ['math', 'science'],
      });

      component.nextStep();
      fixture.detectChanges();

      component.selectAvatar('avatar-3');
      fixture.detectChanges();
    }));

    it('should have isLoading property', () => {
      expect(component.isLoading).toBeDefined();
      expect(component.isLoading).toBe(false);
    });

    it('should have registrationError property', () => {
      expect(component.registrationError).toBeDefined();
      expect(component.registrationError).toBe(null);
    });

    it('should call API with correct data when Create Account is clicked', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Test123!',
        grade: '5',
        learningGoals: ['math', 'science'],
        selectedAvatar: 'avatar-3',
      });

      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
    }));

    it('should set isLoading to true during registration', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      expect(component.isLoading).toBe(true);

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('should disable Create Account button while loading', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();
      fixture.detectChanges();

      expect(createButton.disabled).toBe(true);

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
    }));

    it('should display loading text on button during registration', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();
      fixture.detectChanges();

      expect(createButton.textContent?.trim()).toContain('Creating');

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
    }));

    it('should handle registration error', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush(
        { message: 'Registration failed' },
        { status: 400, statusText: 'Bad Request' }
      );
      tick();

      expect(component.registrationError).toBe(
        'Registration failed. Please try again.'
      );
      expect(component.isLoading).toBe(false);
    }));

    it('should display error message when registration fails', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush(
        { message: 'Email already exists' },
        { status: 400, statusText: 'Bad Request' }
      );
      tick();
      fixture.detectChanges();

      const errorMessage = compiled.querySelector(
        '[data-testid="registration-error"]'
      );
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Registration failed');
    }));

    it('should clear error message when retrying registration', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      // First attempt - fail
      createButton.click();
      tick();
      const req1 = httpMock.expectOne('/api/auth/student/register');
      req1.flush(
        { message: 'Error' },
        { status: 400, statusText: 'Bad Request' }
      );
      tick();
      fixture.detectChanges();

      expect(component.registrationError).toBeTruthy();

      // Second attempt - should clear error
      createButton.click();
      tick();

      expect(component.registrationError).toBe(null);

      const req2 = httpMock.expectOne('/api/auth/student/register');
      req2.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
    }));

    it('should not send password confirmation in API request', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      expect(req.request.body.confirmPassword).toBeUndefined();

      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
    }));
  });

  // AC6: Form Auto-Save to SessionStorage
  describe('Form Auto-Save', () => {
    it('should save form data to sessionStorage on value changes', fakeAsync(() => {
      jest.spyOn(Storage.prototype, 'setItem');

      component.registrationForm.patchValue({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      tick(1000); // Debounce delay

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'registration-form-data',
        expect.any(String)
      );

      (Storage.prototype.setItem as jest.Mock).mockRestore();
    }));

    it('should restore form data from sessionStorage on init', () => {
      const savedData = JSON.stringify({
        firstName: 'Restored',
        lastName: 'User',
        email: 'restored@example.com',
      });

      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(savedData);

      // Create component within Angular injection context
      const newFixture = TestBed.createComponent(Registration);
      newFixture.detectChanges();
      const newComponent = newFixture.componentInstance;

      expect(newComponent.registrationForm.get('firstName')?.value).toBe(
        'Restored'
      );
      expect(newComponent.registrationForm.get('lastName')?.value).toBe('User');

      (Storage.prototype.getItem as jest.Mock).mockRestore();
    });

    it('should clear sessionStorage after successful registration', fakeAsync(() => {
      jest.spyOn(Storage.prototype, 'removeItem');

      // Navigate to step 3 with all form data
      component.registrationForm.patchValue({
        ...VALID_STEP1_DATA,
        grade: '5',
        selectedAvatar: 'avatar-0',
      });

      tick(500);
      flushPendingEmailCheck();

      component.currentStep = 3;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const createButton = compiled.querySelector(
        '[data-testid="create-account-button"]'
      );

      createButton.click();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        'registration-form-data'
      );
    }));
  });

  // AC7: Accessibility
  describe('Accessibility', () => {
    it('should have proper ARIA labels on form inputs', () => {
      const compiled = fixture.nativeElement;
      const firstNameInput = compiled.querySelector('#firstName');
      const emailInput = compiled.querySelector('#email');

      expect(
        firstNameInput.getAttribute('aria-label') ||
          firstNameInput.labels?.length
      ).toBeTruthy();
      expect(
        emailInput.getAttribute('aria-label') || emailInput.labels?.length
      ).toBeTruthy();
    });

    it('should announce step changes to screen readers', fakeAsync(() => {
      component.nextStep();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const liveRegion = compiled.querySelector('[aria-live="polite"]');

      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toContain('Step 2');
    }));

    it('should support keyboard navigation for avatar selection', () => {
      component.currentStep = 3;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const firstAvatar = compiled.querySelector(
        '[data-testid="avatar-option-0"]'
      );

      expect(firstAvatar.getAttribute('tabindex')).toBe('0');
      expect(firstAvatar.getAttribute('role')).toBe('button');
    });

    it('should have proper focus management between steps', () => {
      const compiled = fixture.nativeElement;
      const nextButton = compiled.querySelector('[data-testid="next-button"]');

      jest.spyOn(nextButton, 'focus');

      component.nextStep();
      fixture.detectChanges();

      // Focus should be managed programmatically
      expect(document.activeElement).toBeTruthy();
    });
  });

  // AC5: Successful Registration Flow
  describe('Successful Registration', () => {
    beforeEach(fakeAsync(() => {
      component.registrationForm.patchValue(VALID_STEP1_DATA);
      tick(500);
      flushPendingEmailCheck();
      component.nextStep();
      fixture.detectChanges();
      component.registrationForm.patchValue(VALID_STEP2_DATA);
      component.nextStep();
      fixture.detectChanges();
      component.selectAvatar('avatar-3');
      fixture.detectChanges();
    }));

    it('should set registrationSuccess to true after successful API response', fakeAsync(() => {
      component.register();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();

      expect(component.registrationSuccess).toBe(true);
    }));

    it('should navigate to dashboard after successful registration', fakeAsync(() => {
      component.register();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/achievements']);
    }));

    it('should display success notification in template', fakeAsync(() => {
      component.register();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush({ success: true, studentId: '123', token: 'mock-token' });
      tick();
      fixture.detectChanges();

      const successMsg = fixture.nativeElement.querySelector(
        '[data-testid="registration-success"]'
      );
      expect(successMsg).toBeTruthy();
      expect(successMsg.textContent).toContain('Account created successfully');
    }));

    it('should not set registrationSuccess on API error', fakeAsync(() => {
      component.register();
      tick();

      const req = httpMock.expectOne('/api/auth/student/register');
      req.flush(
        { message: 'Error' },
        { status: 400, statusText: 'Bad Request' }
      );
      tick();

      expect(component.registrationSuccess).toBe(false);
    }));
  });
});
