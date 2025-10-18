# LearningHub AI - Angular MDB 5 Frontend Specification

**Document Version:** 2.0  
**Created:** October 18, 2025  
**Updated:** October 18, 2025 (MDB 5 Integration)  
**Technology Stack:** Angular 20.x, Angular MDB 5, Bootstrap 5, TypeScript  
**Target Audience:** Grade 3 Students (Ages 7-9) & Parents  

---

## 1. Overview & MDB 5 Integration Strategy

### 1.1 Design Philosophy
- **Material Design Bootstrap**: Combines Google's Material Design with Bootstrap's flexibility
- **Child-First Approach**: Large touch targets, intuitive navigation, immediate visual feedback
- **Educational Focus**: Learning-optimized components with progress visualization
- **Accessibility**: WCAG 2.1 AA compliance with screen reader optimization
- **Local-First**: Offline-ready components with performance optimization

### 1.2 MDB 5 Component Selection
**Primary MDB Components Used:**
- `mdb-card` - Question containers and dashboard metrics
- `mdb-progress` - Learning progress visualization  
- `mdb-btn` - Interactive buttons with Material Design styling
- `mdb-modal` - Feedback dialogs and help screens
- `mdb-form-control` - Answer input fields with validation
- `mdb-chart` - Parent dashboard analytics (Chart.js integration)
- `mdb-table` - Progress data display for parents
- `mdb-select` - Dropdown menus and option selection

---

## 2. Installation & Setup

### 2.1 Dependencies Installation
```bash
# Core MDB 5 package
npm install mdb-angular-ui-kit

# Supporting libraries
npm install @fortawesome/fontawesome-free
npm install chart.js
npm install bootstrap@5.3.0

# Development dependencies
npm install @types/chart.js --save-dev
```

### 2.2 Angular Module Configuration
```typescript
// app.module.ts
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MdbCheckboxModule } from 'mdb-angular-ui-kit/checkbox';
import { MdbCollapseModule } from 'mdb-angular-ui-kit/collapse';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { MdbPopoverModule } from 'mdb-angular-ui-kit/popover';
import { MdbRadioModule } from 'mdb-angular-ui-kit/radio';
import { MdbRangeModule } from 'mdb-angular-ui-kit/range';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { MdbScrollspyModule } from 'mdb-angular-ui-kit/scrollspy';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';
import { MdbTooltipModule } from 'mdb-angular-ui-kit/tooltip';
import { MdbValidationModule } from 'mdb-angular-ui-kit/validation';
import { MdbChartsModule } from 'mdb-angular-ui-kit/charts';
import { MdbTableModule } from 'mdb-angular-ui-kit/table';

@NgModule({
  imports: [
    MdbAccordionModule,
    MdbCarouselModule,
    MdbCheckboxModule,
    MdbCollapseModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbModalModule,
    MdbPopoverModule,
    MdbRadioModule,
    MdbRangeModule,
    MdbRippleModule,
    MdbScrollspyModule,
    MdbTabsModule,
    MdbTooltipModule,
    MdbValidationModule,
    MdbChartsModule,
    MdbTableModule
  ]
})
export class AppModule { }
```

### 2.3 Style Configuration
```scss
// styles.scss
@import '~mdb-angular-ui-kit/assets/scss/mdb.scss';
@import '~@fortawesome/fontawesome-free/scss/fontawesome.scss';
@import '~@fortawesome/fontawesome-free/scss/solid.scss';

// Educational theme customizations
:root {
  --mdb-primary: #2196f3;      // Bright blue for primary actions
  --mdb-secondary: #6c757d;    // Gray for secondary elements  
  --mdb-success: #4caf50;      // Green for correct answers
  --mdb-danger: #f44336;       // Red for incorrect answers
  --mdb-warning: #ff9800;      // Orange for hints/warnings
  --mdb-info: #00bcd4;         // Cyan for information
  --mdb-light: #f8f9fa;        // Light background
  --mdb-dark: #212529;         // Dark text
}
```

---

## 3. Student Interface Components

### 3.1 Question Practice Component (MDB 5)

