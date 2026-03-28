import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata with the provided roles', () => {
    // The decorator factory returns a function that sets metadata
    @Roles('admin', 'teacher')
    class TestClass {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestClass);
    expect(roles).toEqual(['admin', 'teacher']);
  });

  it('should set single role metadata', () => {
    @Roles('admin')
    class TestClass {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestClass);
    expect(roles).toEqual(['admin']);
  });
});
