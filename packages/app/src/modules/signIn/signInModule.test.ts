import { signInProviders } from './signInModule';

describe('signInProviders', () => {
  it('offers only GitHub in production', () => {
    expect(signInProviders('production')).toEqual([
      expect.objectContaining({ id: 'github-auth-provider' }),
    ]);
  });

  it('adds the guest option outside production', () => {
    expect(signInProviders('development')).toEqual([
      'guest',
      expect.objectContaining({ id: 'github-auth-provider' }),
    ]);
    expect(signInProviders(undefined)).toContain('guest');
  });
});
