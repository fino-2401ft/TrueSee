import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { type Env, type EnvError, parseEnv } from './env.schema.js';

export class ConfigInvalidError extends Error {
  readonly code = 'CONFIG_INVALID';

  constructor(readonly errors: EnvError[]) {
    super(
      `Invalid configuration: ${errors.map((e) => `${e.variable} ${e.message}`).join('; ')}`,
    );
    this.name = 'ConfigInvalidError';
  }
}

export class AppConfigService {
  constructor(readonly values: Readonly<Env>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.values[key];
  }
}

// Validation runs when the application is created (not when this file is imported), so that
// bootstrap can catch ConfigInvalidError, log CONFIG_INVALID, and exit.
export function loadConfig(
  raw: Record<string, string | undefined> = process.env,
): AppConfigService {
  const result = parseEnv(raw);
  if (!result.ok) {
    throw new ConfigInvalidError(result.errors);
  }
  return new AppConfigService(Object.freeze(result.env));
}

@Global()
@Module({
  // Loads TrueSeeBE/.env into process.env; variables already set in the environment win.
  imports: [ConfigModule.forRoot({ cache: false })],
  providers: [{ provide: AppConfigService, useFactory: () => loadConfig() }],
  exports: [AppConfigService],
})
export class AppConfigModule {}
