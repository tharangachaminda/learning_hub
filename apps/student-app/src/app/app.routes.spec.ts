import { appRoutes } from './app.routes';
import { Registration } from './features/registration';
import { Login } from './features/login/login';
import { QuestionGeneratorComponent } from './features/practice/question-generator/question-generator';
import { authGuard } from './guards/auth.guard';

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

  it('should contain a /login route', () => {
    const loginRoute = appRoutes.find((r) => r.path === 'login');
    expect(loginRoute).toBeDefined();
  });

  it('should map /login to Login component', () => {
    const loginRoute = appRoutes.find((r) => r.path === 'login');
    expect(loginRoute?.component).toBe(Login);
  });

  it('should set title for /login route', () => {
    const loginRoute = appRoutes.find((r) => r.path === 'login');
    expect(loginRoute?.title).toBe('Student Login');
  });

  it('should protect /achievements route with authGuard', () => {
    const achievementsRoute = appRoutes.find((r) => r.path === 'achievements');
    expect(achievementsRoute?.canActivate).toContain(authGuard);
  });

  it('should protect /practice route with authGuard', () => {
    const practiceRoute = appRoutes.find((r) => r.path === 'practice');
    expect(practiceRoute?.canActivate).toContain(authGuard);
  });

  it('should not protect /login route with authGuard', () => {
    const loginRoute = appRoutes.find((r) => r.path === 'login');
    expect(loginRoute?.canActivate).toBeUndefined();
  });

  it('should not protect /register route with authGuard', () => {
    const registerRoute = appRoutes.find((r) => r.path === 'register');
    expect(registerRoute?.canActivate).toBeUndefined();
  });

  it('should redirect default path to login', () => {
    const defaultRoute = appRoutes.find((r) => r.path === '' && r.redirectTo);
    expect(defaultRoute?.redirectTo).toBe('login');
  });
});
