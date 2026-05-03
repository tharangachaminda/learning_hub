import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AuthService,
  GradeInfo,
  QuestionItem,
} from '../../services/auth.service';
import { KatexRenderComponent } from '../../shared/katex-render/katex-render';

type DifficultyFilter = '' | 'easy' | 'medium' | 'hard';
type PdfDocument = InstanceType<typeof import('jspdf').default>;

@Component({
  selector: 'app-export-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    KatexRenderComponent,
  ],
  templateUrl: './export-questions.html',
  styleUrl: './export-questions.scss',
})
export class ExportQuestionsComponent implements OnInit, AfterViewChecked {
  @ViewChild('questionExportSection')
  private questionExportSection?: ElementRef<HTMLElement>;

  @ViewChild('answerExportSection')
  private answerExportSection?: ElementRef<HTMLElement>;

  questions: QuestionItem[] = [];
  grades: GradeInfo[] = [];
  isLoading = true;
  isGeneratingPdf = false;
  error: string | null = null;
  success: string | null = null;
  userName = '';
  userRole = '';

  filterGrade: number | null = null;
  filterTopic = '';
  filterDifficulty: DifficultyFilter = '';

  includeAnswerSheet = false;
  exportTitle = 'LearningHub Worksheet';
  useLargePdfFont = false;

  currentPage = 1;
  pageSize = 12;
  totalItems = 0;

  private readonly selectedQuestionMap = new Map<string, QuestionItem>();
  private readonly selectedQuestionOrder: string[] = [];
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private exportViewReady = false;

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName = user?.name ?? 'Teacher';
    this.userRole = user?.role ?? 'teacher';

    const params = this.route.snapshot.queryParams;
    if (params['grade']) {
      this.filterGrade = +params['grade'];
    }
    if (params['topic']) {
      this.filterTopic = params['topic'];
    }
    if (params['difficulty']) {
      this.filterDifficulty = params['difficulty'] as DifficultyFilter;
    }

    this.authService.getCurriculum().subscribe({
      next: (data) => (this.grades = data.grades),
      error: () => {
        this.error = 'Failed to load curriculum filters.';
      },
    });

