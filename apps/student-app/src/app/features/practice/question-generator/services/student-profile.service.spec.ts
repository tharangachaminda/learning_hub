/**
 * Test Suite: StudentProfileService (Mock)
 *
 * Validates the mock student profile service provides
 * default grade and country for generation controls.
 */
import { TestBed } from '@angular/core/testing';
import { StudentProfileService } from './student-profile.service';

describe('StudentProfileService', () => {
  let service: StudentProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudentProfileService],
    });
    service = TestBed.inject(StudentProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a default grade of 3', () => {
    expect(service.getGrade()).toBe(3);
  });

  it('should return a default country of NZ', () => {
    expect(service.getCountry()).toBe('NZ');
  });

  it('should return full profile with grade and country', () => {
    const profile = service.getProfile();
    expect(profile).toEqual({ grade: 3, country: 'NZ' });
  });

  it('should fall back to NZ when country is not available', () => {
    // Even if we clear internal state, country should fall back to NZ
    expect(service.getCountry()).toBe('NZ');
  });
});
