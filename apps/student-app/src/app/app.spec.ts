import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { RouterModule } from '@angular/router';
import { CelebrationModalComponent } from './features/achievements/components/celebration-modal/celebration-modal.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        CelebrationModalComponent, // Standalone component used in app.html
      ],
      declarations: [App, NxWelcome],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Welcome student-app'
    );
  });
});
