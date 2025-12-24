# Frontend Integration Guide: Progress Tracking

**User Story:** US-PT-001 - Basic Progress Tracking  
**Backend Implementation:** Complete (commit 63d38a9)  
**Target App:** `apps/student-app/`  
**Integration Priority:** P1 (High)

---

## Overview

This guide provides complete instructions for integrating the progress tracking backend APIs into the Angular student application.

### What's Available

✅ **5 REST API Endpoints** - All tested and documented  
✅ **Comprehensive Type Definitions** - Ready for TypeScript integration  
✅ **Swagger Documentation** - Available at `/api/docs` (when API running)  
✅ **90.57% Test Coverage** - Reliable backend services

---

## API Endpoints Reference

### Base URL
```
Development: http://localhost:3000/api
Production: TBD
```

### 1. Record Question Attempt
```typescript
POST /progress/record

Request Body:
{
  studentId: string;
  questionId: string;
  topic: string;              // e.g., "addition", "subtraction"
  difficulty: "easy" | "medium" | "hard";
  isCorrect: boolean;
  timeSpentSeconds: number;
  sessionId?: string;         // Optional
}

Response: DailyProgressResponse (see below)
```

**When to Call:** After student submits an answer to any question.

---

### 2. Get Daily Progress
```typescript
GET /progress/daily/:studentId

Response:
{
  studentId: string;
  date: Date;
  totalQuestionsAttempted: number;    // AC-001
  correctAnswers: number;             // AC-002
  incorrectAnswers: number;
  accuracyPercentage: number;         // AC-002 (0-100)
  timeSpentMinutes: number;
  streakDays: number;
  encouragementMessage: string;       // "Amazing work! You're a math superstar! ⭐"
}
```

**When to Call:** 
- On dashboard load
- After recording question attempt
- Every time student returns to progress view

**UI Components Needed:**
- Question count badge
- Accuracy percentage display
- Encouragement message alert/banner

---

### 3. Get Weekly Progress
```typescript
GET /progress/weekly/:studentId

Response:
{
  studentId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  weeklyAccuracyPercentage: number;
  totalTimeSpentMinutes: number;
  improvementPercentage: number;      // AC-004 (MVP: 0)
  dailyBreakdown: DailyProgressResponse[];  // AC-005 (7 days)
}
```

**When to Call:**
- Weekly progress tab/section
- Parent reports
- Trend analysis view

**UI Components Needed:**
- Weekly trend chart (7 days)
- Weekly summary cards
- Comparison indicators

---

### 4. Get Student Achievements
```typescript
GET /achievements/:studentId

Response:
{
  studentId: string;
  achievements: [
    {
      id: string;               // e.g., "first_steps"
      name: string;             // e.g., "First Steps"
      description: string;      // e.g., "Answer 10 questions correctly!"
      category: string;         // "milestone", "accuracy", "streak", etc.
      badgeIcon: string;        // Icon identifier
      pointValue: number;       // Achievement points
      unlocked: boolean;        // AC-006
      unlockedDate?: Date;
      progress: number;         // 0-100 percentage to unlock
    }
  ];
  totalPoints: number;
  recentlyUnlocked: Achievement[];    // Last 7 days
}
```

**When to Call:**
- Achievement page load
- After recording question (to check for new unlocks)
- Profile/dashboard summary

**UI Components Needed:**
- Achievement badge grid (locked/unlocked states)
- Achievement celebration modal (when unlocked)
- Progress bars for locked achievements
- Point total display

---

### 5. Get Next Milestone
```typescript
GET /achievements/:studentId/next

Response:
{
  studentId: string;
  nextMilestone: {
    id: string;
    name: string;
    description: string;
    threshold: number;          // e.g., 10, 25, 50
  };
  currentCorrectAnswers: number;
  progressPercentage: number;   // AC-003 (0-100)
  questionsRemaining: number;
}
```

**When to Call:**
- Dashboard load (show progress to next badge)
- After each question attempt

**UI Components Needed:**
- Progress bar with milestone indicator
- "X questions to next badge" message
- Motivational display

---

## Angular Service Implementation

### Step 1: Create Progress Service

```bash
cd apps/student-app/src/app
ng generate service services/progress
```

### Step 2: Implement Service

