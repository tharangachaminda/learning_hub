export type CurriculumSubject = 'mathematics';

export type CurriculumStrand =
  | 'Number'
  | 'Algebra'
  | 'Measurement'
  | 'Geometry'
  | 'Statistics'
  | 'Probability';

export type CurriculumCoverageStatus = 'seed' | 'expanded' | 'validated';

export type CriteriaDifficulty = 'easy' | 'medium' | 'hard';

export interface TopicDifficultyCriteria {
  cognitiveDemand: string;
  allowedQuestionForms: string[];
  requiredSkills: string[];
  representations: string[];
  constraints: string[];
  assessmentCriteria: string[];
}

export interface CurriculumTopicDefinition {
  key: string;
  label: string;
  strand: CurriculumStrand;
  overview: string;
  learningObjectives: string[];
  prerequisiteIdeas: string[];
  exampleContexts: string[];
  legacyTopicKeys?: string[];
  criteria: Record<CriteriaDifficulty, TopicDifficultyCriteria>;
}

export interface CurriculumYearDefinition {
  year: number;
  phase: string;
  focusSummary: string;
  languageFocus?: string[];
  topics: CurriculumTopicDefinition[];
}

export interface SubjectCurriculumDefinition {
  subject: CurriculumSubject;
  version: string;
  sourceDocument: string;
  extractedFrom: string;
  coverageStatus: CurriculumCoverageStatus;
  years: CurriculumYearDefinition[];
}
