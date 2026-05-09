import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminHeaderActionsService {
  private readonly headerActionsTemplate = signal<TemplateRef<unknown> | null>(
    null
  );

  readonly headerActions = this.headerActionsTemplate.asReadonly();

  setHeaderActions(template: TemplateRef<unknown> | null): void {
    this.headerActionsTemplate.set(template);
  }

  clearHeaderActions(template?: TemplateRef<unknown>): void {
    if (!template || this.headerActionsTemplate() === template) {
      this.headerActionsTemplate.set(null);
    }
  }
}