```typescript
// apps/student-app/src/app/services/progress.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Type Definitions (matching backend DTOs)
export interface RecordQuestionAttemptDto {
  studentId: string;
  questionId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeSpentSeconds: number;
  sessionId?: string;
}

export interface DailyProgress {
  studentId: string;
  date: Date;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number;
  timeSpentMinutes: number;
  streakDays: number;
  encouragementMessage: string;
}

export interface WeeklyProgress {
  studentId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  weeklyAccuracyPercentage: number;
  totalTimeSpentMinutes: number;
  improvementPercentage: number;
  dailyBreakdown: DailyProgress[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  pointValue: number;
  unlocked: boolean;
  unlockedDate?: Date;
  progress: number;
}

export interface StudentAchievements {
  studentId: string;
  achievements: Achievement[];
  totalPoints: number;
  recentlyUnlocked: Achievement[];
}

export interface NextMilestone {
  studentId: string;
  nextMilestone: {
    id: string;
    name: string;
    description: string;
    threshold: number;
  };
  currentCorrectAnswers: number;
  progressPercentage: number;
  questionsRemaining: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private apiUrl = `${environment.apiUrl}/progress`;
  private achievementsUrl = `${environment.apiUrl}/achievements`;

  constructor(private http: HttpClient) {}

  /**
   * Record a question attempt
   * Call this after student submits an answer
   */
  recordQuestionAttempt(attempt: RecordQuestionAttemptDto): Observable<DailyProgress> {
    return this.http.post<DailyProgress>(`${this.apiUrl}/record`, attempt);
  }

  /**
   * Get today's progress for a student
   */
  getDailyProgress(studentId: string): Observable<DailyProgress> {
    return this.http.get<DailyProgress>(`${this.apiUrl}/daily/${studentId}`);
  }

  /**
   * Get this week's progress with daily breakdown
   */
  getWeeklyProgress(studentId: string): Observable<WeeklyProgress> {
    return this.http.get<WeeklyProgress>(`${this.apiUrl}/weekly/${studentId}`);
  }

  /**
   * Get all achievements for a student
   */
  getStudentAchievements(studentId: string): Observable<StudentAchievements> {
    return this.http.get<StudentAchievements>(`${this.achievementsUrl}/${studentId}`);
  }

  /**
   * Get next milestone information
   */
  getNextMilestone(studentId: string): Observable<NextMilestone> {
    return this.http.get<NextMilestone>(`${this.achievementsUrl}/${studentId}/next`);
  }
}
```

---

## UI Component Examples

### 1. Progress Dashboard Component

```typescript
// apps/student-app/src/app/components/progress-dashboard/progress-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { ProgressService, DailyProgress, NextMilestone } from '../../services/progress.service';

@Component({
  selector: 'app-progress-dashboard',
  templateUrl: './progress-dashboard.component.html',
  styleUrls: ['./progress-dashboard.component.scss']
})
export class ProgressDashboardComponent implements OnInit {
  studentId = 'current-student-id'; // Get from auth service
  dailyProgress: DailyProgress | null = null;
  nextMilestone: NextMilestone | null = null;
  loading = true;

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading = true;

    // Load daily progress
    this.progressService.getDailyProgress(this.studentId).subscribe({
      next: (progress) => {
        this.dailyProgress = progress;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading progress:', err);
        this.loading = false;
      }
    });

    // Load next milestone
    this.progressService.getNextMilestone(this.studentId).subscribe({
      next: (milestone) => {
        this.nextMilestone = milestone;
      },
      error: (err) => console.error('Error loading milestone:', err)
    });
  }
}
```

### 2. Progress Dashboard Template (MDB 5 Bootstrap)