```typescript
@Component({
  selector: 'app-question-practice',
  template: `
    <div class="question-practice-container">
      <!-- Progress Header -->
      <mdb-card class="progress-header-card mb-4 shadow-2-strong">
        <mdb-card-body class="p-3">
          <div class="d-flex justify-content-between align-items-center">
            <div class="progress-info flex-grow-1 me-3">
              <h6 class="mb-1">Question {{currentIndex + 1}} of {{totalQuestions}}</h6>
              <mdb-progress 
                [value]="progressPercent" 
                height="8" 
                color="primary"
                [striped]="false">
              </mdb-progress>
            </div>
            <button mdbBtn 
                    color="primary" 
                    outline="true" 
                    [mdbRipple]="true"
                    class="help-btn"
                    (click)="showHelp()">
              <i class="fas fa-question-circle me-1"></i>Help
            </button>
          </div>
        </mdb-card-body>
      </mdb-card>

      <!-- Main Question Card -->
      <mdb-card class="question-card shadow-3-strong">
        <mdb-card-header class="bg-gradient-primary text-white p-4">
          <h2 class="question-text mb-0 fs-3 text-center">
            {{currentQuestion.text}}
          </h2>
        </mdb-card-header>
        
        <mdb-card-body class="p-4">
          <!-- Visual Aid Section -->
          <div class="visual-aid-section mb-4" *ngIf="currentQuestion.hasVisualAid">
            <div class="text-center">
              <div class="number-line-container bg-light p-3 rounded">
                <!-- Number line component will be inserted here -->
              </div>
            </div>
          </div>
          
          <!-- Multiple Choice Answers -->
          <div class="answer-section" *ngIf="currentQuestion.type === 'multiple_choice'">
            <div class="row g-3">
              <div class="col-md-6" 
                   *ngFor="let option of currentQuestion.options; let i = index">
                <button mdbBtn 
                        [color]="getOptionButtonColor(i)"
                        [outline]="!isOptionSelected(i)"
                        size="lg"
                        [mdbRipple]="true"
                        class="w-100 answer-option-btn"
                        [class.selected]="selectedOptionIndex === i"
                        [class.correct]="showResults && option.isCorrect"
                        [class.incorrect]="showResults && selectedOptionIndex === i && !option.isCorrect"
                        (click)="selectOption(i)"
                        [disabled]="showResults">
                  <div class="d-flex align-items-center justify-content-start">
                    <span class="option-letter me-3">{{getOptionLetter(i)}}</span>
                    <span class="option-text">{{option.text}}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Numeric Input -->
          <div class="numeric-answer-section" 
               *ngIf="currentQuestion.type === 'numeric'">
            <div class="row justify-content-center">
              <div class="col-md-6">
                <!-- Answer Input Field -->
                <div class="form-outline mb-4">
                  <input mdbInput 
                         type="text" 
                         id="numericAnswerInput"
                         class="form-control form-control-lg text-center numeric-input"
                         [(ngModel)]="numericAnswer"
                         readonly
                         placeholder="Enter your answer"
                         (focus)="showVirtualKeypad()">
                  <label mdbLabel class="form-label" for="numericAnswerInput">
                    Your Answer
                  </label>
                </div>
                
                <!-- Virtual Keypad -->
                <div class="virtual-keypad-container" *ngIf="showKeypad">
                  <div class="keypad bg-light p-3 rounded shadow-1">
                    <div class="keypad-grid">
                      <div class="row g-2" *ngFor="let row of keypadLayout">
                        <div class="col-4" *ngFor="let key of row">
                          <button mdbBtn 
                                  [color]="getKeypadButtonColor(key)"
                                  [outline]="key !== 'DEL'"
                                  class="w-100 keypad-key"
                                  [disabled]="key === ''"
                                  (click)="handleKeypadInput(key)">
                            <span *ngIf="key !== 'DEL' && key !== ''">{{key}}</span>
                            <i *ngIf="key === 'DEL'" class="fas fa-backspace"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mdb-card-body>
        
        <mdb-card-footer class="p-4 text-center">
          <button mdbBtn 
                  color="success" 
                  size="lg"
                  [mdbRipple]="true"
                  class="submit-answer-btn"
                  [disabled]="!hasValidAnswer() || showResults"
                  (click)="submitAnswer()">
            <i class="fas fa-check me-2"></i>
            Submit Answer
          </button>
        </mdb-card-footer>
      </mdb-card>
    </div>
  `,
  styles: [`
    .question-practice-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .question-card {
      border-radius: 1.5rem;
      overflow: hidden;
      border: none;
    }
    
    .bg-gradient-primary {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    }
    
    .answer-option-btn {
      min-height: 80px;
      border-radius: 1rem;
      border-width: 2px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
    }
    
    .answer-option-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }
    
    .answer-option-btn.selected {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
    }
    
    .answer-option-btn.correct {
      background-color: #4caf50 !important;
      border-color: #4caf50 !important;
      color: white !important;
    }
    
    .answer-option-btn.incorrect {
      background-color: #f44336 !important;
      border-color: #f44336 !important;
      color: white !important;
    }
    
    .option-letter {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .numeric-input {
      font-size: 2.5rem !important;
      font-weight: 600 !important;
      height: 80px !important;
    }
    
    .keypad-key {
      height: 60px;
      font-size: 1.5rem;
      font-weight: 600;
      border-radius: 0.75rem;
    }
    
    .submit-answer-btn {
      min-width: 200px;
      height: 55px;
      font-weight: 600;
      border-radius: 2rem;
    }
    
    @media (max-width: 768px) {
      .answer-option-btn {
        min-height: 70px;
        font-size: 0.95rem;
      }
      
      .option-letter {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
      
      .numeric-input {
        font-size: 2rem !important;
        height: 70px !important;
      }
    }
  `]
})
export class QuestionPracticeComponent {
  currentQuestion: Question;
  selectedOptionIndex: number | null = null;
  numericAnswer: string = '';
  showKeypad = false;
  showResults = false;
  
  keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'], 
    ['7', '8', '9'],
    ['', '0', 'DEL']
  ];
  
  getOptionButtonColor(index: number): string {
    if (this.showResults) {
      const option = this.currentQuestion.options[index];
      if (option.isCorrect) return 'success';
      if (this.selectedOptionIndex === index && !option.isCorrect) return 'danger';
    }
    return this.selectedOptionIndex === index ? 'primary' : 'outline-primary';
  }
  
  getKeypadButtonColor(key: string): string {
    if (key === 'DEL') return 'warning';
    if (key === '') return 'light';
    return 'primary';
  }
  
  handleKeypadInput(key: string): void {
    if (key === 'DEL') {
      this.numericAnswer = this.numericAnswer.slice(0, -1);
    } else if (key !== '') {
      this.numericAnswer += key;
    }
  }
}
```

### 3.2 Feedback Modal Component (MDB 5)

```typescript
@Component({
  selector: 'app-feedback-modal',
  template: `
    <div class="modal fade" 
         id="feedbackModal" 
         tabindex="-1" 
         aria-labelledby="feedbackModalLabel" 
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content feedback-modal" 
             [class.correct-feedback]="feedbackData.isCorrect"
             [class.incorrect-feedback]="!feedbackData.isCorrect">
          
          <!-- Modal Header -->
          <div class="modal-header border-0 pb-0">
            <div class="feedback-icon-container text-center w-100">
              <div class="feedback-icon" 
                   [class.success-icon]="feedbackData.isCorrect"
                   [class.error-icon]="!feedbackData.isCorrect">
                <i *ngIf="feedbackData.isCorrect" 
                   class="fas fa-check-circle fa-4x text-success"></i>
                <i *ngIf="!feedbackData.isCorrect" 
                   class="fas fa-times-circle fa-4x text-danger"></i>
              </div>
            </div>
          </div>
          
          <!-- Modal Body -->
          <div class="modal-body text-center px-4">
            <h3 class="feedback-title mb-3" 
                [class.text-success]="feedbackData.isCorrect"
                [class.text-danger]="!feedbackData.isCorrect">
              {{feedbackData.isCorrect ? 'Excellent Work!' : 'Not Quite Right'}}
            </h3>
            
            <p class="encouragement-text mb-4 fs-5">
              {{feedbackData.encouragement}}
            </p>
            
            <!-- Answer Comparison (for incorrect answers) -->
            <mdb-card class="answer-comparison mb-4" *ngIf="!feedbackData.isCorrect">
              <mdb-card-body class="p-3">
                <div class="row">
                  <div class="col-6">
                    <div class="answer-display">
                      <small class="text-muted">Your Answer:</small>
                      <div class="answer-value text-danger fw-bold fs-4">
                        {{feedbackData.studentAnswer}}
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="answer-display">
                      <small class="text-muted">Correct Answer:</small>
                      <div class="answer-value text-success fw-bold fs-4">
                        {{feedbackData.correctAnswer}}
                      </div>
                    </div>
                  </div>
                </div>
              </mdb-card-body>
            </mdb-card>
            
            <!-- Explanation Section -->
            <mdb-card class="explanation-card" *ngIf="feedbackData.explanation">
              <mdb-card-header class="bg-light">
                <h5 class="mb-0">
                  <i class="fas fa-lightbulb me-2 text-warning"></i>
                  How to Solve It:
                </h5>
              </mdb-card-header>
              <mdb-card-body>
                <div class="explanation-content" [innerHTML]="feedbackData.explanation">
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
          
          <!-- Modal Footer -->
          <div class="modal-footer border-0 pt-0 justify-content-center">
            <div class="feedback-actions d-flex gap-3">
              <button mdbBtn 
                      color="outline-secondary"
                      size="lg"
                      *ngIf="!feedbackData.isCorrect && allowRetry"
                      (click)="onRetry()"
                      [mdbRipple]="true">
                <i class="fas fa-redo me-2"></i>
                Try Again
              </button>
              
              <button mdbBtn 
                      [color]="feedbackData.isCorrect ? 'success' : 'primary'"
                      size="lg"
                      (click)="onContinue()"
                      [mdbRipple]="true"
                      class="continue-btn">
                <i class="fas fa-arrow-right me-2"></i>
                {{feedbackData.isCorrect ? 'Next Question' : 'Continue'}}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-modal {
      border-radius: 1.5rem;
      overflow: hidden;
      border: none;
    }
    
    .correct-feedback {
      border-left: 6px solid #4caf50;
    }
    
    .incorrect-feedback {
      border-left: 6px solid #f44336;
    }
    
    .feedback-icon {
      margin: 0 auto;
      animation: feedbackPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    @keyframes feedbackPop {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .answer-comparison {
      background: #f8f9fa;
      border-radius: 1rem;
    }
    
    .explanation-card {
      border-radius: 1rem;
      border: 1px solid #e9ecef;
    }
    
    .continue-btn {
      min-width: 180px;
    }
    
    .feedback-actions {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .feedback-actions {
        flex-direction: column;
        width: 100%;
      }
      
      .feedback-actions button {
        width: 100%;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class FeedbackModalComponent {
  @Input() feedbackData: FeedbackData;
  @Input() allowRetry = true;
  @Output() retry = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();
  
  onRetry(): void {
    this.retry.emit();
  }
  
  onContinue(): void {
    this.continue.emit();
  }
}

interface FeedbackData {
  isCorrect: boolean;
  studentAnswer: string | number;
  correctAnswer: string | number;
  explanation?: string;
  encouragement: string;
}
```

---

## 4. Parent Dashboard Components

### 4.1 Dashboard Overview (MDB 5)

```typescript
@Component({
  selector: 'app-parent-dashboard',
  template: `
    <div class="parent-dashboard">
      <!-- Header Section -->
      <div class="dashboard-header mb-4">
        <mdb-card class="header-card shadow-2-strong">
          <mdb-card-body class="p-4">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h1 class="dashboard-title mb-2">
                  <i class="fas fa-chart-line me-3 text-primary"></i>
                  Learning Dashboard
                </h1>
                <p class="dashboard-subtitle text-muted mb-0">
                  Track {{selectedChild.name}}'s learning journey and progress
                </p>
              </div>
              <div class="col-md-4">
                <div class="form-outline">
                  <select mdbSelect 
                          [(ngModel)]="selectedChildId"
                          (ngModelChange)="onChildChanged($event)"
                          class="form-select form-select-lg">
                    <option *ngFor="let child of children" [value]="child.id">
                      {{child.name}} (Grade {{child.grade}})
                    </option>
                  </select>
                  <label mdbLabel class="form-label">Select Child</label>
                </div>
              </div>
            </div>
          </mdb-card-body>
        </mdb-card>
      </div>
      
      <!-- Metrics Overview -->
      <div class="metrics-section mb-5">
        <div class="row g-4">
          <!-- Questions Answered Metric -->
          <div class="col-lg-4 col-md-6">
            <mdb-card class="metric-card h-100 shadow-2-strong">
              <mdb-card-body class="text-center p-4">
                <div class="metric-icon mb-3">
                  <div class="icon-circle bg-primary bg-opacity-10">
                    <i class="fas fa-question-circle fa-2x text-primary"></i>
                  </div>
                </div>
                <h3 class="metric-value display-4 fw-bold text-primary mb-2">
                  {{metrics.questionsAnswered | number}}
                </h3>
                <h6 class="metric-label text-muted mb-3">Questions Answered</h6>
                <div class="metric-trend">
                  <span class="badge" [class]="getTrendBadgeClass(metrics.questionsGrowth)">
                    <i class="fas" [class]="getTrendIcon(metrics.questionsGrowth)"></i>
                    {{metrics.questionsGrowth}}% this week
                  </span>
                </div>
                <mdb-progress 
                  [value]="metrics.weeklyGoalProgress" 
                  height="6" 
                  color="primary"
                  class="mt-3">
                </mdb-progress>
                <small class="text-muted">Weekly Goal: {{metrics.weeklyGoal}} questions</small>
              </mdb-card-body>
            </mdb-card>
          </div>
          
          <!-- Accuracy Rate Metric -->
          <div class="col-lg-4 col-md-6">
            <mdb-card class="metric-card h-100 shadow-2-strong">
              <mdb-card-body class="text-center p-4">
                <div class="metric-icon mb-3">
                  <div class="icon-circle bg-success bg-opacity-10">
                    <i class="fas fa-bullseye fa-2x text-success"></i>
                  </div>
                </div>
                <h3 class="metric-value display-4 fw-bold text-success mb-2">
                  {{metrics.accuracyRate}}%
                </h3>
                <h6 class="metric-label text-muted mb-3">Accuracy Rate</h6>
                <mdb-progress 
                  [value]="metrics.accuracyRate" 
                  height="12" 
                  color="success"
                  [striped]="false"
                  class="mb-2">
                </mdb-progress>
                <div class="accuracy-comparison">
                  <small class="text-muted">
                    Grade {{selectedChild.grade}} Average: {{metrics.gradeAverage}}%
                  </small>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
          
          <!-- Time Practiced Metric -->
          <div class="col-lg-4 col-md-6">
            <mdb-card class="metric-card h-100 shadow-2-strong">
              <mdb-card-body class="text-center p-4">
                <div class="metric-icon mb-3">
                  <div class="icon-circle bg-info bg-opacity-10">
                    <i class="fas fa-clock fa-2x text-info"></i>
                  </div>
                </div>
                <h3 class="metric-value display-4 fw-bold text-info mb-2">
                  {{formatDuration(metrics.totalMinutes)}}
                </h3>
                <h6 class="metric-label text-muted mb-3">Time Practiced</h6>
                <div class="time-breakdown">
                  <div class="d-flex justify-content-between mb-1">
                    <small class="text-muted">This Week:</small>
                    <small class="fw-medium">{{formatDuration(metrics.weeklyMinutes)}}</small>
                  </div>
                  <div class="d-flex justify-content-between">
                    <small class="text-muted">Avg Session:</small>
                    <small class="fw-medium">{{formatDuration(metrics.avgSessionMinutes)}}</small>
                  </div>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
        </div>
      </div>
      
      <!-- Charts and Analytics -->
      <div class="analytics-section mb-5">
        <div class="row g-4">
          <!-- Progress Chart -->
          <div class="col-lg-8">
            <mdb-card class="chart-card shadow-2-strong">
              <mdb-card-header class="bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="fas fa-chart-line me-2"></i>
                  Progress Over Time
                </h5>
                <div class="chart-controls">
                  <div class="btn-group" mdbBtnGroup role="group">
                    <input type="radio" class="btn-check" name="timeRange" id="week" 
                           [(ngModel)]="selectedTimeRange" value="week">
                    <label mdbBtn outline="true" color="primary" for="week">Week</label>
                    
                    <input type="radio" class="btn-check" name="timeRange" id="month"
                           [(ngModel)]="selectedTimeRange" value="month">  
                    <label mdbBtn outline="true" color="primary" for="month">Month</label>
                    
                    <input type="radio" class="btn-check" name="timeRange" id="quarter"
                           [(ngModel)]="selectedTimeRange" value="quarter">
                    <label mdbBtn outline="true" color="primary" for="quarter">Quarter</label>
                  </div>
                </div>
              </mdb-card-header>
              <mdb-card-body class="p-4">
                <div class="chart-container" style="height: 350px;">
                  <canvas mdbChart 
                          [data]="progressChartData" 
                          [options]="progressChartOptions"
                          [type]="'line'">
                  </canvas>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
          
          <!-- Topic Performance -->
          <div class="col-lg-4">
            <mdb-card class="topic-performance-card shadow-2-strong h-100">
              <mdb-card-header class="bg-light">
                <h5 class="mb-0">
                  <i class="fas fa-chart-pie me-2"></i>
                  Topic Mastery
                </h5>
              </mdb-card-header>
              <mdb-card-body class="p-4">
                <div class="topic-list">
                  <div class="topic-item mb-3" 
                       *ngFor="let topic of topicPerformance; let i = index">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="topic-name fw-medium">{{topic.name}}</span>
                      <span class="topic-score badge rounded-pill" 
                            [class]="getTopicBadgeClass(topic.masteryLevel)">
                        {{topic.accuracy}}%
                      </span>
                    </div>
                    <mdb-progress 
                      [value]="topic.accuracy" 
                      [color]="getTopicProgressColor(topic.masteryLevel)"
                      height="8"
                      class="mb-1">
                    </mdb-progress>
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">{{topic.questionsCount}} questions</small>
                      <small class="text-muted">{{getMasteryLabel(topic.masteryLevel)}}</small>
                    </div>
                  </div>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity & Achievements -->
      <div class="activity-section">
        <div class="row g-4">
          <!-- Recent Sessions -->
          <div class="col-lg-6">
            <mdb-card class="recent-sessions-card shadow-2-strong">
              <mdb-card-header class="bg-light">
                <h5 class="mb-0">
                  <i class="fas fa-history me-2"></i>
                  Recent Sessions
                </h5>
              </mdb-card-header>
              <mdb-card-body class="p-0">
                <div class="table-responsive">
                  <table mdbTable class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Topic</th>
                        <th scope="col">Questions</th>
                        <th scope="col">Score</th>
                        <th scope="col">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let session of recentSessions">
                        <td>{{session.date | date:'MMM d'}}</td>
                        <td>
                          <span class="badge bg-primary">{{session.topic}}</span>
                        </td>
                        <td>{{session.questionsCount}}</td>
                        <td>
                          <span class="badge" [class]="getScoreBadgeClass(session.accuracy)">
                            {{session.accuracy}}%
                          </span>
                        </td>
                        <td>{{formatDuration(session.durationMinutes)}}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
          
          <!-- Achievements -->
          <div class="col-lg-6">
            <mdb-card class="achievements-card shadow-2-strong">
              <mdb-card-header class="bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="fas fa-trophy me-2"></i>
                  Recent Achievements
                </h5>
                <button mdbBtn color="primary" outline="true" size="sm" 
                        routerLink="/achievements">
                  View All
                </button>
              </mdb-card-header>
              <mdb-card-body class="p-3">
                <div class="achievement-list">
                  <div class="achievement-item d-flex align-items-center p-2 rounded mb-2" 
                       *ngFor="let achievement of recentAchievements"
                       [class]="'achievement-' + achievement.type">
                    <div class="achievement-icon me-3">
                      <img [src]="achievement.badgeUrl" 
                           [alt]="achievement.name"
                           class="achievement-badge">
                    </div>
                    <div class="achievement-details flex-grow-1">
                      <h6 class="achievement-name mb-1">{{achievement.name}}</h6>
                      <p class="achievement-description text-muted small mb-1">
                        {{achievement.description}}
                      </p>
                      <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        {{achievement.earnedDate | date:'MMM d, y'}}
                      </small>
                    </div>
                  </div>
                </div>
                
                <!-- No achievements message -->
                <div class="text-center py-4" *ngIf="recentAchievements.length === 0">
                  <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                  <p class="text-muted">No achievements yet. Keep practicing!</p>
                </div>
              </mdb-card-body>
            </mdb-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parent-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .header-card {
      border-radius: 1.5rem;
      border: none;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    .dashboard-title {
      font-weight: 700;
      color: #1976d2;
    }
    
    .metric-card {
      border-radius: 1.25rem;
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    }
    
    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    
    .chart-card {
      border-radius: 1.25rem;
      border: none;
    }
    
    .topic-item {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .topic-item:last-child {
      border-bottom: none;
    }
    
    .achievement-badge {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .achievement-item {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .achievement-item:hover {
      background-color: #f8f9fa !important;
      transform: translateX(5px);
    }
    
    .achievement-milestone {
      background: linear-gradient(45deg, #ffd700, #ffed4a);
    }
    
    .achievement-streak {
      background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    }
    
    .achievement-mastery {
      background: linear-gradient(45deg, #4ecdc4, #44a08d);
    }
    
    @media (max-width: 768px) {
      .dashboard-header .row {
        text-align: center;
      }
      
      .chart-controls {
        margin-top: 1rem;
      }
      
      .metric-value {
        font-size: 2.5rem !important;
      }
    }
  `]
})
export class ParentDashboardComponent implements OnInit {
  selectedChild: Student;
  selectedChildId: string;
  selectedTimeRange = 'week';
  
  metrics = {
    questionsAnswered: 0,
    questionsGrowth: 0,
    weeklyGoal: 50,
    weeklyGoalProgress: 0,
    accuracyRate: 0,
    gradeAverage: 78,
    totalMinutes: 0,
    weeklyMinutes: 0,
    avgSessionMinutes: 0
  };
  
  progressChartData: any;
  progressChartOptions: any;
  topicPerformance: TopicPerformance[] = [];
  recentSessions: LearningSession[] = [];
  recentAchievements: Achievement[] = [];
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.setupProgressChart();
  }
  
  getTrendBadgeClass(growth: number): string {
    return growth >= 0 ? 'badge-success' : 'badge-danger';
  }
  
  getTrendIcon(growth: number): string {
    return growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  }
  
  getTopicBadgeClass(masteryLevel: string): string {
    switch(masteryLevel) {
      case 'mastered': return 'badge-success';
      case 'proficient': return 'badge-primary'; 
      case 'developing': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }
  
  getTopicProgressColor(masteryLevel: string): string {
    switch(masteryLevel) {
      case 'mastered': return 'success';
      case 'proficient': return 'primary';
      case 'developing': return 'warning';
      default: return 'secondary';
    }
  }
  
  getMasteryLabel(masteryLevel: string): string {
    switch(masteryLevel) {
      case 'mastered': return 'Mastered';
      case 'proficient': return 'Proficient';
      case 'developing': return 'Developing';
      default: return 'Beginning';
    }
  }
  
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }
}
```

---

## 5. MDB 5 Theme Customization

### 5.1 Educational Color System
```scss
// Custom educational theme for MDB 5
:root {
  // Primary Educational Colors
  --mdb-primary: #2196f3;        // Bright blue - primary actions
  --mdb-primary-rgb: 33, 150, 243;
  
  --mdb-secondary: #6c757d;      // Gray - secondary elements
  --mdb-secondary-rgb: 108, 117, 125;
  
  --mdb-success: #4caf50;        // Green - correct answers, achievements
  --mdb-success-rgb: 76, 175, 80;
  
  --mdb-danger: #f44336;         // Red - incorrect answers, errors
  --mdb-danger-rgb: 244, 67, 54;
  
  --mdb-warning: #ff9800;        // Orange - hints, warnings
  --mdb-warning-rgb: 255, 152, 0;
  
  --mdb-info: #00bcd4;           // Cyan - information, tips
  --mdb-info-rgb: 0, 188, 212;
  
  --mdb-light: #f8f9fa;          // Light backgrounds
  --mdb-light-rgb: 248, 249, 250;
  
  --mdb-dark: #212529;           // Dark text
  --mdb-dark-rgb: 33, 37, 41;
}

// Child-friendly component customizations
.btn-child-friendly {
  border-radius: 1.5rem;
  font-weight: 600;
  text-transform: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(-1px);
    transition-duration: 0.1s;
  }
}

// Large touch targets for tablets
.touch-optimized {
  min-width: 44px;
  min-height: 44px;
  
  &.btn {
    min-width: 60px;
    min-height: 60px;
  }
  
  &.btn-lg {
    min-width: 80px;
    min-height: 80px;
  }
}

// Educational card styling
.card-educational {
  border-radius: 1.5rem;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

// Progress visualization enhancements
.progress-educational {
  height: 12px;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.1);
  
  .progress-bar {
    border-radius: 10px;
    transition: width 0.6s ease;
  }
}

// Typography for young learners
.text-child-friendly {
  font-family: 'Comic Neue', 'Open Sans', sans-serif;
  line-height: 1.6;
}

.display-child {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

// Accessibility enhancements
.focus-ring-educational {
  &:focus {
    outline: 3px solid rgba(33, 150, 243, 0.5);
    outline-offset: 2px;
  }
}

// Animation classes for feedback
@keyframes bounce-success {
  0%, 20%, 60%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  80% {
    transform: translateY(-10px);
  }
}

@keyframes shake-error {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-success {
  animation: bounce-success 0.6s ease-in-out;
}

.animate-error {
  animation: shake-error 0.5s ease-in-out;
}
```

### 5.2 Responsive Grid Customization
```scss
// Enhanced responsive utilities for educational content
@media (max-width: 575.98px) {
  .btn-child-friendly {
    width: 100%;
    margin-bottom: 0.75rem;
  }
  
  .metric-card .display-4 {
    font-size: 2rem;
  }
  
  .question-text {
    font-size: 1.5rem;
  }
}

@media (min-width: 768px) {
  .answer-option-btn {
    min-height: 100px;
  }
  
  .keypad-key {
    height: 70px;
    font-size: 1.75rem;
  }
}

@media (min-width: 992px) {
  .parent-dashboard {
    padding: 2rem;
  }
  
  .metric-card:hover {
    transform: translateY(-6px);
  }
}
```

---

## 6. Performance & Accessibility

### 6.1 MDB 5 Bundle Optimization
```typescript
// Selective MDB imports to reduce bundle size
import { MdbAccordionModule } from 'mdb-angular-ui-kit/accordion';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { MdbChartsModule } from 'mdb-angular-ui-kit/charts';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { MdbRippleModule } from 'mdb-angular-ui-kit/ripple';
import { MdbTableModule } from 'mdb-angular-ui-kit/table';

// Tree-shaking configuration in angular.json
"optimization": {
  "scripts": true,
  "styles": {
    "minify": true,
    "inlineCritical": false
  },
  "fonts": true
},
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  }
]
```

### 6.2 Accessibility Service Integration
```typescript
@Injectable({
  providedIn: 'root'
})
export class MdbAccessibilityService {
  
  constructor() {}
  
  enhanceButtonAccessibility(buttonElement: ElementRef): void {
    const button = buttonElement.nativeElement;
    
    // Add ARIA attributes
    if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
      console.warn('Button missing accessible label');
    }
    
    // Add keyboard support
    button.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });
  }
  
  enhanceCardAccessibility(cardElement: ElementRef): void {
    const card = cardElement.nativeElement;
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    
    // Add focus management
    card.addEventListener('focus', () => {
      card.style.outline = '3px solid rgba(33, 150, 243, 0.5)';
    });
    
    card.addEventListener('blur', () => {
      card.style.outline = 'none';
    });
  }
  
  announceToScreenReader(message: string): void {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    setTimeout(() => document.body.removeChild(liveRegion), 1000);
  }
  
  setupKeyboardNavigation(containerElement: ElementRef): void {
    const focusableElements = containerElement.nativeElement.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element: HTMLElement, index: number) => {
      element.addEventListener('keydown', (event: KeyboardEvent) => {
        let targetIndex: number;
        
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault();
            targetIndex = (index + 1) % focusableElements.length;
            (focusableElements[targetIndex] as HTMLElement).focus();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault();
            targetIndex = (index - 1 + focusableElements.length) % focusableElements.length;
            (focusableElements[targetIndex] as HTMLElement).focus();
            break;
            
          case 'Home':
            event.preventDefault();
            (focusableElements[0] as HTMLElement).focus();
            break;
            
          case 'End':
            event.preventDefault();
            (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
            break;
        }
      });
    });
  }
}
```

---

## 7. Implementation Checklist

### 7.1 Sprint 1 MDB 5 Setup (Days 1-2)
- [ ] Install MDB 5 and configure Angular modules
- [ ] Set up educational color theme and typography
- [ ] Create base MDB component service
- [ ] Implement accessibility service foundation
- [ ] Test responsive breakpoints on target devices

### 7.2 Sprint 1 Student Interface (Days 3-4)
- [ ] Build question practice component with MDB cards
- [ ] Implement virtual keyboard with MDB buttons
- [ ] Create feedback modal with MDB modal component
- [ ] Add progress visualization with MDB progress bars
- [ ] Test touch interactions on tablets

### 7.3 Sprint 2 Parent Dashboard (Days 5-8)
- [ ] Create dashboard layout with MDB grid system
- [ ] Implement metric cards with MDB card components
- [ ] Add charts integration with MDB Charts
- [ ] Build data tables with MDB table component
- [ ] Test responsive behavior across devices

### 7.4 Quality Assurance (Throughout)
- [ ] Validate WCAG 2.1 AA compliance
- [ ] Test keyboard navigation flows
- [ ] Verify screen reader compatibility
- [ ] Check color contrast ratios
- [ ] Performance test MDB bundle size
- [ ] Cross-browser compatibility testing

---

**Document Status:** Complete v2.0 - MDB 5 Integration  
**Next Review:** October 25, 2025  
**Implementation Ready:** ✅ Ready for Development

_This specification should be used in conjunction with:_
- _PRD LearningHub AI Platform (Product Requirements)_
- _User Stories Documentation (Functional Specifications)_
