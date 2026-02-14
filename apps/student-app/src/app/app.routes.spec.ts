import { appRoutes } from './app.routes';
import { Registration } from './features/registration';
import { QuestionGeneratorComponent } from './features/practice/question-generator/question-generator';

describe('appRoutes', () => {
  it('should contain a /register route', () => {
    const registerRoute = appRoutes.find((r) => r.path === 'register');
    expect(registerRoute).toBeDefined();
  });

  it('should map /register to Registration component', () => {
    const registerRoute = appRoutes.find((r) => r.path === 'register');
    expect(registerRoute?.component).toBe(Registration);
  });

  it('should set title for /register route', () => {
    const registerRoute = appRoutes.find((r) => r.path === 'register');
    expect(registerRoute?.title).toBe('Student Registration');
  });

  it('should contain a /practice/generate route', () => {
    const practiceRoute = appRoutes.find((r) => r.path === 'practice');
    const generateRoute = practiceRoute?.children?.find(
      (r) => r.path === 'generate'
    );
    expect(generateRoute).toBeDefined();
  });

  it('should map /practice/generate to QuestionGeneratorComponent', () => {
    const practiceRoute = appRoutes.find((r) => r.path === 'practice');
    const generateRoute = practiceRoute?.children?.find(
      (r) => r.path === 'generate'
    );
    expect(generateRoute?.component).toBe(QuestionGeneratorComponent);
  });

  it('should set title for /practice/generate route', () => {
    const practiceRoute = appRoutes.find((r) => r.path === 'practice');
    const generateRoute = practiceRoute?.children?.find(
      (r) => r.path === 'generate'
    );
    expect(generateRoute?.title).toBe('AI Question Generator');
  });
});
