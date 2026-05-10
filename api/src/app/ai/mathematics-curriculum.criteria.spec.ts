import {
  MATHEMATICS_CURRICULUM,
  getMathematicsTopicCriteria,
  getMathematicsYearPlan,
} from './mathematics-curriculum.criteria';

describe('Mathematics Curriculum Criteria', () => {
  it('should cover years 0 through 10', () => {
    expect(MATHEMATICS_CURRICULUM.years.map((entry) => entry.year)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('should return a year plan for Year 9', () => {
    const yearPlan = getMathematicsYearPlan(9);

    expect(yearPlan).not.toBeNull();
    expect(yearPlan?.phase).toBe('Phase 4');
    expect(yearPlan?.topics.length).toBeGreaterThan(0);
  });

  it('should resolve current legacy topic keys for existing math generation topics', () => {
    const topic = getMathematicsTopicCriteria(3, 'ADDITION');

    expect(topic).not.toBeNull();
    expect(topic?.key).toBe('WHOLE_NUMBER_OPERATIONS');
    expect(topic?.legacyTopicKeys).toContain('ADDITION');
  });

  it('should expose difficulty criteria for every topic in a year plan', () => {
    const yearPlan = getMathematicsYearPlan(8);

    expect(yearPlan).not.toBeNull();
    for (const topic of yearPlan?.topics ?? []) {
      expect(topic.criteria.easy.requiredSkills.length).toBeGreaterThan(0);
      expect(topic.criteria.medium.constraints.length).toBeGreaterThan(0);
      expect(topic.criteria.hard.assessmentCriteria.length).toBeGreaterThan(0);
    }
  });
});
