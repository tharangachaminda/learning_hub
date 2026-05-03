import { CanDeactivateFn } from '@angular/router';

export interface PendingPracticeExit {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const questionGeneratorPendingExitGuard: CanDeactivateFn<
  PendingPracticeExit
> = (component) => component.canDeactivate();
