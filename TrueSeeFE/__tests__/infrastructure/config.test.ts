import { validateConfig } from '../../src/infrastructure/config';

const valid = {
  EXPO_PUBLIC_API_BASE_URL: 'http://10.0.2.2:3000/api/v1',
  EXPO_PUBLIC_APP_ENV: 'development',
};

describe('validateConfig', () => {
  it('accepts valid values', () => {
    expect(validateConfig(valid)).toEqual({
      ok: true,
      config: {
        apiBaseUrl: 'http://10.0.2.2:3000/api/v1',
        appEnv: 'development',
      },
    });
  });

  it.each([
    'http://192.168.1.20:3000/api/v1',
    'https://api.example.com/api/v1',
  ])('accepts base URL %s', (url) => {
    expect(validateConfig({ ...valid, EXPO_PUBLIC_API_BASE_URL: url }).ok).toBe(
      true,
    );
  });

  it('accepts the test environment', () => {
    expect(
      validateConfig({ ...valid, EXPO_PUBLIC_APP_ENV: 'test' }),
    ).toMatchObject({
      ok: true,
      config: { appEnv: 'test' },
    });
  });

  it.each([
    [undefined, 'missing'],
    ['', 'empty'],
    ['10.0.2.2:3000/api/v1', 'not absolute'],
    ['ftp://10.0.2.2/api/v1', 'not http(s)'],
    ['http://10.0.2.2:3000/api/v1/', 'trailing slash'],
    ['http://10.0.2.2:3000', 'not ending in /api/v1'],
    ['http://10.0.2.2:3000/api/v2', 'wrong version'],
  ])('rejects base URL %p (%s) and names the variable', (url, _reason) => {
    expect(validateConfig({ ...valid, EXPO_PUBLIC_API_BASE_URL: url })).toEqual(
      {
        ok: false,
        variable: 'EXPO_PUBLIC_API_BASE_URL',
      },
    );
  });

  it.each([undefined, '', 'production', 'Development'])(
    'rejects app env %p and names the variable',
    (appEnv) => {
      expect(validateConfig({ ...valid, EXPO_PUBLIC_APP_ENV: appEnv })).toEqual(
        {
          ok: false,
          variable: 'EXPO_PUBLIC_APP_ENV',
        },
      );
    },
  );
});
