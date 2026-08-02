import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
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
  CurriculumData,
  GradeInfo,
  QuestionAnswerOption,
  QuestionItem,
} from '../../services/auth.service';
import { AdminHeaderActionsService } from '../../shared/admin-shell/admin-header-actions.service';
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
export class ExportQuestionsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('headerActions')
  protected headerActionsTemplate?: TemplateRef<unknown>;

  @ViewChild('questionExportSection')
  private questionExportSection?: ElementRef<HTMLElement>;

  @ViewChild('answerExportSection')
  private answerExportSection?: ElementRef<HTMLElement>;

  questions: QuestionItem[] = [];
  grades: GradeInfo[] = [];
  curriculumSubject = 'Mathematics';
  curriculumVersion = '';
  isLoading = true;
  isGeneratingPdf = false;
  error: string | null = null;
  success: string | null = null;

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
  private readonly adminHeader = inject(AdminHeaderActionsService);
  private exportViewReady = false;
  private hasNormalizedQueryParams = false;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.filterGrade = this.parseGradeParam(params['grade']);
    if (params['topic']) {
      this.filterTopic = params['topic'];
    }
    this.filterDifficulty = this.parseDifficultyParam(params['difficulty']);

    if (this.shouldNormalizeQueryParams(params)) {
      this.hasNormalizedQueryParams = true;
      this.updateQueryParams();
    }

    this.authService.getCurriculum().subscribe({
      next: (data: CurriculumData) => {
        this.grades = data.grades;
        const subject = data.subjects?.[0];
        if (subject?.subject) {
          this.curriculumSubject =
            subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1);
        }
        this.curriculumVersion = subject?.version ?? '';
      },
      error: () => {
        this.error = 'Failed to load curriculum filters.';
      },
    });

    this.loadQuestions();
  }

  ngAfterViewInit(): void {
    this.adminHeader.setHeaderActions(this.headerActionsTemplate ?? null);
    this.exportViewReady = true;
  }

  ngOnDestroy(): void {
    this.adminHeader.clearHeaderActions(this.headerActionsTemplate);
  }

  get selectedQuestions(): QuestionItem[] {
    return this.selectedQuestionOrder
      .map((id) => this.selectedQuestionMap.get(id))
      .filter((question): question is QuestionItem => Boolean(question));
  }

  get filteredTopics() {
    if (this.filterGrade === null) return [];
    const grade = this.grades.find((item) => item.grade === this.filterGrade);
    return grade?.topics ?? [];
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get canGeneratePdf(): boolean {
    return this.selectedQuestions.length > 0 && !this.isGeneratingPdf;
  }

  get generatePdfButtonLabel(): string {
    if (this.selectedQuestions.length === 0) {
      return 'Select questions to enable PDF generation';
    }

    if (this.isGeneratingPdf) {
      return 'Generating PDF...';
    }

    return `Generate PDF with ${
      this.selectedQuestions.length
    } selected question${this.selectedQuestions.length === 1 ? '' : 's'}`;
  }

  get pdfQuestionFontClass(): string {
    return this.useLargePdfFont
      ? 'pdf-question-font-large'
      : 'pdf-question-font-standard';
  }

  get pdfSubjectLabel(): string {
    return this.curriculumSubject;
  }

  get pdfCurriculumFooter(): string {
    return this.curriculumVersion
      ? `${this.curriculumSubject} curriculum • ${this.curriculumVersion}`
      : `${this.curriculumSubject} curriculum`;
  }

  get pdfGradeSummary(): string {
    const uniqueGrades = Array.from(
      new Set(this.selectedQuestions.map((question) => question.grade))
    ).sort((left, right) => left - right);

    if (uniqueGrades.length === 0) {
      return 'Year: -';
    }

    if (uniqueGrades.length === 1) {
      return `Year: ${uniqueGrades[0]}`;
    }

    return `Year: ${uniqueGrades.join(', ')}`;
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
    this.resetExportStatus();
  }

  addCurrentPage(): void {
    let hasAddedQuestion = false;

    this.questions.forEach((question) => {
      if (!this.selectedQuestionMap.has(question._id)) {
        this.selectedQuestionMap.set(question._id, question);
        this.selectedQuestionOrder.push(question._id);
        hasAddedQuestion = true;
      }
    });

    if (hasAddedQuestion) {
      this.resetExportStatus();
    }
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestionMap.delete(questionId);
    const index = this.selectedQuestionOrder.indexOf(questionId);
    if (index >= 0) {
      this.selectedQuestionOrder.splice(index, 1);
      this.resetExportStatus();
    }
  }

  clearSelection(): void {
    this.selectedQuestionMap.clear();
    this.selectedQuestionOrder.length = 0;
    this.resetExportStatus();
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
    this.resetExportStatus();
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
    this.resetExportStatus();
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

  optionValue(option: string | QuestionAnswerOption): string {
    return typeof option === 'string' ? option : option.value;
  }

  optionSvgPath(option: string | QuestionAnswerOption): string | null {
    if (typeof option === 'string') {
      return null;
    }
    return option.svgPath ?? null;
  }

  isVisualGrid(question: QuestionItem): boolean {
    return question.visualLayout?.container === 'grid';
  }

  visualGridColumns(question: QuestionItem): string | null {
    if (!this.isVisualGrid(question)) {
      return null;
    }
    const columns = question.visualLayout?.columns ?? Math.min(4, Math.max(1, question.visuals?.length || 1));
    return `repeat(${columns}, minmax(0, 1fr))`;
  }

  answerAssetSvgPath(question: QuestionItem): string | null {
    const answerAssetId = question.answerAssetId;
    if (!answerAssetId) {
      return null;
    }

    return this.resolveAssetSvgPath(question, answerAssetId);
  }

  private resolveAssetSvgPath(question: QuestionItem, assetId: string): string | null {
    const visualMatch = question.visuals?.find((visual) => visual.assetId === assetId && visual.svgPath);
    if (visualMatch?.svgPath) {
      return visualMatch.svgPath;
    }

    const optionMatch = question.options
      .filter((option): option is QuestionAnswerOption => typeof option !== 'string')
      .find((option) => option.assetId === assetId && option.svgPath);

    return optionMatch?.svgPath ?? null;
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

  private resetExportStatus(): void {
    this.success = null;
    this.error = null;
  }

  private parseGradeParam(value: unknown): number | null {
    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    const grade = Number(value);
    return Number.isInteger(grade) && grade >= 0 ? grade : null;
  }

  private parseDifficultyParam(value: unknown): DifficultyFilter {
    if (value === 'easy' || value === 'medium' || value === 'hard') {
      return value;
    }

    return '';
  }

  private shouldNormalizeQueryParams(params: Record<string, unknown>): boolean {
    if (this.hasNormalizedQueryParams) {
      return false;
    }

    const rawGrade = params['grade'];
    const rawDifficulty = params['difficulty'];

    const hasInvalidGrade =
      rawGrade !== undefined && this.parseGradeParam(rawGrade) === null;
    const hasInvalidDifficulty =
      rawDifficulty !== undefined &&
      this.parseDifficultyParam(rawDifficulty) === '';

    return hasInvalidGrade || hasInvalidDifficulty;
  }

  private async addSectionToPdf(
    pdf: PdfDocument,
    element: HTMLElement,
    startOnNewPage: boolean,
    html2canvas: typeof import('html2canvas').default
  ): Promise<void> {
    await this.inlineImagesAsDataUrls(element);
    await this.waitForImagesToLoad(element);

    const imageBoundaries = this.computeImageCanvasBoundaries(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 1200,
    });

    const margin = 10;
    const footerReservedHeight = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin - footerReservedHeight;
    const mmPerCanvasPixel = contentWidth / canvas.width;
    const pageCanvasHeight = Math.max(
      1,
      Math.floor(contentHeight / mmPerCanvasPixel)
    );
    const scaleFactor = canvas.width / element.getBoundingClientRect().width;
    const imageRanges = imageBoundaries.map(({ top, bottom }) => ({
      top: top * scaleFactor,
      bottom: bottom * scaleFactor,
    }));

    if (startOnNewPage) {
      pdf.addPage();
    }

    let offsetY = 0;
    let isFirstPage = true;

    while (offsetY < canvas.height) {
      if (!isFirstPage) {
        pdf.addPage();
      }

      const sliceHeight = this.computeSafeSliceHeight(
        offsetY,
        Math.min(pageCanvasHeight, canvas.height - offsetY),
        imageRanges
      );
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

      this.addPdfFooter(pdf, pageWidth, pageHeight, margin);

      offsetY += sliceHeight;
      isFirstPage = false;
    }
  }

  private addPdfFooter(
    pdf: PdfDocument,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): void {
    const footerTop = pageHeight - 9;
    const footerBaseline = pageHeight - 5;

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.line(margin, footerTop, pageWidth - margin, footerTop);

    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(this.pdfCurriculumFooter, pageWidth - margin, footerBaseline, {
      align: 'right',
    });
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

  private async waitForImagesToLoad(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));
    if (images.length === 0) {
      return;
    }

    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) {
          if (typeof img.decode === 'function') {
            try {
              await img.decode();
            } catch {
              // Ignore decode failures; loaded image can still render.
            }
          }
          return;
        }

        await new Promise<void>((resolve) => {
          const done = () => {
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            resolve();
          };

          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });

        if (typeof img.decode === 'function') {
          try {
            await img.decode();
          } catch {
            // Ignore decode failures; loaded image can still render.
          }
        }
      })
    );
  }

  private computeImageCanvasBoundaries(
    root: HTMLElement
  ): Array<{ top: number; bottom: number }> {
    const rootRect = root.getBoundingClientRect();

    return Array.from(root.querySelectorAll('img')).map((img) => {
      const imgRect = img.getBoundingClientRect();
      return {
        top: imgRect.top - rootRect.top,
        bottom: imgRect.bottom - rootRect.top,
      };
    });
  }

  /** Shrinks a page slice so it never cuts through the middle of an image row; the row moves to the next page instead. */
  private computeSafeSliceHeight(
    offsetY: number,
    naiveSliceHeight: number,
    imageRanges: Array<{ top: number; bottom: number }>
  ): number {
    let cutPosition = offsetY + naiveSliceHeight;

    for (let i = 0; i < 10; i++) {
      const breakingImage = imageRanges.find(
        (range) =>
          range.top >= offsetY &&
          range.top < cutPosition &&
          range.bottom > cutPosition
      );

      if (!breakingImage) {
        break;
      }

      cutPosition = breakingImage.top;
    }

    const safeSliceHeight = cutPosition - offsetY;
    return safeSliceHeight > 0 ? safeSliceHeight : naiveSliceHeight;
  }

  private async inlineImagesAsDataUrls(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));
    if (images.length === 0) {
      return;
    }

    const failedSources: string[] = [];

    await Promise.all(
      images.map(async (img) => {
        const currentSrc = img.getAttribute('src')?.trim();
        if (!currentSrc || currentSrc.startsWith('data:')) {
          return;
        }

        try {
          const absoluteUrl = new URL(currentSrc, window.location.origin).toString();
          const response = await fetch(absoluteUrl, { credentials: 'same-origin' });

          if (!response.ok) {
            return;
          }

          const blob = await response.blob();
          const dataUrl = this.isSvgImageSource(currentSrc, blob)
            ? await this.rasterizeSvgBlobToPngDataUrl(blob, img)
            : await this.blobToDataUrl(blob);
          img.src = dataUrl;
        } catch {
          failedSources.push(currentSrc);
          // Keep original src when inlining fails; waitForImagesToLoad handles load/error.
        }
      })
    );

    if (failedSources.length > 0) {
      console.warn(
        '[ExportQuestions] Failed to inline some images for PDF export:',
        failedSources
      );
    }
  }

  private isSvgImageSource(src: string, blob: Blob): boolean {
    return (
      blob.type.includes('image/svg+xml') ||
      src.toLowerCase().includes('.svg') ||
      src.startsWith('data:image/svg+xml')
    );
  }

  private async rasterizeSvgBlobToPngDataUrl(
    blob: Blob,
    targetImage: HTMLImageElement
  ): Promise<string> {
    const objectUrl = URL.createObjectURL(blob);

    try {
      const loadedImage = await this.loadImageFromUrl(objectUrl);
      const width = Math.max(
        1,
        Math.round(
          targetImage.clientWidth || targetImage.naturalWidth || loadedImage.naturalWidth || 96
        )
      );
      const height = Math.max(
        1,
        Math.round(
          targetImage.clientHeight ||
            targetImage.naturalHeight ||
            loadedImage.naturalHeight ||
            96
        )
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to prepare SVG rasterization canvas.');
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(loadedImage, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        reject(new Error(`Failed to load image for rasterization: ${url}`));
      };
      image.src = url;
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Failed to convert image blob to a data URL.'));
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image blob.'));
      };
      reader.readAsDataURL(blob);
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
