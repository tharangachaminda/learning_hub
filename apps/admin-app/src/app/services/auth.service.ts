import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface QuestionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface InviteRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher';
}

export interface InviteResponse {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface StaffUser {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  createdAt: string;
  generatedQuestions: number;
  approvedQuestions: number;
}

export interface StaffStats {
  total: number;
  active: number;
  disabled: number;
  admins: number;
  teachers: number;
}

export interface GradeTopic {
  key: string;
  label: string;
  strand?: string;
  overview?: string;
  legacyTopicKeys?: string[];
  category?: string;
}

export interface SubCategoryItem {
  _id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  name: string;
  slug: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface GradeInfo {
  grade: number;
  year?: number;
  subject?: string;
  phase?: string;
  focusSummary?: string;
  topics: GradeTopic[];
}

export interface SubjectCurriculumInfo {
  subject: string;
  version: string;
  years: GradeInfo[];
}

export interface CurriculumData {
  grades: GradeInfo[];
  subjects?: SubjectCurriculumInfo[];
}

export interface QuestionItem {
  _id: string;
  questionText: string;
  answer: number | string;
  explanation: string;
  grade: number;
  topic: string;
  category: string;
  subCategories?: string[];
  format: string;
  options: Array<string | QuestionAnswerOption>;
  answerAssetId?: string;
  status: string;
  stepByStepSolution: string[];
  metadata: {
    source?: 'llm' | 'manual';
    generatedBy?: string;
    generationTime?: number;
    difficulty: string;
    country: string;
    subject?: string;
    curriculumVersion?: string;
    resolvedTopicKey?: string;
    resolvedTopicLabel?: string;
    curriculumStrand?: string;
    curriculumPhase?: string;
    sourceTopicKey?: string;
    fallbackUsed?: boolean;
    validationScore?: number;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  visualSelections?: QuestionVisualSelection[];
  visuals?: QuestionVisual[];
  visualLayout?: QuestionVisualContainerLayout;
  vectorSync?: {
    status: 'pending' | 'prepared' | 'stored' | 'failed';
    preparedAt?: string;
    storedAt?: string;
    storedBy?: string;
    documentId?: string;
    syncError?: string;
    contentHash?: string;
    embeddingModelVersion?: string;
  };
  refinementHistory?: RefinementEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionVisual {
  assetId: string;
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  svgPath?: string;
  templateId?: string;
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
  render?: {
    width?: number;
    height?: number;
  };
  layout?: {
    row?: number;
    column?: number;
  };
}

export interface QuestionVisualContainerLayout {
  container?: 'grid';
  rows?: number;
  columns?: number;
}

export interface QuestionAnswerOption {
  value: string;
  assetId?: string;
  svgPath?: string;
}

export interface QuestionVisualSelection {
  assetId: string;
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
  render?: {
    width?: number;
    height?: number;
  };
  layout?: {
    row?: number;
    column?: number;
  };
}

export interface RefinementEntry {
  instruction: string;
  previousQuestionText: string;
  previousAnswer: number | string;
  refinedQuestionText: string;
  refinedAnswer: number | string;
  refinedBy: string;
  refinedAt: string;
}

export interface PaginatedQuestions {
  data: QuestionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BatchGenerateRequest {
  grade: number;
  subject?: string;
  topic: string;
  count?: number;
  format?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface BatchGenerateResponse {
  stored: number;
  questions: QuestionItem[];
}

export interface CreateQuestionRequest {
  questionText: string;
  answer: number | string;
  answerAssetId?: string;
  explanation?: string;
  grade: number;
  topic: string;
  category?: string;
  format?: string;
  options?: Array<string | QuestionAnswerOption>;
  stepByStepSolution?: string[];
  subCategories?: string[];
  visualSelections?: QuestionVisualSelection[];
  visualLayout?: QuestionVisualContainerLayout;
  metadata?: {
    difficulty?: string;
    country?: string;
  };
}

export interface RefinementPreview {
  original: {
    questionText: string;
    answer: number | string;
    explanation: string;
    stepByStepSolution: string[];
    options: Array<string | QuestionAnswerOption>;
  };
  refined: {
    questionText: string;
    answer: number | string;
    explanation: string;
    stepByStepSolution: string[];
    options: Array<string | QuestionAnswerOption>;
  };
  instruction: string;
}

export interface LessonLearned {
  _id: string;
  grade: number;
  topic: string;
  category: string;
  mistakeDescription: string;
  correctionInstruction: string;
  incorrectExample?: string;
  correctedExample?: string;
  questionId?: string;
  recordedBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface GradeTopicCount {
  grade: number;
  topic: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  indexed: number;
}

export interface DifficultyCount {
  grade: number;
  topic: string;
  difficulty: string;
  count: number;
  indexed: number;
}

export interface FormatCount {
  grade: number;
  topic: string;
  format: string;
  count: number;
}

export interface CoverageGap {
  grade: number;
  topic: string;
  approved: number;
}

export interface RecentCreation {
  grade: number;
  topic: string;
  difficulty: string;
  count: number;
}

export interface TopicHealth {
  grade: number;
  topic: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
  indexed: number;
  approvalRate: number;
  difficultyDepth: { easy: number; medium: number; hard: number };
  indexedDifficultyDepth: { easy: number; medium: number; hard: number };
  formatBalance: { openEnded: number; multipleChoice: number };
  weeklyCreations: { easy: number; medium: number; hard: number };
  lastCreatedAt: string | null;
  issues: string[];
}

export interface QuestionAnalytics {
  gradeTopicMatrix: GradeTopicCount[];
  byDifficulty: DifficultyCount[];
  byFormat: FormatCount[];
  summary: {
    totalApproved: number;
    totalPending: number;
    totalRejected: number;
    totalQuestions: number;
    totalIndexed: number;
  };
  coverageGaps: CoverageGap[];
  recentCreations: RecentCreation[];
  topicHealth: TopicHealth[];
}

const AUTH_TOKEN_KEY = 'admin_auth_token';
const AUTH_USER_KEY = 'admin_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApiUrl = '/api/auth';
  private readonly questionsApiUrl = '/api/questions';
  private readonly subCategoriesApiUrl = '/api/subcategories';
  private readonly http = inject(HttpClient);

  login(request: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${this.authApiUrl}/admin/login`, request)
      .pipe(
        tap((response) => {
          this.storeToken(response.token);
          this.storeUser(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getUser(): AdminLoginResponse['user'] | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.authApiUrl}/me`);
  }

  getQuestionStats(): Observable<QuestionStats> {
    return this.http.get<QuestionStats>(`${this.questionsApiUrl}/stats`);
  }

  getAnalytics(
    threshold?: number,
    grade?: number
  ): Observable<QuestionAnalytics> {
    let params = new HttpParams();
    if (threshold !== undefined) {
      params = params.set('threshold', threshold.toString());
    }
    if (grade !== undefined) {
      params = params.set('grade', grade.toString());
    }
    return this.http.get<QuestionAnalytics>(
      `${this.questionsApiUrl}/analytics`,
      { params }
    );
  }

  inviteUser(request: InviteRequest): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(
      `${this.authApiUrl}/admin/register`,
      request
    );
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  getStaffUsers(): Observable<StaffUser[]> {
    return this.http.get<StaffUser[]>(`${this.authApiUrl}/admin/users`);
  }

  getStaffStats(): Observable<StaffStats> {
    return this.http.get<StaffStats>(`${this.authApiUrl}/admin/users/stats`);
  }

  toggleUserStatus(
    userId: string,
    isActive: boolean
  ): Observable<{
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  }> {
    return this.http.patch<{
      id: string;
      email: string;
      role: string;
      isActive: boolean;
    }>(`${this.authApiUrl}/admin/users/${userId}/status`, { isActive });
  }

  // ── Question Management ────────────────────────────────────

  getCurriculum(): Observable<CurriculumData> {
    return this.http.get<CurriculumData>(`${this.questionsApiUrl}/curriculum`);
  }

  getQuestions(filters: {
    subject?: string;
    grade?: number;
    topic?: string;
    status?: string;
    approvedNotIndexed?: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    page?: number;
    limit?: number;
  }): Observable<PaginatedQuestions> {
    let params = new HttpParams();
    if (filters.subject) params = params.set('subject', filters.subject);
    if (filters.grade !== undefined)
      params = params.set('grade', filters.grade.toString());
    if (filters.topic) params = params.set('topic', filters.topic);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.approvedNotIndexed) {
      params = params.set('approvedNotIndexed', 'true');
    }
    if (filters.difficulty) {
      params = params.set('difficulty', filters.difficulty);
    }
    if (filters.page !== undefined)
      params = params.set('page', filters.page.toString());
    if (filters.limit !== undefined)
      params = params.set('limit', filters.limit.toString());
    return this.http.get<PaginatedQuestions>(this.questionsApiUrl, { params });
  }

  getQuestion(id: string): Observable<QuestionItem> {
    return this.http.get<QuestionItem>(`${this.questionsApiUrl}/${id}`);
  }

  batchGenerate(
    request: BatchGenerateRequest
  ): Observable<BatchGenerateResponse> {
    return this.http.post<BatchGenerateResponse>(
      `${this.questionsApiUrl}/batch-generate`,
      request
    );
  }

  createQuestion(request: CreateQuestionRequest): Observable<QuestionItem> {
    return this.http.post<QuestionItem>(this.questionsApiUrl, request);
  }

  reviewQuestion(
    id: string,
    status: string,
    reviewNotes?: string
  ): Observable<QuestionItem> {
    return this.http.patch<QuestionItem>(
      `${this.questionsApiUrl}/${id}/review`,
      { status, reviewNotes }
    );
  }

  retryQuestionIndex(id: string): Observable<QuestionItem> {
    return this.http.post<QuestionItem>(
      `${this.questionsApiUrl}/${id}/retry-index`,
      {}
    );
  }

  bulkReview(
    questionIds: string[],
    status: string,
    reviewNotes?: string
  ): Observable<{ succeeded: number; failed: number; total: number }> {
    return this.http.post<{ succeeded: number; failed: number; total: number }>(
      `${this.questionsApiUrl}/bulk-review`,
      { questionIds, status, reviewNotes }
    );
  }

  deleteQuestion(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.questionsApiUrl}/${id}`
    );
  }

  refineQuestion(
    id: string,
    instruction: string
  ): Observable<RefinementPreview> {
    return this.http.post<RefinementPreview>(
      `${this.questionsApiUrl}/${id}/refine`,
      { instruction }
    );
  }

  applyRefinement(
    id: string,
    data: {
      questionText: string;
      answer: number | string;
      explanation?: string;
      stepByStepSolution?: string[];
      options?: Array<string | QuestionAnswerOption>;
      instruction: string;
    }
  ): Observable<QuestionItem> {
    return this.http.patch<QuestionItem>(
      `${this.questionsApiUrl}/${id}/apply-refinement`,
      data
    );
  }

  updateQuestion(
    id: string,
    data: {
      questionText?: string;
      answer?: number | string;
      answerAssetId?: string;
      explanation?: string;
      stepByStepSolution?: string[];
      subCategories?: string[];
      difficulty?: 'easy' | 'medium' | 'hard';
      visualSelections?: QuestionVisualSelection[];
      visualLayout?: QuestionVisualContainerLayout;
    }
  ): Observable<QuestionItem> {
    return this.http.patch<QuestionItem>(`${this.questionsApiUrl}/${id}`, data);
  }

  // ── Sub-categories ──────────────────────────────────────────

  listSubCategories(
    category: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Observable<SubCategoryItem[]> {
    const params = new HttpParams()
      .set('category', category)
      .set('difficulty', difficulty);
    return this.http.get<SubCategoryItem[]>(this.subCategoriesApiUrl, {
      params,
    });
  }

  createSubCategory(dto: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    name: string;
    description: string;
  }): Observable<SubCategoryItem> {
    return this.http.post<SubCategoryItem>(this.subCategoriesApiUrl, dto);
  }

  updateSubCategory(
    id: string,
    description: string
  ): Observable<SubCategoryItem> {
    return this.http.patch<SubCategoryItem>(
      `${this.subCategoriesApiUrl}/${id}`,
      { description }
    );
  }

  deleteSubCategory(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.subCategoriesApiUrl}/${id}`
    );
  }

