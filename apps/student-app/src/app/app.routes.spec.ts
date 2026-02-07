import { appRoutes } from './app.routes';
import { Registration } from './features/registration';

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
});
