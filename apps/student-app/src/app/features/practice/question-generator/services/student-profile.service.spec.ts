/**
 * Test Suite: StudentProfileService (Mock)
 *
 * Validates the mock student profile service provides
 * default grade and country for generation controls.
 */
import { TestBed } from '@angular/core/testing';
import { StudentProfileService } from './student-profile.service';
import { AuthService } from '../../../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('StudentProfileService', () => {
  let service: StudentProfileService;
  let authService: {
    getUser: jest.Mock;
    getProfile: jest.Mock;
    isAuthenticated: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      getUser: jest.fn(() => ({
        id: 'student-1',
        email: 'student@example.com',
        name: 'Student Example',
        role: 'student',
        profile: { grade: 6 },
      })),
      getProfile: jest.fn(() =>
        of({
          id: 'student-1',
          email: 'student@example.com',
          role: 'student',
          profile: { grade: 6 },
        })
      ),
      isAuthenticated: jest.fn(() => true),
    };

    TestBed.configureTestingModule({
      providers: [
        StudentProfileService,
        { provide: AuthService, useValue: authService },
      ],
    });
    service = TestBed.inject(StudentProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the stored student grade when available', () => {
    expect(service.getGrade()).toBe(6);
  });

  it('should return a default country of NZ', () => {
    expect(service.getCountry()).toBe('NZ');
  });

  it('should return full profile with grade and country', () => {
    const profile = service.getProfile();
    expect(profile).toEqual({ grade: 6, country: 'NZ' });
  });

  it('should fall back to NZ when country is not available', () => {
    expect(service.getCountry()).toBe('NZ');
  });

  it('should refresh grade from the authenticated profile endpoint', () => {
    authService.getProfile.mockReturnValue(
      of({
        id: 'student-1',
        email: 'student@example.com',
        role: 'student',
        profile: { grade: 7 },
      })
    );

    service.loadProfile();

    expect(service.getGrade()).toBe(7);
  });

  it('should keep stored grade when profile refresh fails', () => {
    authService.getProfile.mockReturnValue(
      throwError(() => new Error('profile failed'))
    );

    service.loadProfile();

    expect(service.getGrade()).toBe(6);
  });
});