  // ── Lessons Learned ────────────────────────────────────────

  getLessonsLearned(filters?: {
    grade?: number;
    topic?: string;
    category?: string;
  }): Observable<LessonLearned[]> {
    let params = new HttpParams();
    if (filters?.grade !== undefined)
      params = params.set('grade', filters.grade.toString());
    if (filters?.topic) params = params.set('topic', filters.topic);
    if (filters?.category) params = params.set('category', filters.category);
    return this.http.get<LessonLearned[]>(
      `${this.questionsApiUrl}/lessons-learned`,
      { params }
    );
  }

  createLessonLearned(lesson: {
    grade: number;
    topic: string;
    category: string;
    mistakeDescription: string;
    correctionInstruction: string;
    incorrectExample?: string;
    correctedExample?: string;
    questionId?: string;
  }): Observable<LessonLearned> {
    return this.http.post<LessonLearned>(
      `${this.questionsApiUrl}/lessons-learned`,
      lesson
    );
  }

  toggleLessonLearned(
    id: string,
    isActive: boolean
  ): Observable<LessonLearned> {
    return this.http.patch<LessonLearned>(
      `${this.questionsApiUrl}/lessons-learned/${id}`,
      { isActive }
    );
  }

  deleteLessonLearned(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.questionsApiUrl}/lessons-learned/${id}`
    );
  }

  private storeToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  private storeUser(user: AdminLoginResponse['user']): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}
