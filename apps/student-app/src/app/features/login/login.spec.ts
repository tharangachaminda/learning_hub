/**
 * Login Component - Unit Tests
 *
 * Test Strategy: Validate login form structure and AC1 UI elements
 * - AC1: Login form display (email, password, remember me, login button, links)
 * - AC2: Form controls exist with correct validators
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Login } from './login';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent {}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'dashboard', component: DummyComponent },
          { path: 'register', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Structure', () => {
    /**
     * Test: Login form has required controls (AC1, AC2)
     * Why Essential: Reactive form must have email, password, rememberMe controls
     * Impact: Form cannot collect credentials without these controls
     */
    it('should create a loginForm with email, password, and rememberMe controls', () => {
      expect(component.loginForm).toBeTruthy();
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
      expect(component.loginForm.get('rememberMe')).toBeTruthy();
    });

    /**
     * Test: Email field has required and email validators (AC2)
     * Why Essential: Email validation is core acceptance criteria
     * Impact: Invalid emails accepted, breaking authentication flow
     */
    it('should have required and email validators on email control', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    /**
     * Test: Password field has required validator (AC2)
     * Why Essential: Empty password must not be submitted
     * Impact: Empty password submissions to API
     */
    it('should have required validator on password control', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('anypassword');
      expect(passwordControl?.valid).toBe(true);
    });

    /**
     * Test: RememberMe defaults to false (AC1)
     * Why Essential: Default state per UX — opt-in only
     * Impact: Accidental persistent sessions without user consent
     */
    it('should default rememberMe to false', () => {
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });
  });

  describe('AC1: Login Form Display', () => {
    /**
     * Test: Email input field is rendered (AC1)
     * Why Essential: User must see email input to enter credentials
     * Impact: No way to enter email address
     */
    it('should render email input field', () => {
      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      );
      expect(emailInput).toBeTruthy();
      expect(emailInput.nativeElement.type).toBe('email');
    });

    /**
     * Test: Password input field is rendered (AC1)
     * Why Essential: User must see password input to enter credentials
     * Impact: No way to enter password
     */
    it('should render password input field', () => {
      const passwordInput = fixture.debugElement.query(
        By.css('input[formControlName="password"]')
      );
      expect(passwordInput).toBeTruthy();
    });

    /**
     * Test: Remember me checkbox is rendered (AC1)
     * Why Essential: User must be able to opt-in to persistent sessions
     * Impact: Cannot choose session persistence preference
     */
    it('should render remember me checkbox', () => {
      const checkbox = fixture.debugElement.query(
        By.css('input[formControlName="rememberMe"]')
      );
      expect(checkbox).toBeTruthy();
      expect(checkbox.nativeElement.type).toBe('checkbox');
    });

    /**
     * Test: Login button is rendered (AC1)
     * Why Essential: User must have a way to submit the form
     * Impact: Cannot submit login credentials
     */
    it('should render login button', () => {
      const loginButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(loginButton).toBeTruthy();
      expect(loginButton.nativeElement.textContent.trim()).toContain('Login');
    });

    /**
     * Test: Login button is disabled when form is invalid (AC1)
     * Why Essential: Prevents submission of incomplete/invalid credentials
     * Impact: Invalid API requests sent with empty fields
     */
    it('should disable login button when form is invalid', () => {
      const loginButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(loginButton.nativeElement.disabled).toBe(true);
    });

    /**
     * Test: Login button is enabled when form is valid (AC1)
     * Why Essential: User must be able to submit valid credentials
     * Impact: Button stays disabled even with valid data
     */
    it('should enable login button when form is valid', () => {
      component.loginForm.patchValue({
        email: 'student@example.com',
        password: 'Password123!',
      });
      fixture.detectChanges();

      const loginButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(loginButton.nativeElement.disabled).toBe(false);
    });

    /**
     * Test: Forgot Password link is rendered (AC1)
     * Why Essential: AC1 requires "Forgot Password?" link
     * Impact: Missing required UI element per acceptance criteria
     */
    it('should render "Forgot Password?" link', () => {
      const forgotLink = fixture.debugElement.query(
        By.css('[data-testid="forgot-password-link"]')
      );
      expect(forgotLink).toBeTruthy();
      expect(forgotLink.nativeElement.textContent.trim()).toContain(
        'Forgot Password?'
      );
    });

    /**
     * Test: Sign up link is rendered (AC1)
     * Why Essential: AC1 requires "Don't have an account? Sign up" link
     * Impact: Missing required UI element per acceptance criteria
     */
    it('should render "Don\'t have an account? Sign up" link', () => {
      const signupLink = fixture.debugElement.query(
        By.css('[data-testid="signup-link"]')
      );
      expect(signupLink).toBeTruthy();
      expect(signupLink.nativeElement.textContent).toContain('Sign up');
    });

    /**
     * Test: Sign up link navigates to /register (AC1)
     * Why Essential: Clicking "Sign up" must open the registration form
     * Impact: Users would be unable to reach registration from login page
     */
    it('should link sign up to /register route', () => {
      const signupLink = fixture.debugElement.query(
        By.css('[data-testid="signup-link"]')
      );
      expect(signupLink.nativeElement.getAttribute('href')).toBe('/register');
    });
  });

  describe('Component State', () => {
    /**
     * Test: Initial loading state is false
     * Why Essential: Form should not show loading state on initial render
     * Impact: User sees spinner before interacting with form
     */
    it('should initialize with isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });

    /**
     * Test: Initial error message is null
     * Why Essential: No errors should be displayed on initial load
     * Impact: User sees error message before attempting login
     */
    it('should initialize with loginError as null', () => {
      expect(component.loginError).toBeNull();
    });

    /**
     * Test: Initial failed attempts counter is zero
     * Why Essential: CAPTCHA logic (AC4) depends on accurate counter
     * Impact: CAPTCHA shown prematurely or never shown
     */
    it('should initialize with failedAttempts as 0', () => {
      expect(component.failedAttempts).toBe(0);
    });
  });

  describe('AC2: Form Validation Display', () => {
    /**
     * Test: Email required error shows after touch (AC2)
     * Why Essential: Inline errors must appear below invalid fields after interaction
     * Impact: User gets no feedback that email is required
     */
    it('should show email required error when field is touched and empty', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(By.css('#email-error'));
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent).toContain('Email is required');
    });

    /**
     * Test: Email format error shows for invalid email (AC2)
     * Why Essential: Real-time format validation per acceptance criteria
     * Impact: User submits malformed email with no guidance
     */
    it('should show email format error when email is invalid', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('not-an-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(By.css('#email-error'));
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent).toContain(
        'Please enter a valid email address'
      );
    });

    /**
     * Test: Email error disappears when corrected (AC2)
     * Why Essential: Real-time validation means errors clear when input becomes valid
     * Impact: Stale error messages confuse users after correction
     */
    it('should hide email error when valid email is entered', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      // Error should be visible
      expect(fixture.debugElement.query(By.css('#email-error'))).toBeTruthy();

      // Correct the email
      emailControl?.setValue('valid@example.com');
      fixture.detectChanges();

      // Error should disappear
      expect(fixture.debugElement.query(By.css('#email-error'))).toBeFalsy();
    });

    /**
     * Test: Password required error shows after touch (AC2)
     * Why Essential: Inline errors must appear for password field too
     * Impact: User gets no feedback that password is required
     */
    it('should show password required error when field is touched and empty', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(By.css('#password-error'));
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent).toContain(
        'Password is required'
      );
    });

    /**
     * Test: Password error disappears when filled (AC2)
     * Why Essential: Errors clear in real-time when corrected
     * Impact: Stale error after user types password
     */
    it('should hide password error when password is entered', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('#password-error'))
      ).toBeTruthy();

      passwordControl?.setValue('somepassword');
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('#password-error'))).toBeFalsy();
    });

    /**
     * Test: No error messages shown on initial load (AC2)
     * Why Essential: Errors should not appear until user interacts
     * Impact: Intimidating UX with errors before any interaction
     */
    it('should not show any error messages before fields are touched', () => {
      const emailError = fixture.debugElement.query(By.css('#email-error'));
      const passwordError = fixture.debugElement.query(
        By.css('#password-error')
      );

      expect(emailError).toBeFalsy();
      expect(passwordError).toBeFalsy();
    });

    /**
     * Test: Required field indicators are visible (AC2)
     * Why Essential: AC2 requires visible required field indicators
     * Impact: User cannot distinguish required from optional fields
     */
    it('should display required field indicators (* symbols)', () => {
      const indicators = fixture.debugElement.queryAll(
        By.css('.required-indicator')
      );
      expect(indicators.length).toBeGreaterThanOrEqual(2); // email and password
      expect(indicators[0].nativeElement.textContent.trim()).toBe('*');
    });

    /**
     * Test: Error messages have role="alert" for screen readers (AC2, AC6)
     * Why Essential: Error messages must be announced to screen readers
     * Impact: Assistive technology users get no validation feedback
     */
    it('should use role="alert" on error message containers', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(By.css('#email-error'));
      expect(errorEl.nativeElement.getAttribute('role')).toBe('alert');
    });
  });

  describe('AC3: Successful Authentication', () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: {
        id: 'student-001',
        email: 'student@example.com',
        name: 'Test Student',
        role: 'student',
      },
    };

    /**
     * Helper: Fill form with valid credentials.
     */
    function fillValidCredentials(): void {
      component.loginForm.patchValue({
        email: 'student@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
      fixture.detectChanges();
    }

    /**
     * Test: onSubmit calls AuthService.login with form values (AC3)
     * Why Essential: Core auth flow — form submission must trigger API call
     * Impact: Login button does nothing without this
     */
    it('should call authService.login with form values on submit', () => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      fillValidCredentials();
      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
    });

    /**
     * Test: isLoading becomes true during authentication (AC3)
     * Why Essential: AC3 requires loading spinner on button during auth
     * Impact: No visual feedback that login is processing
     */
    it('should set isLoading to true while authentication is in progress', fakeAsync(() => {
      const authService = TestBed.inject(AuthService);
      jest
        .spyOn(authService, 'login')
        .mockReturnValue(of(mockLoginResponse).pipe(delay(100)));

      fillValidCredentials();
      component.onSubmit();

      expect(component.isLoading).toBe(true);

      tick(100);
      expect(component.isLoading).toBe(false);
    }));

    /**
     * Test: Form is disabled during authentication (AC3)
     * Why Essential: AC3 requires form to be disabled during auth
     * Impact: User can submit multiple times causing duplicate requests
     */
    it('should show loading text on button during authentication', fakeAsync(() => {
      const authService = TestBed.inject(AuthService);
      jest
        .spyOn(authService, 'login')
        .mockReturnValue(of(mockLoginResponse).pipe(delay(100)));

      fillValidCredentials();
      component.onSubmit();
      fixture.detectChanges();

      const loginButton = fixture.debugElement.query(
        By.css('button[type="submit"]')
      );
      expect(loginButton.nativeElement.textContent).toContain('Logging in...');
      expect(loginButton.nativeElement.disabled).toBe(true);

      tick(100);
    }));

    /**
     * Test: Router navigates to dashboard on success (AC3)
     * Why Essential: AC3 requires redirect to Student Dashboard on success
     * Impact: User stays on login page after successful authentication
     */
    it('should navigate to dashboard on successful login', fakeAsync(() => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));
      const navigateSpy = jest.spyOn(router, 'navigate');

      fillValidCredentials();
      component.onSubmit();
      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    }));

    /**
     * Test: isLoading resets to false after success (AC3)
     * Why Essential: Loading state must clear for subsequent interactions
     * Impact: Permanent loading state after login
     */
    it('should set isLoading to false after successful login', fakeAsync(() => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      fillValidCredentials();
      component.onSubmit();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    /**
     * Test: loginError is cleared on successful login (AC3)
     * Why Essential: Previous error messages should clear on success
     * Impact: Stale error displayed alongside successful redirect
     */
    it('should clear loginError on successful login', fakeAsync(() => {
      component.loginError = 'Previous error';
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      fillValidCredentials();
      component.onSubmit();
      tick();

      expect(component.loginError).toBeNull();
    }));

    /**
     * Test: Does not submit when form is invalid (AC3)
     * Why Essential: Guard against invalid submissions bypassing disabled button
     * Impact: API called with empty/invalid credentials
     */
    it('should not call authService.login if form is invalid', () => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      // Form is invalid (empty)
      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('AC4: Failed Authentication', () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: {
        id: 'student-001',
        email: 'student@example.com',
        name: 'Test Student',
        role: 'student',
      },
    };

    /**
     * Helper: Fill form with valid credentials.
     */
    function fillValidCredentials(): void {
      component.loginForm.patchValue({
        email: 'student@example.com',
        password: 'WrongPassword!',
        rememberMe: false,
      });
      fixture.detectChanges();
    }

    /**
     * Helper: Simulate a failed login attempt.
     */
    function simulateFailedLogin(): void {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(
        throwError(() => ({
          status: 401,
          error: { message: 'Invalid email or password' },
        }))
      );

      fillValidCredentials();
      component.onSubmit();
      fixture.detectChanges();
    }

    /**
     * Test: Display "Invalid email or password" error on 401 (AC4)
     * Why Essential: AC4 specifies exact error message text for failed auth
     * Impact: User gets no feedback on why login failed
     */
    it('should display "Invalid email or password" error on failed authentication', () => {
      simulateFailedLogin();

      expect(component.loginError).toBe('Invalid email or password');
    });

    /**
     * Test: Error message visible in DOM (AC4)
     * Why Essential: Error must render in template, not just exist on component
     * Impact: Error stored in state but never displayed to user
     */
    it('should render the login error message in the template', () => {
      simulateFailedLogin();

      const errorEl = fixture.debugElement.query(
        By.css('[data-testid="login-error"]')
      );
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent.trim()).toBe(
        'Invalid email or password'
      );
    });

    /**
     * Test: Password field cleared after failure (AC4)
     * Why Essential: AC4 requires password field to be cleared
     * Impact: Stale password stays in field — security risk and bad UX
     */
    it('should clear the password field after failed authentication', () => {
      simulateFailedLogin();

      expect(component.loginForm.get('password')?.value).toBe('');
    });

    /**
     * Test: Form remains enabled for retry (AC4)
     * Why Essential: AC4 requires form to stay enabled for retry
     * Impact: User locked out of form after first failure
     */
    it('should set isLoading to false after failed authentication', () => {
      simulateFailedLogin();

      expect(component.isLoading).toBe(false);
    });

    /**
     * Test: failedAttempts increments on each failure (AC4)
     * Why Essential: Counter drives CAPTCHA logic after 3 failures
     * Impact: CAPTCHA never triggers or triggers at wrong count
     */
    it('should increment failedAttempts on each failed login', () => {
      expect(component.failedAttempts).toBe(0);

      simulateFailedLogin();
      expect(component.failedAttempts).toBe(1);

      simulateFailedLogin();
      expect(component.failedAttempts).toBe(2);
    });

    /**
     * Test: showCaptcha becomes true after 3 failures (AC4)
     * Why Essential: AC4 requires CAPTCHA verification after 3 failed attempts
     * Impact: No brute-force protection on frontend
     */
    it('should set showCaptcha to true after 3 failed attempts', () => {
      expect(component.showCaptcha).toBe(false);

      simulateFailedLogin(); // 1
      simulateFailedLogin(); // 2
      expect(component.showCaptcha).toBe(false);

      simulateFailedLogin(); // 3
      expect(component.showCaptcha).toBe(true);
    });

    /**
     * Test: CAPTCHA placeholder visible in DOM after 3 failures (AC4)
     * Why Essential: CAPTCHA must be rendered, not just a flag
     * Impact: Flag set but CAPTCHA never appears to user
     */
    it('should render CAPTCHA placeholder after 3 failed attempts', () => {
      simulateFailedLogin(); // 1
      simulateFailedLogin(); // 2
      simulateFailedLogin(); // 3

      const captchaEl = fixture.debugElement.query(
        By.css('[data-testid="captcha-container"]')
      );
      expect(captchaEl).toBeTruthy();
    });

    /**
     * Test: failedAttempts resets on successful login (AC4)
     * Why Essential: Counter must reset so CAPTCHA doesn't persist after success
     * Impact: CAPTCHA permanently shown even after successful login
     */
    it('should reset failedAttempts on successful login', fakeAsync(() => {
      // Fail twice first
      simulateFailedLogin();
      simulateFailedLogin();
      expect(component.failedAttempts).toBe(2);

      // Now succeed
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));
      fillValidCredentials();
      component.onSubmit();
      tick();

      expect(component.failedAttempts).toBe(0);
      expect(component.showCaptcha).toBe(false);
    }));
  });

  describe('AC1: Password Show/Hide Toggle', () => {
    /**
     * Test: Password input starts as type="password" (AC1)
     * Why Essential: Password must be masked by default for security
     * Impact: Password visible in plain text on page load
     */
    it('should render password input with type "password" by default', () => {
      const passwordInput = fixture.debugElement.query(
        By.css('input[formControlName="password"]')
      );
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    /**
     * Test: Toggle changes input type to "text" (AC1)
     * Why Essential: AC1 requires show/hide toggle that reveals password
     * Impact: Toggle button present but does not change visibility
     */
    it('should change password input type to "text" when toggle is clicked', () => {
      const toggleBtn = fixture.debugElement.query(
        By.css('[data-testid="password-toggle"]')
      );
      toggleBtn.nativeElement.click();
      fixture.detectChanges();

      const passwordInput = fixture.debugElement.query(
        By.css('input[formControlName="password"]')
      );
      expect(passwordInput.nativeElement.type).toBe('text');
    });

    /**
     * Test: Second toggle click hides password again (AC1)
     * Why Essential: Toggle must be reversible — show then hide
     * Impact: Password permanently visible after first toggle
     */
    it('should change password input type back to "password" on second toggle', () => {
      const toggleBtn = fixture.debugElement.query(
        By.css('[data-testid="password-toggle"]')
      );
      toggleBtn.nativeElement.click();
      fixture.detectChanges();
      toggleBtn.nativeElement.click();
      fixture.detectChanges();

      const passwordInput = fixture.debugElement.query(
        By.css('input[formControlName="password"]')
      );
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    /**
     * Test: Toggle button label changes from "Show" to "Hide" (AC1)
     * Why Essential: Button text must indicate current action
     * Impact: Confusing UX — button always says "Show" even when password is visible
     */
    it('should show "Show" label initially and "Hide" after toggle', () => {
      const toggleBtn = fixture.debugElement.query(
        By.css('[data-testid="password-toggle"]')
      );
      expect(toggleBtn.nativeElement.textContent.trim()).toBe('Show');

      toggleBtn.nativeElement.click();
      fixture.detectChanges();

      expect(toggleBtn.nativeElement.textContent.trim()).toBe('Hide');
    });

    /**
     * Test: Toggle button has correct aria-label (AC1, AC6)
     * Why Essential: Screen readers need descriptive label for toggle action
     * Impact: Assistive technology users cannot understand toggle purpose
     */
    it('should update aria-label on toggle for accessibility', () => {
      const toggleBtn = fixture.debugElement.query(
        By.css('[data-testid="password-toggle"]')
      );
      expect(toggleBtn.nativeElement.getAttribute('aria-label')).toBe(
        'Show password'
      );

      toggleBtn.nativeElement.click();
      fixture.detectChanges();

      expect(toggleBtn.nativeElement.getAttribute('aria-label')).toBe(
        'Hide password'
      );
    });
  });

  describe('AC3: Remember Me Integration', () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: {
        id: 'student-001',
        email: 'student@example.com',
        name: 'Test Student',
        role: 'student',
      },
    };

    /**
     * Test: rememberMe true is passed to AuthService (AC3)
     * Why Essential: AC3 requires session persistence when remember me is checked
     * Impact: Remember me checkbox has no effect on token storage
     */
    it('should pass rememberMe: true to authService when checkbox is checked', () => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      component.loginForm.patchValue({
        email: 'student@example.com',
        password: 'Password123!',
        rememberMe: true,
      });
      fixture.detectChanges();

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: true })
      );
    });

    /**
     * Test: rememberMe false is passed to AuthService (AC3)
     * Why Essential: Unchecked state must be explicit false for sessionStorage
     * Impact: Always uses localStorage regardless of checkbox
     */
    it('should pass rememberMe: false to authService when checkbox is unchecked', () => {
      const authService = TestBed.inject(AuthService);
      jest.spyOn(authService, 'login').mockReturnValue(of(mockLoginResponse));

      component.loginForm.patchValue({
        email: 'student@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
      fixture.detectChanges();

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: false })
      );
    });
  });

  describe('AC6: Accessibility', () => {
    /**
     * Test: Email label is linked to email input via for/id (AC6)
     * Why Essential: Screen readers require label-input association
     * Impact: Screen reader announces "edit text" with no label context
     */
    it('should have email label linked to email input via for/id', () => {
      const label = fixture.debugElement.query(By.css('label[for="email"]'));
      const input = fixture.debugElement.query(By.css('#email'));
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(label.nativeElement.getAttribute('for')).toBe(
        input.nativeElement.getAttribute('id')
      );
    });

    /**
     * Test: Password label is linked to password input via for/id (AC6)
     * Why Essential: Screen readers require label-input association
     * Impact: Screen reader announces "edit text" with no label context
     */
    it('should have password label linked to password input via for/id', () => {
      const label = fixture.debugElement.query(By.css('label[for="password"]'));
      const input = fixture.debugElement.query(By.css('#password'));
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(label.nativeElement.getAttribute('for')).toBe(
        input.nativeElement.getAttribute('id')
      );
    });

    /**
     * Test: Email input has aria-describedby linking to error container (AC6)
     * Why Essential: Screen readers must announce error when it appears
     * Impact: User hears no error context even when validation fails
     */
    it('should have aria-describedby on email input pointing to error', () => {
      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      );
      expect(emailInput.nativeElement.getAttribute('aria-describedby')).toBe(
        'email-error'
      );
    });

    /**
     * Test: Password input has aria-describedby linking to error container (AC6)
     * Why Essential: Screen readers must announce error when it appears
     * Impact: User hears no error context even when validation fails
     */
    it('should have aria-describedby on password input pointing to error', () => {
      const passwordInput = fixture.debugElement.query(
        By.css('input[formControlName="password"]')
      );
      expect(passwordInput.nativeElement.getAttribute('aria-describedby')).toBe(
        'password-error'
      );
    });

    /**
     * Test: Email input sets aria-invalid when touched and invalid (AC6)
     * Why Essential: Screen readers need to know field is in error state
     * Impact: No programmatic error indication for assistive technology
     */
    it('should set aria-invalid on email when touched and invalid', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      );
      expect(emailInput.nativeElement.getAttribute('aria-invalid')).toBe(
        'true'
      );
    });

    /**
     * Test: aria-invalid is not set when email is valid (AC6)
     * Why Essential: False positives confuse screen reader users
     * Impact: Valid field announced as invalid
     */
    it('should not set aria-invalid on email when valid', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('valid@example.com');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[formControlName="email"]')
      );
      const ariaInvalid = emailInput.nativeElement.getAttribute('aria-invalid');
      expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true);
    });

    /**
     * Test: Login error container uses aria-live="assertive" (AC6)
     * Why Essential: Login errors must be immediately announced to screen readers
     * Impact: Screen reader user gets no feedback about authentication failure
     */
    it('should have aria-live="assertive" on login error container', () => {
      component.loginError = 'Invalid email or password';
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(
        By.css('[data-testid="login-error"]')
      );
      expect(errorEl.nativeElement.getAttribute('aria-live')).toBe('assertive');
    });

    /**
     * Test: CAPTCHA container has role="region" and aria-label (AC6)
     * Why Essential: CAPTCHA area must be identified for screen readers
     * Impact: Screen reader cannot navigate to or understand CAPTCHA section
     */
    it('should have role="region" and aria-label on CAPTCHA container', () => {
      component.showCaptcha = true;
      fixture.detectChanges();

      const captchaEl = fixture.debugElement.query(
        By.css('[data-testid="captcha-container"]')
      );
      expect(captchaEl.nativeElement.getAttribute('role')).toBe('region');
      expect(captchaEl.nativeElement.getAttribute('aria-label')).toBe(
        'CAPTCHA verification'
      );
    });

    /**
     * Test: Form heading exists for page structure (AC6)
     * Why Essential: Screen readers use headings for page navigation
     * Impact: No heading landmark for login form section
     */
    it('should have an h1 heading for the login form', () => {
      const heading = fixture.debugElement.query(By.css('h1'));
      expect(heading).toBeTruthy();
      expect(heading.nativeElement.textContent).toContain('Student Login');
    });
  });
});