```html
<!-- apps/student-app/src/app/components/progress-dashboard/progress-dashboard.component.html -->

<div class="container mt-4" *ngIf="!loading && dailyProgress">
  <!-- Encouragement Message -->
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    <i class="fas fa-star me-2"></i>
    {{ dailyProgress.encouragementMessage }}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>

  <!-- Daily Progress Cards -->
  <div class="row g-4 mb-4">
    <!-- Questions Answered Today (AC-001) -->
    <div class="col-md-4">
      <div class="card text-center">
        <div class="card-body">
          <i class="fas fa-question-circle fa-3x text-primary mb-3"></i>
          <h5 class="card-title">Questions Today</h5>
          <h2 class="display-4">{{ dailyProgress.totalQuestionsAttempted }}</h2>
          <p class="text-muted">Keep going!</p>
        </div>
      </div>
    </div>

    <!-- Accuracy Percentage (AC-002) -->
    <div class="col-md-4">
      <div class="card text-center">
        <div class="card-body">
          <i class="fas fa-bullseye fa-3x text-success mb-3"></i>
          <h5 class="card-title">Accuracy</h5>
          <h2 class="display-4">{{ dailyProgress.accuracyPercentage }}%</h2>
          <p class="text-muted">{{ dailyProgress.correctAnswers }} correct</p>
        </div>
      </div>
    </div>

    <!-- Streak Days -->
    <div class="col-md-4">
      <div class="card text-center">
        <div class="card-body">
          <i class="fas fa-fire fa-3x text-warning mb-3"></i>
          <h5 class="card-title">Streak</h5>
          <h2 class="display-4">{{ dailyProgress.streakDays }}</h2>
          <p class="text-muted">days in a row</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Next Milestone Progress (AC-003) -->
  <div class="card mb-4" *ngIf="nextMilestone">
    <div class="card-body">
      <h5 class="card-title">
        <i class="fas fa-trophy me-2"></i>
        Next Achievement: {{ nextMilestone.nextMilestone.name }}
      </h5>
      <p class="text-muted">{{ nextMilestone.nextMilestone.description }}</p>
      
      <!-- Progress Bar -->
      <div class="progress mb-2" style="height: 30px;">
        <div 
          class="progress-bar progress-bar-striped progress-bar-animated bg-success"
          role="progressbar"
          [style.width.%]="nextMilestone.progressPercentage"
          [attr.aria-valuenow]="nextMilestone.progressPercentage"
          aria-valuemin="0"
          aria-valuemax="100">
          {{ nextMilestone.progressPercentage }}%
        </div>
      </div>
      
      <p class="mb-0">
        <strong>{{ nextMilestone.questionsRemaining }}</strong> more correct answers to unlock!
      </p>
    </div>
  </div>
</div>

<!-- Loading State -->
<div class="text-center mt-5" *ngIf="loading">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>
```

### 3. Record Question Attempt (Integration Example)

```typescript
// In your question component after student submits answer

onAnswerSubmit(questionId: string, isCorrect: boolean, timeSpent: number): void {
  const attempt: RecordQuestionAttemptDto = {
    studentId: this.authService.getCurrentStudentId(),
    questionId: questionId,
    topic: this.currentQuestion.topic,
    difficulty: this.currentQuestion.difficulty,
    isCorrect: isCorrect,
    timeSpentSeconds: timeSpent
  };

  this.progressService.recordQuestionAttempt(attempt).subscribe({
    next: (progress) => {
      console.log('Progress updated:', progress);
      
      // Check if achievement was recently unlocked
      this.progressService.getStudentAchievements(this.studentId).subscribe({
        next: (achievements) => {
          if (achievements.recentlyUnlocked.length > 0) {
            // Show celebration modal
            this.showAchievementCelebration(achievements.recentlyUnlocked[0]);
          }
        }
      });
    },
    error: (err) => console.error('Error recording attempt:', err)
  });
}
```

---

## Achievement Badge Display

### Achievement Grid Component

```typescript
// achievements-grid.component.ts

import { Component, OnInit } from '@angular/core';
import { ProgressService, Achievement } from '../../services/progress.service';

@Component({
  selector: 'app-achievements-grid',
  templateUrl: './achievements-grid.component.html'
})
export class AchievementsGridComponent implements OnInit {
  studentId = 'current-student-id';
  achievements: Achievement[] = [];
  totalPoints = 0;
  loading = true;

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    this.progressService.getStudentAchievements(this.studentId).subscribe({
      next: (data) => {
        this.achievements = data.achievements;
        this.totalPoints = data.totalPoints;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.loading = false;
      }
    });
  }

  getBadgeClass(achievement: Achievement): string {
    return achievement.unlocked ? 'badge-unlocked' : 'badge-locked';
  }
}
```

```html
<!-- achievements-grid.component.html -->

<div class="container mt-4">
  <div class="text-center mb-4">
    <h2>
      <i class="fas fa-trophy text-warning me-2"></i>
      My Achievements
    </h2>
    <p class="lead">Total Points: <strong>{{ totalPoints }}</strong></p>
  </div>

  <div class="row g-4">
    <div class="col-md-4 col-lg-3" *ngFor="let achievement of achievements">
      <div class="card text-center" [class.opacity-50]="!achievement.unlocked">
        <div class="card-body">
          <!-- Badge Icon -->
          <div class="achievement-icon mb-3">
            <i [class]="'fas ' + achievement.badgeIcon + ' fa-4x'"
               [class.text-warning]="achievement.unlocked"
               [class.text-muted]="!achievement.unlocked"></i>
          </div>

          <!-- Achievement Name -->
          <h5 class="card-title">{{ achievement.name }}</h5>
          <p class="card-text text-muted small">{{ achievement.description }}</p>

          <!-- Points Badge -->
          <span class="badge bg-primary mb-2">{{ achievement.pointValue }} pts</span>

          <!-- Unlocked Date or Progress -->
          <div *ngIf="achievement.unlocked">
            <span class="badge bg-success">
              <i class="fas fa-check me-1"></i>
              Unlocked {{ achievement.unlockedDate | date:'short' }}
            </span>
          </div>

          <div *ngIf="!achievement.unlocked">
            <!-- Progress Bar for Locked Achievements -->
            <div class="progress mt-2" style="height: 20px;">
              <div class="progress-bar"
                   [style.width.%]="achievement.progress"
                   [attr.aria-valuenow]="achievement.progress">
                {{ achievement.progress }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Weekly Trend Chart

### Using Chart.js with Angular

```bash
npm install chart.js ng2-charts
```

```typescript
// weekly-chart.component.ts

