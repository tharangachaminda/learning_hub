import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import {
  AuthService,
  GradeInfo,
  GradeTopic,
  BatchGenerateResponse,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';

@Component({
  selector: 'app-generate-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    KatexRenderComponent,
    FontAwesomeModule,
  ],
  templateUrl: './generate-questions.html',
  styleUrl: './generate-questions.scss',
})
export class GenerateQuestionsComponent implements OnInit {
  grades: GradeInfo[] = [];
  selectedGrade: number | null = null;
  availableTopics: GradeTopic[] = [];
  selectedTopic = '';
  selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  count = 5;
  isLoadingCurriculum = true;
  isGenerating = false;
  error: string | null = null;
  result: BatchGenerateResponse | null = null;
  protected readonly generateIcon = faWandMagicSparkles;
  protected readonly arrowIcon = faArrowRight;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get canGenerate(): boolean {
    return Boolean(this.selectedGrade && this.selectedTopic);
  }

  ngOnInit(): void {
    this.authService.getCurriculum().subscribe({
      next: (data) => {
        this.grades = data.grades;
        this.isLoadingCurriculum = false;
      },
      error: () => {
        this.error = 'Failed to load curriculum data.';
        this.isLoadingCurriculum = false;
      },
    });
  }

  onGradeChange(): void {
    const grade = this.grades.find((g) => g.grade === this.selectedGrade);
    this.availableTopics = grade?.topics ?? [];
    this.selectedTopic = '';
    this.result = null;
  }

  generate(): void {
    if (!this.canGenerate) return;

    const grade = this.selectedGrade;
    const topic = this.selectedTopic;

    if (grade === null || !topic) return;

    this.isGenerating = true;
    this.error = null;
    this.result = null;

    this.authService
      .batchGenerate({
        grade,
        topic,
        count: this.count,
        difficulty: this.selectedDifficulty,
      })
      .subscribe({
        next: (res) => {
          this.result = res;
          this.isGenerating = false;
        },
        error: (err) => {
          this.error =
            err?.error?.error ||
            err?.error?.message ||
            'Question generation failed. Is Ollama running?';
          this.isGenerating = false;
        },
      });
  }

  getTopicLabel(key: string): string {
    const topic = this.availableTopics.find((t) => t.key === key);
    return topic?.label ?? key;
  }

  navigateToReview(): void {
    this.router.navigate(['/review']);
  }
}
