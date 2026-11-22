export type AppEnv = 'development' | 'test';

export interface AppConfig {
  apiBaseUrl: string;
  appEnv: AppEnv;
}

export type ConfigVariable = 'EXPO_PUBLIC_API_BASE_URL' | 'EXPO_PUBLIC_APP_ENV';

export type ConfigResult =
  { ok: true; config: AppConfig } | { ok: false; variable: ConfigVariable };

type RawConfig = Partial<Record<ConfigVariable, string | undefined>>;

const API_BASE_URL = /^https?:\/\/[^\s/]+(\/[^\s]*)?\/api\/v1$/;

export function validateConfig(raw: RawConfig): ConfigResult {
  const apiBaseUrl = raw.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl || !API_BASE_URL.test(apiBaseUrl)) {
    return { ok: false, variable: 'EXPO_PUBLIC_API_BASE_URL' };
  }
  const appEnv = raw.EXPO_PUBLIC_APP_ENV;
  if (appEnv !== 'development' && appEnv !== 'test') {
    return { ok: false, variable: 'EXPO_PUBLIC_APP_ENV' };
  }
  return { ok: true, config: { apiBaseUrl, appEnv } };
}

export function readConfig(): ConfigResult {
  // Expo inlines EXPO_PUBLIC_* only for direct `process.env.NAME` access, so no destructuring.
  return validateConfig({
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  });
}