import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-weekly-chart',
  templateUrl: './weekly-chart.component.html'
})
export class WeeklyChartComponent implements OnInit {
  studentId = 'current-student-id';
  
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Questions Answered',
        fill: true,
        tension: 0.4,
        borderColor: '#4285f4',
        backgroundColor: 'rgba(66, 133, 244, 0.1)'
      }
    ]
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    this.progressService.getWeeklyProgress(this.studentId).subscribe({
      next: (weeklyData) => {
        // Populate chart data
        this.lineChartData.labels = weeklyData.dailyBreakdown.map(
          day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
        );
        
        this.lineChartData.datasets[0].data = weeklyData.dailyBreakdown.map(
          day => day.totalQuestionsAttempted
        );
      },
      error: (err) => console.error('Error loading weekly data:', err)
    });
  }
}
```

---

## Environment Configuration

```typescript
// apps/student-app/src/environments/environment.ts

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// apps/student-app/src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiUrl: 'https://api.learninghub.com/api'
};
```

---

## Testing the Integration

### 1. Start Backend API
```bash
npx nx serve api
# API running at http://localhost:3000
```

### 2. Start Student App
```bash
npx nx serve student-app
# App running at http://localhost:4200
```

### 3. Test Endpoints
```bash
# Get daily progress
curl http://localhost:3000/api/progress/daily/student-123

# Record question attempt
curl -X POST http://localhost:3000/api/progress/record \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-123",
    "questionId": "q-001",
    "topic": "addition",
    "difficulty": "easy",
    "isCorrect": true,
    "timeSpentSeconds": 45
  }'

# Get achievements
curl http://localhost:3000/api/achievements/student-123
```

---

## Acceptance Criteria Checklist

- [ ] **AC-001:** Display total questions answered today
  - Component: Progress dashboard card
  - Data: `dailyProgress.totalQuestionsAttempted`

- [ ] **AC-002:** Show correct answers and accuracy percentage
  - Component: Accuracy card
  - Data: `dailyProgress.correctAnswers`, `dailyProgress.accuracyPercentage`

- [ ] **AC-003:** Visual progress indicators (bars, badges)
  - Component: Next milestone progress bar
  - Data: `nextMilestone.progressPercentage`

- [ ] **AC-004:** Display weekly improvement
  - Component: Weekly trend chart
  - Data: `weeklyProgress.improvementPercentage` (MVP: shows 0)

- [ ] **AC-005:** Daily reset with weekly history
  - Component: Weekly chart with 7-day breakdown
  - Data: `weeklyProgress.dailyBreakdown[]`

- [ ] **AC-006:** Achievement unlock notifications
  - Component: Achievement celebration modal
  - Trigger: Check `recentlyUnlocked[]` after question attempt

---

## Next Steps

1. **Create Angular Components** (estimate: 2-3 hours)
   - Progress dashboard
   - Achievement grid
   - Weekly trend chart
   - Celebration modal

2. **Style with MDB 5** (estimate: 1-2 hours)
   - Apply Bootstrap 5 classes
   - Add animations for achievements
   - Responsive design

3. **Add Navigation** (estimate: 30 minutes)
   - Progress tab in student menu
   - Achievement page route

4. **Testing** (estimate: 1 hour)
   - Component unit tests
   - Integration tests with mock data
   - User acceptance testing

5. **Polish** (estimate: 1 hour)
   - Loading states
   - Error handling
   - Empty states
   - Animations

---

## Support & Resources

- **Backend API Tests:** `api/src/app/progress/**/*.spec.ts`
- **Session Log:** `dev_mmdd_logs/sessions/TN-FEATURE-SCRUM-18-BASIC-PROGRESS-TRACKING/2024-12-24-session-1.md`
- **Swagger Docs:** http://localhost:3000/api/docs (when API running)
- **MDB 5 Docs:** https://mdbootstrap.com/docs/angular/

---

**Ready for frontend integration!** 🚀