    this.loadQuestions();
  }

  ngAfterViewChecked(): void {
    this.exportViewReady = true;
  }

  get selectedQuestions(): QuestionItem[] {
    return this.selectedQuestionOrder
      .map((id) => this.selectedQuestionMap.get(id))
      .filter((question): question is QuestionItem => Boolean(question));
  }

  get filteredTopics() {
    if (!this.filterGrade) return [];
    const grade = this.grades.find((item) => item.grade === this.filterGrade);
    return grade?.topics ?? [];
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get canGeneratePdf(): boolean {
    return this.selectedQuestions.length > 0 && !this.isGeneratingPdf;
  }

  get pdfQuestionFontClass(): string {
    return this.useLargePdfFont
      ? 'pdf-question-font-large'
      : 'pdf-question-font-standard';
  }

  get pdfSubjectLabel(): string {
    return 'Mathematics';
  }

  get pdfGradeSummary(): string {
    const uniqueGrades = Array.from(
      new Set(this.selectedQuestions.map((question) => question.grade))
    ).sort((left, right) => left - right);

    if (uniqueGrades.length === 0) {
      return 'Year/Grade: -';
    }

    if (uniqueGrades.length === 1) {
      return `Year/Grade: ${uniqueGrades[0]}`;
    }

    return `Year/Grade: ${uniqueGrades.join(', ')}`;
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.authService
      .getQuestions({
        grade: this.filterGrade ?? undefined,
        topic: this.filterTopic || undefined,
        difficulty: this.filterDifficulty || undefined,
        status: 'approved',
        page: this.currentPage,
        limit: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.questions = result.data;
          this.totalItems = result.total;
          this.syncLoadedQuestionsIntoSelection();
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load approved questions for export.';
          this.isLoading = false;
        },
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
    this.loadQuestions();
  }

  onGradeChange(): void {
    this.filterTopic = '';
    this.onFilterChange();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadQuestions();
  }

  isSelected(questionId: string): boolean {
    return this.selectedQuestionMap.has(questionId);
  }

  toggleQuestion(question: QuestionItem): void {
    if (this.isSelected(question._id)) {
      this.removeQuestion(question._id);
      return;
    }

    this.selectedQuestionMap.set(question._id, question);
    this.selectedQuestionOrder.push(question._id);
  }

  addCurrentPage(): void {
    this.questions.forEach((question) => {
      if (!this.selectedQuestionMap.has(question._id)) {
        this.selectedQuestionMap.set(question._id, question);
        this.selectedQuestionOrder.push(question._id);
      }
    });
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestionMap.delete(questionId);
    const index = this.selectedQuestionOrder.indexOf(questionId);
    if (index >= 0) {
      this.selectedQuestionOrder.splice(index, 1);
    }
  }

  clearSelection(): void {
    this.selectedQuestionMap.clear();
    this.selectedQuestionOrder.length = 0;
    this.success = null;
  }

  moveQuestion(questionId: string, direction: -1 | 1): void {
    const index = this.selectedQuestionOrder.indexOf(questionId);
    const targetIndex = index + direction;

    if (
      index === -1 ||
      targetIndex < 0 ||
      targetIndex >= this.selectedQuestionOrder.length
    ) {
      return;
    }

    const [item] = this.selectedQuestionOrder.splice(index, 1);
    this.selectedQuestionOrder.splice(targetIndex, 0, item);
  }

  dropSelectedQuestion(event: CdkDragDrop<QuestionItem[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(
      this.selectedQuestionOrder,
      event.previousIndex,
      event.currentIndex
    );
    this.success = null;
  }

  async generatePdf(): Promise<void> {
    if (!this.canGeneratePdf) {
      return;
    }

    this.isGeneratingPdf = true;
    this.error = null;
    this.success = null;

    try {
      await this.waitForExportView();

      const [{ default: html2canvas }, { default: JsPdf }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const questionSection = this.questionExportSection?.nativeElement;
      if (!questionSection) {
        throw new Error('The worksheet preview is not ready yet.');
      }

      const pdf = new JsPdf({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });
      await this.addSectionToPdf(pdf, questionSection, false, html2canvas);

      if (this.includeAnswerSheet) {
        const answerSection = this.answerExportSection?.nativeElement;
        if (!answerSection) {
          throw new Error('The answer sheet preview is not ready yet.');
        }
        await this.addSectionToPdf(pdf, answerSection, true, html2canvas);
      }

      pdf.save(this.buildFileName());
      this.success = 'PDF generated successfully.';
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : 'Failed to generate the worksheet PDF.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  topicLabel(topic: string): string {
    for (const grade of this.grades) {
      const found = grade.topics.find((item) => item.key === topic);
      if (found) return found.label;
    }

    return topic
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  difficultyLabel(difficulty: string | undefined): string {
    return (difficulty || 'medium').replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private syncLoadedQuestionsIntoSelection(): void {
    for (const question of this.questions) {
      if (this.selectedQuestionMap.has(question._id)) {
        this.selectedQuestionMap.set(question._id, question);
      }
    }
  }

  private updateQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        grade: this.filterGrade ?? null,
        topic: this.filterTopic || null,
        difficulty: this.filterDifficulty || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private async addSectionToPdf(
    pdf: PdfDocument,
    element: HTMLElement,
    startOnNewPage: boolean,
    html2canvas: typeof import('html2canvas').default
  ): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 1200,
    });

    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const mmPerCanvasPixel = contentWidth / canvas.width;
    const pageCanvasHeight = Math.max(
      1,
      Math.floor(contentHeight / mmPerCanvasPixel)
    );

    if (startOnNewPage) {
      pdf.addPage();
    }

    let offsetY = 0;
    let isFirstPage = true;

    while (offsetY < canvas.height) {
      if (!isFirstPage) {
        pdf.addPage();
      }

      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - offsetY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const context = pageCanvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to prepare the PDF page canvas.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeight,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      const sliceHeightMm = sliceHeight * mmPerCanvasPixel;
      pdf.addImage(
        pageCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        contentWidth,
        sliceHeightMm
      );

      offsetY += sliceHeight;
      isFirstPage = false;
    }
  }

  private async waitForExportView(): Promise<void> {
    if (this.exportViewReady) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
      return;
    }

    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (this.exportViewReady) {
          requestAnimationFrame(() => resolve());
          return;
        }
        requestAnimationFrame(checkReady);
      };
      checkReady();
    });
  }

  private buildFileName(): string {
    const dateLabel = new Date().toISOString().slice(0, 10);
    const slug = this.exportTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${slug || 'learninghub-worksheet'}-${dateLabel}.pdf`;
  }
}
